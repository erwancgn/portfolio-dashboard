import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DepositBody {
  envelope: string
  amount: number
  type: 'deposit' | 'withdraw'
}

/**
 * POST /api/liquidities
 * Enregistre un apport ou retrait manuel sur une enveloppe via RPC deposit_liquidity.
 * Retourne la liquidité mise à jour ou une erreur.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let body: DepositBody
  try {
    body = (await request.json()) as DepositBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide', code: 'BAD_REQUEST' }, { status: 400 })
  }

  const { envelope, amount, type } = body
  if (!envelope || typeof amount !== 'number' || amount === 0 || !['deposit', 'withdraw'].includes(type)) {
    return NextResponse.json({ error: 'Paramètres invalides', code: 'BAD_REQUEST' }, { status: 400 })
  }

  const signedAmount = type === 'withdraw' ? -Math.abs(amount) : Math.abs(amount)

  const { data, error } = await supabase.rpc('deposit_liquidity', {
    p_user_id: user.id,
    p_envelope: envelope,
    p_amount: signedAmount,
    p_type: type,
  })

  if (error) {
    return NextResponse.json({ error: error.message, code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}
