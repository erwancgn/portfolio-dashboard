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
  name?: string
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
 * Si des champs statiques (isin, sector, name…) sont absents du body,
 * appelle FMP une seule fois pour les compléter avant l'insertion.
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

  const { ticker, type, quantity, pru, envelope, currency, name, isin, sector, logo_url, description, industry, country } = body

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

  // Appel FMP unique à la création si des champs statiques sont manquants.
  // Le form a la priorité : les données FMP ne comblent que les champs vides.
  let fmpName = name ?? null
  let fmpIsin = isin ?? null
  let fmpSector = sector ?? null
  let fmpLogoUrl = logo_url ?? null
  let fmpDescription = description ?? null
  let fmpIndustry = industry ?? null
  let fmpCountry = country ?? null

  if (!isin || !sector) {
    const fmp = await fetchFmpProfile(ticker.trim().toUpperCase())
    if (fmp) {
      if (!fmpName && fmp.name) fmpName = fmp.name
      if (!fmpIsin && fmp.isin) fmpIsin = fmp.isin
      if (!fmpSector && fmp.sector) fmpSector = fmp.sector
      if (!fmpLogoUrl && fmp.logoUrl) fmpLogoUrl = fmp.logoUrl
      if (!fmpDescription && fmp.description) fmpDescription = fmp.description
      if (!fmpIndustry && fmp.industry) fmpIndustry = fmp.industry
      if (!fmpCountry && fmp.country) fmpCountry = fmp.country
    }
  }

  const insert: TablesInsert<'positions'> = {
    ticker: ticker.trim().toUpperCase(),
    type,
    quantity,
    pru,
    envelope: envelope ?? null,
    currency: currency ?? 'EUR',
    name: fmpName,
    isin: fmpIsin,
    sector: fmpSector,
    logo_url: fmpLogoUrl,
    description: fmpDescription,
    industry: fmpIndustry,
    country: fmpCountry,
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
 * GET /api/positions
 * Retourne toutes les positions de l'utilisateur connecté,
 * triées par date de création décroissante.
 * Aucun appel FMP — les données statiques sont stockées en DB à la création.
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

  return NextResponse.json(data ?? [], { status: 200 })
}
