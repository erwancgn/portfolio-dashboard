import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * POST /api/positions/[id]/restore
 * Restaure une position soft-deleted en remettant deleted_at = NULL.
 * Double protection : filtre sur user_id ET deleted_at IS NOT NULL.
 * Retourne 200 si succès, 404 si introuvable ou déjà active.
 */
export async function POST(
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
    .update({ deleted_at: null }, { count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  if (count === 0 || count === null) {
    return NextResponse.json(
      { error: 'Position introuvable ou déjà active', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  return new NextResponse(null, { status: 200 })
}
