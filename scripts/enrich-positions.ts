/**
 * scripts/enrich-positions.ts
 *
 * Script one-shot pour enrichir les positions existantes en DB
 * qui n'ont pas encore d'ISIN, de secteur ou de logo_url.
 *
 * Pré-requis : installer tsx en dev si absent
 *   npm install --save-dev tsx dotenv
 *
 * Usage (Node 20+ avec --env-file) :
 *   npx tsx --env-file=.env.local scripts/enrich-positions.ts
 *
 * Ou avec dotenv installé :
 *   npx tsx scripts/enrich-positions.ts
 *
 * Variables d'environnement requises (depuis .env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (ou NEXT_PUBLIC_SUPABASE_ANON_KEY en fallback)
 *   FMP_API_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const FMP_API_KEY = process.env.FMP_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[enrich] Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou ANON_KEY)')
  process.exit(1)
}

if (!FMP_API_KEY) {
  console.error('[enrich] Variable manquante : FMP_API_KEY')
  process.exit(1)
}

interface FmpProfileRaw {
  companyName?: string
  sector?: string
  industry?: string
  description?: string
  country?: string
  image?: string
  isin?: string
}

interface PositionRow {
  id: string
  ticker: string
  name: string | null
  isin: string | null
  sector: string | null
  logo_url: string | null
  industry: string | null
  country: string | null
  description: string | null
}

/**
 * Récupère le profil FMP pour un ticker donné.
 * Retourne null en cas d'erreur ou si inconnu.
 */
async function fetchFmpProfile(ticker: string): Promise<FmpProfileRaw | null> {
  const url = `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ticker)}&apikey=${FMP_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[enrich] FMP ${ticker} — HTTP ${res.status}`)
      return null
    }
    const data = (await res.json()) as FmpProfileRaw[]
    if (!Array.isArray(data) || data.length === 0) return null
    return data[0]
  } catch (err) {
    console.error(`[enrich] FMP ${ticker} — erreur réseau :`, err)
    return null
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

  // Récupérer toutes les positions sans isin OU sans sector OU sans logo_url
  const { data: positions, error } = await supabase
    .from('positions')
    .select('id, ticker, name, isin, sector, logo_url, industry, country, description')

  if (error) {
    console.error('[enrich] Erreur lecture positions :', error.message)
    process.exit(1)
  }

  const toEnrich = (positions as PositionRow[]).filter(
    (p) => !p.isin || !p.sector || !p.logo_url,
  )

  console.log(`[enrich] ${toEnrich.length} position(s) à enrichir sur ${positions?.length ?? 0} total`)

  if (toEnrich.length === 0) {
    console.log('[enrich] Rien à faire.')
    return
  }

  for (const pos of toEnrich) {
    const fmp = await fetchFmpProfile(pos.ticker)
    if (!fmp) {
      console.log(`[enrich] ${pos.ticker} — profil FMP introuvable, ignoré`)
      continue
    }

    const patch: Partial<PositionRow> = {}
    if (!pos.name && fmp.companyName) patch.name = fmp.companyName
    if (!pos.isin && fmp.isin) patch.isin = fmp.isin
    if (!pos.sector && fmp.sector) patch.sector = fmp.sector
    if (!pos.logo_url && fmp.image) patch.logo_url = fmp.image
    if (!pos.industry && fmp.industry) patch.industry = fmp.industry
    if (!pos.country && fmp.country) patch.country = fmp.country
    if (!pos.description && fmp.description) patch.description = fmp.description

    if (Object.keys(patch).length === 0) {
      console.log(`[enrich] ${pos.ticker} — aucun nouveau champ disponible`)
      continue
    }

    const { error: updateError } = await supabase
      .from('positions')
      .update(patch)
      .eq('id', pos.id)

    if (updateError) {
      console.error(`[enrich] ${pos.ticker} — erreur update :`, updateError.message)
    } else {
      const fields = Object.keys(patch).join(', ')
      console.log(`[enrich] ${pos.ticker} — mis à jour : ${fields}`)
    }

    // Pause entre chaque appel FMP pour respecter le rate-limit
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  console.log('[enrich] Terminé.')
}

main().catch((err) => {
  console.error('[enrich] Erreur inattendue :', err)
  process.exit(1)
})
