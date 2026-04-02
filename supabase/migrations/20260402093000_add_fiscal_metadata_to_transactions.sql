-- Ticket #75 — métadonnées fiscales persistées sur l'historique

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS envelope text,
  ADD COLUMN IF NOT EXISTS asset_type public.asset_type,
  ADD COLUMN IF NOT EXISTS realized_gain numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0;

UPDATE public.transactions t
SET
  envelope = COALESCE(t.envelope, p.envelope),
  asset_type = COALESCE(t.asset_type, p.type)
FROM public.positions p
WHERE t.position_id = p.id;

UPDATE public.transactions
SET envelope = ticker
WHERE envelope IS NULL
  AND type IN ('deposit', 'withdraw')
  AND ticker IN ('PEA', 'PEA-PME', 'CTO', 'Crypto', 'Autre');

CREATE OR REPLACE FUNCTION buy_position(
  p_position_id uuid,
  p_user_id uuid,
  p_quantity numeric,
  p_price numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_qty    numeric;
  v_old_pru    numeric;
  v_new_qty    numeric;
  v_new_pru    numeric;
  v_ticker     text;
  v_envelope   text;
  v_asset_type public.asset_type;
  v_total      numeric;
  v_result     json;
BEGIN
  SELECT quantity, pru, ticker, envelope, type
    INTO v_old_qty, v_old_pru, v_ticker, v_envelope, v_asset_type
    FROM positions WHERE id = p_position_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Position introuvable'; END IF;

  v_new_qty := v_old_qty + p_quantity;
  v_new_pru := (v_old_qty * v_old_pru + p_quantity * p_price) / v_new_qty;
  v_total   := p_quantity * p_price;

  UPDATE positions SET quantity = v_new_qty, pru = v_new_pru, updated_at = now()
    WHERE id = p_position_id AND user_id = p_user_id;

  INSERT INTO transactions (
    user_id,
    position_id,
    ticker,
    type,
    quantity,
    price,
    total,
    tax_amount,
    envelope,
    asset_type,
    realized_gain,
    tax_rate
  )
    VALUES (
      p_user_id,
      p_position_id,
      v_ticker,
      'buy',
      p_quantity,
      p_price,
      v_total,
      0,
      COALESCE(v_envelope, 'Autre'),
      v_asset_type,
      0,
      0
    );

  INSERT INTO liquidities (user_id, envelope, amount, updated_at)
    VALUES (p_user_id, COALESCE(v_envelope, 'Autre'), -v_total, now())
    ON CONFLICT (user_id, envelope)
    DO UPDATE SET amount = liquidities.amount - v_total, updated_at = now();

  SELECT row_to_json(p) INTO v_result FROM positions p WHERE id = p_position_id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION sell_position(
  p_position_id uuid,
  p_user_id uuid,
  p_quantity numeric,
  p_price numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_qty    numeric;
  v_ticker     text;
  v_pru        numeric;
  v_envelope   text;
  v_asset_type public.asset_type;
  v_gain       numeric;
  v_tax        numeric;
  v_tax_rate   numeric;
  v_net        numeric;
  v_result     json;
BEGIN
  SELECT quantity, ticker, pru, envelope, type
    INTO v_old_qty, v_ticker, v_pru, v_envelope, v_asset_type
    FROM positions WHERE id = p_position_id AND user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Position introuvable'; END IF;
  IF p_quantity > v_old_qty THEN RAISE EXCEPTION 'Quantité vendue supérieure à la quantité détenue'; END IF;

  v_gain := (p_price - v_pru) * p_quantity;
  IF COALESCE(v_envelope, 'Autre') = 'PEA' OR COALESCE(v_envelope, 'Autre') = 'PEA-PME' THEN
    v_tax_rate := 0;
    v_tax := 0;
  ELSE
    v_tax_rate := 0.30;
    v_tax := GREATEST(0, v_gain) * v_tax_rate;
  END IF;
  v_net := p_price * p_quantity - v_tax;

  INSERT INTO transactions (
    user_id,
    position_id,
    ticker,
    type,
    quantity,
    price,
    total,
    tax_amount,
    envelope,
    asset_type,
    realized_gain,
    tax_rate
  )
    VALUES (
      p_user_id,
      p_position_id,
      v_ticker,
      'sell',
      p_quantity,
      p_price,
      p_price * p_quantity,
      v_tax,
      COALESCE(v_envelope, 'Autre'),
      v_asset_type,
      v_gain,
      v_tax_rate
    );

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

  INSERT INTO transactions (
    user_id,
    position_id,
    ticker,
    type,
    quantity,
    price,
    total,
    tax_amount,
    envelope,
    asset_type,
    realized_gain,
    tax_rate
  )
    VALUES (
      p_user_id,
      null,
      p_envelope,
      p_type,
      1,
      p_amount,
      p_amount,
      0,
      p_envelope,
      null,
      0,
      0
    );

  SELECT row_to_json(l) INTO v_result FROM liquidities l
    WHERE l.user_id = p_user_id AND l.envelope = p_envelope;
  RETURN v_result;
END;
$$;
