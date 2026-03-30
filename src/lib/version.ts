/** Historique des versions — descriptions fonctionnelles pour l'utilisateur */
export interface VersionEntry {
  version: string
  date: string
  label: string
  features: string[]
}

export const VERSION_CURRENT = '0.3.0'

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: '0.3.0',
    date: 'Mars 2026',
    label: 'Analyse IA & tableau enrichi',
    features: [
      'Analyse instantanée d\'un actif : signal Acheter / Conserver / Vendre, score et rapport complet',
      'Recherche assistée lors de l\'analyse (suggestions nom + ticker)',
      'Tableau de positions : nom complet de l\'actif, drapeau pays, métriques en double ligne',
      'Détail position : affichage du pays',
      'Enrichissement automatique des noms manquants au chargement',
    ],
  },
  {
    version: '0.2.0',
    date: 'Mars 2026',
    label: 'Dashboard complet',
    features: [
      'Graphiques d\'allocation par enveloppe (PEA / CTO / Crypto) et par secteur',
      'Vente partielle ou totale avec calcul de flat tax automatique (30% CTO, 0% PEA)',
      'Règles DCA — investissement périodique automatique par actif',
      'Page Historique des transactions (achats, ventes, apports, retraits)',
      'Suivi des liquidités par enveloppe avec apports et retraits',
      'Vues Poids / Secteur / Pays du portefeuille',
      'Achat additionnel sur une position existante avec recalcul du PRU',
    ],
  },
  {
    version: '0.1.0',
    date: 'Mars 2026',
    label: 'Première mise en ligne',
    features: [
      'Suivi des positions en temps réel (actions, ETF, crypto)',
      'Calcul automatique du P&L en euros et en pourcentage',
      'Ajout et suppression de positions',
      'Authentification sécurisée',
    ],
  },
]
