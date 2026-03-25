import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
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
