import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert } from '@/types/database'

type DcaRule = Tables<'dca_rules'>

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/** Corps attendu en POST */
interface CreateDcaRuleBody {
  position_id: string
  ticker: string
  amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  next_expected_at: string
  envelope?: string
}

/**
 * GET /api/dca
 * Retourne toutes les règles DCA actives de l'utilisateur connecté.
 */
export async function GET(): Promise<NextResponse<DcaRule[] | ErrorResponse>> {
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
    .from('dca_rules')
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

/**
 * POST /api/dca
 * Crée une nouvelle règle DCA pour l'utilisateur connecté.
 * Désactive toute règle existante pour la même position avant insertion.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<DcaRule | ErrorResponse>> {
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

  let body: Partial<CreateDcaRuleBody>
  try {
    body = (await request.json()) as Partial<CreateDcaRuleBody>
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const { position_id, ticker, amount, frequency, next_expected_at, envelope } = body

  if (!position_id) {
    return NextResponse.json(
      { error: 'Champ obligatoire manquant : position_id', code: 'MISSING_FIELD' },
      { status: 400 },
    )
  }
  if (!ticker || ticker.trim() === '') {
    return NextResponse.json(
      { error: 'Champ obligatoire manquant : ticker', code: 'MISSING_FIELD' },
      { status: 400 },
    )
  }
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Champ invalide : amount doit être > 0', code: 'INVALID_FIELD' },
      { status: 400 },
    )
  }
  if (!frequency || !['weekly', 'biweekly', 'monthly'].includes(frequency)) {
    return NextResponse.json(
      { error: 'Champ invalide : frequency doit être weekly, biweekly ou monthly', code: 'INVALID_FIELD' },
      { status: 400 },
    )
  }
  if (!next_expected_at) {
    return NextResponse.json(
      { error: 'Champ obligatoire manquant : next_expected_at', code: 'MISSING_FIELD' },
      { status: 400 },
    )
  }

  // Désactiver toute règle existante pour cette position
  await supabase
    .from('dca_rules')
    .update({ is_active: false })
    .eq('position_id', position_id)
    .eq('user_id', user.id)

  const insert: TablesInsert<'dca_rules'> = {
    user_id: user.id,
    position_id,
    ticker: ticker.trim().toUpperCase(),
    amount,
    frequency,
    next_expected_at,
    envelope: envelope ?? null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('dca_rules')
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
