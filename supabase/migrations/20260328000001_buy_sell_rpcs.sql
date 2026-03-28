-- Migration: buy_position et sell_position en RPC atomiques
-- Ces fonctions garantissent l'atomicité : mise à jour position + insertion transaction
-- dans une seule transaction PostgreSQL (SECURITY DEFINER pour contourner RLS depuis le serveur).

CREATE OR REPLACE FUNCTION buy_position(
  p_position_id uuid,
  p_user_id uuid,
  p_quantity numeric,
  p_price numeric
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_qty numeric;
  v_old_pru numeric;
  v_new_qty numeric;
  v_new_pru numeric;
  v_ticker text;
  v_result json;
BEGIN
  SELECT quantity, pru, ticker INTO v_old_qty, v_old_pru, v_ticker
  FROM positions WHERE id = p_position_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position introuvable';
  END IF;

  v_new_qty := v_old_qty + p_quantity;
  v_new_pru := (v_old_qty * v_old_pru + p_quantity * p_price) / v_new_qty;

  UPDATE positions SET quantity = v_new_qty, pru = v_new_pru, updated_at = now()
  WHERE id = p_position_id AND user_id = p_user_id;

  INSERT INTO transactions (user_id, position_id, ticker, type, quantity, price, total)
  VALUES (p_user_id, p_position_id, v_ticker, 'buy', p_quantity, p_price, p_quantity * p_price);

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
  v_old_qty numeric;
  v_ticker text;
  v_result json;
BEGIN
  SELECT quantity, ticker INTO v_old_qty, v_ticker
  FROM positions WHERE id = p_position_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position introuvable';
  END IF;

  IF p_quantity > v_old_qty THEN
    RAISE EXCEPTION 'Quantité vendue supérieure à la quantité détenue';
  END IF;

  INSERT INTO transactions (user_id, position_id, ticker, type, quantity, price, total)
  VALUES (p_user_id, p_position_id, v_ticker, 'sell', p_quantity, p_price, p_quantity * p_price);

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
