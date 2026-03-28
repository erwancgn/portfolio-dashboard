-- Colonne tax_amount sur transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0;

-- Mettre à jour la contrainte type pour autoriser deposit/withdraw
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('buy', 'sell', 'deposit', 'withdraw'));

-- Table liquidities
CREATE TABLE IF NOT EXISTS public.liquidities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  envelope     text NOT NULL,
  amount       numeric NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, envelope)
);

ALTER TABLE public.liquidities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liquidities_select_own" ON public.liquidities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "liquidities_insert_own" ON public.liquidities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "liquidities_update_own" ON public.liquidities FOR UPDATE USING (auth.uid() = user_id);

-- RPC buy_position mise à jour (déduit des liquidités)
CREATE OR REPLACE FUNCTION buy_position(
  p_position_id uuid,
  p_user_id uuid,
  p_quantity numeric,
  p_price numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_qty  numeric;
  v_old_pru  numeric;
  v_new_qty  numeric;
  v_new_pru  numeric;
  v_ticker   text;
  v_envelope text;
  v_total    numeric;
  v_result   json;
BEGIN
  SELECT quantity, pru, ticker, envelope
    INTO v_old_qty, v_old_pru, v_ticker, v_envelope
    FROM positions WHERE id = p_position_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Position introuvable'; END IF;

  v_new_qty := v_old_qty + p_quantity;
  v_new_pru := (v_old_qty * v_old_pru + p_quantity * p_price) / v_new_qty;
  v_total   := p_quantity * p_price;

  UPDATE positions SET quantity = v_new_qty, pru = v_new_pru, updated_at = now()
    WHERE id = p_position_id AND user_id = p_user_id;

  INSERT INTO transactions (user_id, position_id, ticker, type, quantity, price, total, tax_amount)
    VALUES (p_user_id, p_position_id, v_ticker, 'buy', p_quantity, p_price, v_total, 0);

  INSERT INTO liquidities (user_id, envelope, amount, updated_at)
    VALUES (p_user_id, COALESCE(v_envelope, 'Autre'), -v_total, now())
    ON CONFLICT (user_id, envelope)
    DO UPDATE SET amount = liquidities.amount - v_total, updated_at = now();

  SELECT row_to_json(p) INTO v_result FROM positions p WHERE id = p_position_id;
  RETURN v_result;
END;
$$;

-- RPC sell_position mise à jour (fiscalité + liquidités)
CREATE OR REPLACE FUNCTION sell_position(
  p_position_id uuid,
  p_user_id uuid,
  p_quantity numeric,
  p_price numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_qty  numeric;
  v_ticker   text;
  v_pru      numeric;
  v_envelope text;
  v_gain     numeric;
  v_tax      numeric;
  v_net      numeric;
  v_result   json;
BEGIN
  SELECT quantity, ticker, pru, envelope
    INTO v_old_qty, v_ticker, v_pru, v_envelope
    FROM positions WHERE id = p_position_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Position introuvable'; END IF;
  IF p_quantity > v_old_qty THEN RAISE EXCEPTION 'Quantité vendue supérieure à la quantité détenue'; END IF;

  v_gain := (p_price - v_pru) * p_quantity;
  IF COALESCE(v_envelope, 'Autre') = 'PEA' THEN
    v_tax := 0;
  ELSE
    v_tax := GREATEST(0, v_gain) * 0.30;
  END IF;
  v_net := p_price * p_quantity - v_tax;

  INSERT INTO transactions (user_id, position_id, ticker, type, quantity, price, total, tax_amount)
    VALUES (p_user_id, p_position_id, v_ticker, 'sell', p_quantity, p_price, p_price * p_quantity, v_tax);

  INSERT INTO liquidities (user_id, envelope, amount, updated_at)
    VALUES (p_user_id, COALESCE(v_envelope, 'Autre'), v_net, now())
    ON CONFLICT (user_id, envelope)
    DO UPDATE SET amount = liquidities.amount + v_net, updated_at = now();

  IF p_quantity = v_old_qty THEN
    DELETE FROM positions WHERE id = p_position_id AND user_id = p_user_id;
    RETURN null;
  ELSE
    UPDATE positions SET quantity = v_old_qty - p_quantity, updated_at = now()
      WHERE id = p_position_id AND user_id = p_user_id;
    SELECT row_to_json(p) INTO v_result FROM positions p WHERE id = p_position_id;
    RETURN v_result;
  END IF;
END;
$$;

-- RPC deposit_liquidity (apport/retrait manuel)
CREATE OR REPLACE FUNCTION deposit_liquidity(
  p_user_id uuid,
  p_envelope text,
  p_amount   numeric,
  p_type     text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result json;
BEGIN
  IF p_type NOT IN ('deposit', 'withdraw') THEN
    RAISE EXCEPTION 'Type invalide';
  END IF;

  INSERT INTO liquidities (user_id, envelope, amount, updated_at)
    VALUES (p_user_id, p_envelope, p_amount, now())
    ON CONFLICT (user_id, envelope)
    DO UPDATE SET amount = liquidities.amount + p_amount, updated_at = now();

  INSERT INTO transactions (user_id, position_id, ticker, type, quantity, price, total, tax_amount)
    VALUES (p_user_id, null, p_envelope, p_type, 1, p_amount, p_amount, 0);

  SELECT row_to_json(l) INTO v_result FROM liquidities l
    WHERE l.user_id = p_user_id AND l.envelope = p_envelope;
  RETURN v_result;
END;
$$;
