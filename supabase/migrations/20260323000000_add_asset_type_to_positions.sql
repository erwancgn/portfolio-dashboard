-- ============================================================
-- Ajout de la colonne type à la table positions
-- Valeurs : 'stock' | 'etf' | 'crypto'
-- ============================================================

CREATE TYPE asset_type AS ENUM ('stock', 'etf', 'crypto');

ALTER TABLE positions
  ADD COLUMN type asset_type NOT NULL DEFAULT 'stock';
