-- ============================================================
-- Portfolio Dashboard IA — Migration initiale
-- Crée toutes les tables avec RLS activé
-- ============================================================

-- ============================================================
-- POSITIONS
-- Une ligne = un titre dans le portfolio
-- ============================================================
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  ticker text NOT NULL,
  name text,
  isin text,
  quantity numeric NOT NULL DEFAULT 0,
  pru numeric NOT NULL DEFAULT 0,        -- Prix de Revient Unitaire
  current_price numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  envelope text,                          -- PEA | CTO | Crypto | PEA-PME
  sector text,
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- SNAPSHOTS QUOTIDIENS
-- Une photo du portfolio chaque jour
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  total_value numeric,
  total_invested numeric,
  total_pnl numeric,
  positions_json jsonb,                   -- Copie des positions ce jour-là
  UNIQUE(user_id, date)                   -- 1 snapshot par user par jour
);

-- ============================================================
-- ALERTES PRIX
-- Notification si un titre passe au-dessus/dessous d'un seuil
-- ============================================================
CREATE TABLE price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  ticker text NOT NULL,
  type text NOT NULL,                     -- 'above' | 'below'
  threshold numeric NOT NULL,
  is_active boolean DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RÈGLES DCA
-- Stratégie d'investissement régulier par titre
-- ============================================================
CREATE TABLE dca_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  position_id uuid REFERENCES positions,
  ticker text NOT NULL,
  amount numeric NOT NULL,                -- Montant en € par passage
  frequency text NOT NULL,               -- 'weekly'|'monthly'|'quarterly'|'biannual'
  is_active boolean DEFAULT true,
  last_executed_at timestamptz,
  next_expected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- EXÉCUTIONS DCA
-- Historique de chaque passage DCA
-- ============================================================
CREATE TABLE dca_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  dca_rule_id uuid REFERENCES dca_rules,
  ticker text NOT NULL,
  amount numeric NOT NULL,
  execution_price numeric NOT NULL,
  quantity_bought numeric NOT NULL,       -- amount / execution_price
  new_pru numeric NOT NULL,              -- PRU recalculé après ce DCA
  executed_at timestamptz DEFAULT now()
);

-- ============================================================
-- RAPPORTS AGENTS IA
-- Historique des analyses générées par les agents
-- ============================================================
CREATE TABLE agent_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL,                     -- 'newsletter'|'surveillance'|'chat'
  content text,
  model text,                             -- 'claude-haiku'|'claude-sonnet'
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Chaque user ne voit que ses propres données
-- ============================================================
ALTER TABLE positions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dca_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dca_executions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reports       ENABLE ROW LEVEL SECURITY;

-- Policies : accès uniquement à ses propres données
CREATE POLICY "user_positions"
  ON positions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_snapshots"
  ON portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_dca_rules"
  ON dca_rules FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_dca_exec"
  ON dca_executions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_reports"
  ON agent_reports FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEX DE PERFORMANCE
-- Accélère les requêtes fréquentes
-- ============================================================
CREATE INDEX idx_positions_user
  ON positions(user_id);

CREATE INDEX idx_snapshots_user_date
  ON portfolio_snapshots(user_id, date);

CREATE INDEX idx_dca_rules_user
  ON dca_rules(user_id);

CREATE INDEX idx_dca_exec_user
  ON dca_executions(user_id);