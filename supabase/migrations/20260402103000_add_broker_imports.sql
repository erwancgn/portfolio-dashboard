-- Ticket fiscalité — imports broker PDF (Trade Republic)

CREATE TABLE IF NOT EXISTS public.broker_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker text NOT NULL,
  filename text NOT NULL,
  file_hash text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  source_year integer,
  status text NOT NULL DEFAULT 'processed',
  raw_text text,
  parser_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS broker_imports_user_id_file_hash_idx
  ON public.broker_imports(user_id, file_hash);

CREATE INDEX IF NOT EXISTS broker_imports_user_id_imported_at_idx
  ON public.broker_imports(user_id, imported_at DESC);

ALTER TABLE public.broker_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_imports_select_own"
  ON public.broker_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "broker_imports_insert_own"
  ON public.broker_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.broker_import_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES public.broker_imports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker text NOT NULL,
  event_type text NOT NULL,
  label text NOT NULL,
  asset_name text,
  ticker text,
  isin text,
  quantity numeric,
  unit_price numeric,
  gross_amount numeric,
  net_amount numeric,
  tax_amount numeric NOT NULL DEFAULT 0,
  fee_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  executed_at timestamptz,
  raw_block text
);

CREATE INDEX IF NOT EXISTS broker_import_events_user_id_executed_at_idx
  ON public.broker_import_events(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS broker_import_events_import_id_idx
  ON public.broker_import_events(import_id);

ALTER TABLE public.broker_import_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_import_events_select_own"
  ON public.broker_import_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "broker_import_events_insert_own"
  ON public.broker_import_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
