import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SellBody {
  quantity: number
  salePrice: number
}

/**
 * POST /api/positions/[id]/sell
 * Enregistre une vente (partielle ou totale) de façon atomique via RPC.
 * Si quantité vendue = quantité détenue → supprime la position.
 * Retourne 200 avec la position mise à jour, null si position soldée,
 * 400 si champs invalides, 401 si non authentifié, 500 si erreur DB.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  let body: SellBody
  try {
    body = (await request.json()) as SellBody
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  const { quantity, salePrice } = body

  if (
    typeof quantity !== 'number' ||
    typeof salePrice !== 'number' ||
    quantity <= 0 ||
    salePrice <= 0
  ) {
    return NextResponse.json(
      {
        error: 'quantity et salePrice doivent être des nombres strictement positifs',
        code: 'BAD_REQUEST',
      },
      { status: 400 },
    )
  }

  const { id } = await params

  const { data: result, error: rpcError } = await supabase.rpc('sell_position', {
    p_position_id: id,
    p_user_id: user.id,
    p_quantity: quantity,
    p_price: salePrice,
  })

  if (rpcError) {
    return NextResponse.json(
      { error: rpcError.message, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(result, { status: 200 })
}
