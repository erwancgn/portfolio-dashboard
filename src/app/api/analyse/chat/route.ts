import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

/** Corps de la requête attendu par cette route */
interface ChatRequest {
  message: string
}

/** Réponse retournée par cette route */
interface ChatResponse {
  reply: string
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * Construit le system prompt avec le contexte du portfolio de l'utilisateur.
 * Récupère les positions depuis Supabase et les formate pour Claude.
 */
async function buildSystemPrompt(userId: string): Promise<string> {
  const supabase = await createClient()

  const { data: positions } = await supabase
    .from('positions')
    .select('ticker, name, quantity, pru, sector, envelope, current_price')
    .eq('user_id', userId)

  if (!positions || positions.length === 0) {
    return "Tu es un assistant financier expert. L'utilisateur n'a pas encore de positions dans son portfolio. Réponds en français."
  }

  const lines = positions.map((pos) => {
    const valeurInvestie = pos.quantity * pos.pru
    const valeurActuelle = pos.current_price
      ? pos.quantity * pos.current_price
      : valeurInvestie
    const pnl = valeurActuelle - valeurInvestie
    const pnlPct = valeurInvestie > 0 ? (pnl / valeurInvestie) * 100 : 0
    const label = pos.name ? `${pos.ticker} (${pos.name})` : pos.ticker
    const secteur = pos.sector ? `, secteur: ${pos.sector}` : ''
    const enveloppe = pos.envelope ? `, enveloppe: ${pos.envelope}` : ''

    return `- ${label}: ${pos.quantity} parts, PRU ${pos.pru.toFixed(2)} €, valeur investie ${valeurInvestie.toFixed(2)} €, valeur actuelle ~${valeurActuelle.toFixed(2)} €, P&L ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} € (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)${secteur}${enveloppe}`
  })

  return `Tu es un assistant financier expert, spécialisé dans l'analyse de portefeuilles d'investissement personnels.
Voici le portfolio de l'utilisateur :

${lines.join('\n')}

Réponds toujours en français. Sois concis, précis et bienveillant. Ne donne pas de conseils d'investissement formels, mais tu peux analyser la composition, les risques, la diversification et répondre aux questions sur les positions.`
}

/**
 * POST /api/analyse/chat
 *
 * Corps : { message: string }
 * Retourne : { reply: string }
 *
 * Appelle Claude (claude-haiku-4-5-20251001) avec le contexte du portfolio
 * de l'utilisateur connecté comme system prompt.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChatResponse | ErrorResponse>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  let body: ChatRequest
  try {
    body = (await request.json()) as ChatRequest
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  if (!body.message || body.message.trim() === '') {
    return NextResponse.json(
      { error: 'Paramètre manquant : message', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API manquante', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  try {
    const systemPrompt = await buildSystemPrompt(user.id)
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: body.message.trim() }],
    })

    const firstBlock = response.content[0]
    const reply =
      firstBlock.type === 'text' ? firstBlock.text : 'Réponse non disponible.'

    return NextResponse.json({ reply }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de l\'appel à Claude', code: 'AI_ERROR' },
      { status: 503 },
    )
  }
}
