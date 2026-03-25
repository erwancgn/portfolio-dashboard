import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/** Corps attendu pour PATCH /api/positions/[id] */
interface PatchBody {
  quantity: number
  purchasePrice: number
}

/**
 * PATCH /api/positions/[id]
 * Ajoute un achat sur une position existante et recalcule le PRU (DCA).
 * Formule PRU : (old_qty × old_pru + new_qty × purchase_price) / (old_qty + new_qty)
 * Retourne 200 avec la position mise à jour, 400 si champs invalides,
 * 401 si non authentifié, 404 si introuvable, 500 si erreur DB.
 */
export async function PATCH(
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

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  const { quantity, purchasePrice } = body

  if (
    typeof quantity !== 'number' ||
    typeof purchasePrice !== 'number' ||
    quantity <= 0 ||
    purchasePrice <= 0
  ) {
    return NextResponse.json(
      { error: 'quantity et purchasePrice doivent être des nombres strictement positifs', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  const { id } = await params

  const { data: existing, error: fetchError } = await supabase
    .from('positions')
    .select('quantity, pru')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: 'Position introuvable', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const oldQuantity = existing.quantity
  const oldPru = existing.pru
  const newQuantity = oldQuantity + quantity
  const newPru = (oldQuantity * oldPru + quantity * purchasePrice) / newQuantity

  const { data: updated, error: updateError } = await supabase
    .from('positions')
    .update({ quantity: newQuantity, pru: newPru })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: `Erreur base de données : ${updateError?.message ?? 'inconnue'}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(updated, { status: 200 })
}

/**
 * DELETE /api/positions/[id]
 * Supprime une position appartenant à l'utilisateur connecté.
 * Double protection : filtre sur user_id en plus de l'id, conforme RLS.
 * Retourne 204 si succès, 401 si non authentifié, 404 si introuvable, 500 si erreur DB.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ErrorResponse | null>> {
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

  const { id } = await params

  const { error, count } = await supabase
    .from('positions')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  if (count === 0 || count === null) {
    return NextResponse.json(
      { error: 'Position introuvable', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  return new NextResponse(null, { status: 204 })
}
