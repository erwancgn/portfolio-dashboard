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

/** Message d'historique de conversation */
interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Corps de la requête attendu par cette route */
interface ChatRequest {
  message: string
  history?: HistoryMessage[]
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
 * @throws {Error} avec message "429" si quota dépassé
 */
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history: HistoryMessage[],
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  })

  const result = await chat.sendMessage(message.trim())
  return sanitizeModelAnalysis(result.response.text())
}

/**
 * Appelle Groq (llama-3.3-70b-versatile) comme fallback Gemini.
 * Reconstruit l'historique au format OpenAI compatible.
 */
async function callGroq(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history: HistoryMessage[],
): Promise<string> {
  const groq = new Groq({ apiKey })

  const historyMessages = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: normalizeModelText(m.content, 500),
  }))

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message.trim() },
    ],
    max_tokens: 1024,
  })

  return sanitizeModelAnalysis(
    completion.choices[0]?.message?.content ?? 'Réponse non disponible.',
  )
}

/**
 * POST /api/analyse/chat
 *
 * Corps : { message: string; history?: { role: 'user' | 'assistant'; content: string }[] }
 * Retourne : { reply: string }
 *
 * Modèle primaire : Gemini 2.5 Flash (Google Generative AI).
 * Fallback automatique sur Groq (llama-3.3-70b-versatile) si quota 429 dépassé.
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

  const geminiKey = process.env.GOOGLE_AI_API_KEY
  if (!geminiKey) {
    return NextResponse.json(
      { error: 'Clé API Google manquante', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  const history = compactHistory(body.history ?? [])

  try {
    const systemPrompt = await buildSystemPrompt(user.id)

    let reply: string
    try {
      reply = await callGemini(geminiKey, systemPrompt, body.message, history)
    } catch (geminiError) {
      const is429 =
        geminiError instanceof Error && geminiError.message.includes('429')

      if (!is429) {
        throw geminiError
      }

      const groqKey = process.env.GROQ_API_KEY
      if (!groqKey) {
        return NextResponse.json(
          {
            error: 'Quota Gemini dépassé et clé Groq manquante',
            code: 'QUOTA_EXCEEDED',
          },
          { status: 503 },
        )
      }

      reply = await callGroq(groqKey, systemPrompt, body.message, history)
    }

    return NextResponse.json({ reply }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'appel à l'IA", code: 'AI_ERROR' },
      { status: 503 },
    )
  }
}
