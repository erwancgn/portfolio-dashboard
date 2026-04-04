-- ============================================================
-- GH-38-S0 — Soft delete sur la table positions
-- Ajoute deleted_at, index partiels, et adapte les RLS policies
-- ============================================================

-- 1. Colonne soft delete
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Index partiel pour les positions actives (requêtes normales)
CREATE INDEX IF NOT EXISTS idx_positions_active
  ON positions (user_id)
  WHERE deleted_at IS NULL;

-- 3. Index partiel pour la corbeille
CREATE INDEX IF NOT EXISTS idx_positions_trash
  ON positions (user_id)
  WHERE deleted_at IS NOT NULL;

-- 4. Remplacer la policy ALL (qui ne filtre pas deleted_at) par des policies granulaires

-- Supprimer l'ancienne policy FOR ALL
DROP POLICY IF EXISTS "user_positions" ON positions;

-- SELECT positions actives (portfolio normal)
CREATE POLICY "user_positions_select_active"
  ON positions FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- SELECT positions supprimées (corbeille)
CREATE POLICY "user_positions_select_trash"
  ON positions FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- INSERT
CREATE POLICY "user_positions_insert"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE (soft delete inclus — met à jour deleted_at)
CREATE POLICY "user_positions_update"
  ON positions FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE (hard delete si nécessaire, hors périmètre mais policy requise)
CREATE POLICY "user_positions_delete"
  ON positions FOR DELETE
  USING (auth.uid() = user_id);
