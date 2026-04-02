import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildFiscalReport, fetchFiscalTransactions } from '@/lib/fiscal'

function parseFiscalYear(rawYear: string | null) {
  const currentYear = new Date().getUTCFullYear()

  if (!rawYear) return currentYear

  const year = Number(rawYear)
  if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
    return null
  }

  return year
}

export async function GET(request: NextRequest) {
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

  const year = parseFiscalYear(request.nextUrl.searchParams.get('year'))
  if (year === null) {
    return NextResponse.json(
      { error: 'Le paramètre year est invalide', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  try {
    const transactions = await fetchFiscalTransactions(supabase, user.id, year)
    const report = buildFiscalReport(year, transactions)
    return NextResponse.json(report, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message, code: 'DB_ERROR' }, { status: 500 })
  }
}
