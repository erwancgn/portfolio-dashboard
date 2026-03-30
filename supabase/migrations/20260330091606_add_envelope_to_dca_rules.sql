-- Migration : ajout de la colonne envelope sur dca_rules
-- Ticket #59 — DCA depuis le tableau principal

ALTER TABLE dca_rules
  ADD COLUMN IF NOT EXISTS envelope text;
