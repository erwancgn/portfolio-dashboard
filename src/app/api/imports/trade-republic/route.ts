import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTradeRepublicPdf } from '@/lib/trade-republic-pdf'
import {
  persistTradeRepublicImport,
} from '@/lib/trade-republic'

export async function POST(request: Request) {
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

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Aucun fichier PDF reçu', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Le fichier doit être un PDF', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const parsed = await parseTradeRepublicPdf(buffer)
    const importId = await persistTradeRepublicImport(supabase, user.id, file.name, parsed)

    return NextResponse.json(
      {
        importId,
        eventCount: parsed.events.length,
        warnings: parsed.warnings,
        sourceYear: parsed.sourceYear,
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message, code: 'IMPORT_ERROR' }, { status: 500 })
  }
}
