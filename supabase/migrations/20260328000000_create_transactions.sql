-- Migration : création de la table transactions
-- Ticket #47 — historique des achats/ventes

CREATE TABLE IF NOT EXISTS public.transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id  uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  ticker       text NOT NULL,
  type         text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity     numeric NOT NULL CHECK (quantity > 0),
  price        numeric NOT NULL CHECK (price > 0),
  total        numeric NOT NULL CHECK (total > 0),
  executed_at  timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX transactions_position_id_idx ON public.transactions(position_id);

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
