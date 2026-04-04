import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

type Position = Tables<'positions'>

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * GET /api/positions/trash
 * Retourne toutes les positions soft-deleted de l'utilisateur connecté.
 * Filtre : deleted_at IS NOT NULL, user_id = user.id
 * Triées par date de suppression décroissante.
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
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return NextResponse.json(data ?? [], { status: 200 })
}

/**
 * DELETE /api/positions/trash
 * Hard delete définitif de toutes les positions soft-deleted de l'utilisateur.
 * Filtre strict : user_id = user.id AND deleted_at IS NOT NULL — ne touche jamais les positions actives.
 * Retourne 204 si succès.
 */
export async function DELETE(): Promise<NextResponse<ErrorResponse | null>> {
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

  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)

  if (error) {
    return NextResponse.json(
      { error: `Erreur base de données : ${error.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  return new NextResponse(null, { status: 204 })
}
