import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchFmpProfile } from '@/lib/fmp'
import type { Tables, TablesInsert } from '@/types/database'

type Position = Tables<'positions'>

/** Corps attendu en POST */
interface CreatePositionBody {
  ticker: string
  type: 'stock' | 'etf' | 'crypto'
  quantity: number
  pru: number
  envelope?: string
  currency?: string
  isin?: string
  sector?: string
  logo_url?: string
  description?: string
  industry?: string
  country?: string
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * POST /api/positions
 * Insère une nouvelle position pour l'utilisateur connecté.
 * Valide les champs obligatoires avant insertion.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<Position | ErrorResponse>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  let body: Partial<CreatePositionBody>
  try {
    body = (await request.json()) as Partial<CreatePositionBody>
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const { ticker, type, quantity, pru, envelope, currency, isin, sector, logo_url, description, industry, country } = body

  if (!ticker || ticker.trim() === '') {
    return NextResponse.json(
      { error: 'Champ obligatoire manquant : ticker', code: 'MISSING_FIELD' },
      { status: 400 },
    )
  }
  if (!type || !['stock', 'etf', 'crypto'].includes(type)) {
    return NextResponse.json(
      { error: 'Champ invalide : type doit être stock, etf ou crypto', code: 'INVALID_FIELD' },
      { status: 400 },
    )
  }
  if (!quantity || quantity <= 0) {
    return NextResponse.json(
      { error: 'Champ invalide : quantity doit être > 0', code: 'INVALID_FIELD' },
      { status: 400 },
    )
  }
  if (!pru || pru <= 0) {
    return NextResponse.json(
      { error: 'Champ invalide : pru doit être > 0', code: 'INVALID_FIELD' },
      { status: 400 },
    )
  }

  const insert: TablesInsert<'positions'> = {
    ticker: ticker.trim().toUpperCase(),
    type,
    quantity,
    pru,
    envelope: envelope ?? null,
    currency: currency ?? 'EUR',
    isin: isin ?? null,
    sector: sector ?? null,
    logo_url: logo_url ?? null,
    description: description ?? null,
    industry: industry ?? null,
    country: country ?? null,
    user_id: user.id,
  }

  const { data, error } = await supabase
    .from('positions')
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(data, { status: 201 })
}

/**
 * Enrichit en parallèle les positions sans ISIN ou secteur via FMP,
 * puis met à jour la DB. Appelé côté serveur uniquement.
 */
async function enrichMissingMetadata(
  positions: Position[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Position[]> {
  const toEnrich = positions.filter((p) => !p.isin || !p.sector)
  if (toEnrich.length === 0) return positions

  const results = await Promise.allSettled(
    toEnrich.map(async (pos) => {
      const fmp = await fetchFmpProfile(pos.ticker)
      if (!fmp) return pos
      const update: Partial<Position> = {}
      if (!pos.isin && fmp.isin) update.isin = fmp.isin
      if (!pos.sector && fmp.sector) update.sector = fmp.sector
      if (!pos.logo_url && fmp.logoUrl) update.logo_url = fmp.logoUrl
      if (!pos.industry && fmp.industry) update.industry = fmp.industry
      if (!pos.country && fmp.country) update.country = fmp.country
      if (Object.keys(update).length === 0) return pos
      const { data } = await supabase
        .from('positions')
        .update(update)
        .eq('id', pos.id)
        .select()
        .single()
      return data ?? { ...pos, ...update }
    }),
  )

  const enriched = new Map(toEnrich.map((p, i) => {
    const result = results[i]
    return [p.id, result.status === 'fulfilled' ? result.value : p]
  }))

  return positions.map((p) => enriched.get(p.id) ?? p)
}

/**
 * GET /api/positions
 * Retourne toutes les positions de l'utilisateur connecté,
 * triées par date de création décroissante.
 * Enrichit automatiquement les positions sans ISIN/secteur via FMP.
 */
export async function GET(): Promise<NextResponse<Position[] | ErrorResponse>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  const positions = await enrichMissingMetadata(data ?? [], supabase)
  return NextResponse.json(positions, { status: 200 })
}
