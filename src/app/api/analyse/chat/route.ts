import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import {
  compactHistory,
  formatPortfolioContext,
  normalizeModelText,
  sanitizeModelAnalysis,
} from '@/lib/ai'
import { readThroughTtlCache } from '@/lib/cache'

const PORTFOLIO_CONTEXT_TTL_MS = 60 * 1000
const DEFAULT_DAILY_TOKEN_LIMIT = 100_000

/** Message d'historique de conversation */
interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Corps de la requête attendu par cette route */
interface ChatRequest {
  message: string
  history?: HistoryMessage[]
  /** Nombre de tokens déjà consommés aujourd'hui (tracking côté client) */
  tokensUsedToday?: number
}

/** Réponse retournée par cette route */
interface ChatResponse {
  reply: string
  tokensUsed: number
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * Construit le system prompt avec le contexte du portfolio de l'utilisateur.
 * Récupère les positions depuis Supabase et les formate pour l'IA.
 */
async function buildSystemPrompt(userId: string): Promise<string> {
  return readThroughTtlCache(`portfolio:context:${userId}`, PORTFOLIO_CONTEXT_TTL_MS, async () => {
    const supabase = await createClient()
    const { data: positions } = await supabase
      .from('positions')
      .select('ticker, name, quantity, pru, sector, envelope, current_price')
      .eq('user_id', userId)
    return formatPortfolioContext(positions ?? [])
  })
}

/**
 * Appelle Gemini 2.5 Flash avec l'historique de conversation.
 * @returns Réponse IA et nombre de tokens consommés
 * @throws {Error} avec message "429" si quota dépassé
 */
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history: HistoryMessage[],
): Promise<ChatResponse> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt })
  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  })
  const result = await chat.sendMessage(message.trim())
  return {
    reply: sanitizeModelAnalysis(result.response.text()),
    tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0,
  }
}

/**
 * Appelle Groq (llama-3.3-70b-versatile) comme fallback Gemini.
 * @returns Réponse IA et nombre de tokens consommés
 */
async function callGroq(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history: HistoryMessage[],
): Promise<ChatResponse> {
  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: normalizeModelText(m.content, 500),
      })),
      { role: 'user', content: message.trim() },
    ],
    max_tokens: 1024,
  })
  return {
    reply: sanitizeModelAnalysis(completion.choices[0]?.message?.content ?? 'Réponse non disponible.'),
    tokensUsed: completion.usage?.total_tokens ?? 0,
  }
}

/**
 * POST /api/analyse/chat
 *
 * Corps : { message: string; history?: HistoryMessage[]; tokensUsedToday?: number }
 * Retourne : { reply: string; tokensUsed: number }
 *
 * Modèle primaire : Gemini 2.5 Flash. Fallback : Groq si quota 429.
 * HTTP 429 si la limite quotidienne de tokens (DAILY_AI_TOKEN_LIMIT) est atteinte.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChatResponse | ErrorResponse>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let body: ChatRequest
  try {
    body = (await request.json()) as ChatRequest
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide', code: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body.message || body.message.trim() === '') {
    return NextResponse.json({ error: 'Paramètre manquant : message', code: 'MISSING_PARAM' }, { status: 400 })
  }

  const dailyLimit = parseInt(process.env.DAILY_AI_TOKEN_LIMIT ?? '', 10) || DEFAULT_DAILY_TOKEN_LIMIT
  const tokensUsedToday = body.tokensUsedToday ?? 0

  if (tokensUsedToday >= dailyLimit) {
    return NextResponse.json(
      { error: 'Limite quotidienne atteinte', code: 'DAILY_LIMIT_REACHED' },
      { status: 429 },
    )
  }

  const geminiKey = process.env.GOOGLE_AI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'Clé API Google manquante', code: 'CONFIG_ERROR' }, { status: 500 })
  }

  const history = compactHistory(body.history ?? [])

  try {
    const systemPrompt = await buildSystemPrompt(user.id)

    let result: ChatResponse
    try {
      result = await callGemini(geminiKey, systemPrompt, body.message, history)
    } catch (geminiError) {
      const is429 = geminiError instanceof Error && geminiError.message.includes('429')
      if (!is429) throw geminiError

      const groqKey = process.env.GROQ_API_KEY
      if (!groqKey) {
        return NextResponse.json(
          { error: 'Quota Gemini dépassé et clé Groq manquante', code: 'QUOTA_EXCEEDED' },
          { status: 503 },
        )
      }
      result = await callGroq(groqKey, systemPrompt, body.message, history)
    }

    return NextResponse.json({ reply: result.reply, tokensUsed: result.tokensUsed }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'appel à l'IA", code: 'AI_ERROR' },
      { status: 503 },
    )
  }
}
