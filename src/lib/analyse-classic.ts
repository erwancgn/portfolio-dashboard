/**
 * Types et helpers partagés pour la route POST /api/analyse/classic.
 * Séparé de la route pour respecter la limite de 200 lignes par fichier.
 */

/** Réponse retournée par la route classic */
export interface ClassicAnalysisResult {
  ticker: string
  method: 'buffett' | 'lynch'
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  analysis: string
  // Buffett
  moat?: 'wide' | 'narrow' | 'none'
  margin_of_safety?: number
  verdict?: string
  // Lynch
  peg?: number | null
  category?: string
  story?: 'strong' | 'moderate' | 'weak'
  computed_at: string
  from_cache: boolean
}

/** Structure JSON Buffett dans la réponse Gemini */
export interface BuffettJson {
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  moat: 'wide' | 'narrow' | 'none'
  margin_of_safety: number
  verdict: string
}

/** Structure JSON Lynch dans la réponse Gemini */
export interface LynchJson {
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  peg: number | null
  category: string
  story: 'strong' | 'moderate' | 'weak'
  verdict: string
}

export type GeminiJson = BuffettJson | LynchJson

/**
 * Construit la réponse à partir d'un enregistrement cache Supabase.
 *
 * @param ticker - Symbole boursier
 * @param method - Méthode d'analyse
 * @param cached - Enregistrement brut retourné par Supabase
 */
export function buildCacheResponse(
  ticker: string,
  method: 'buffett' | 'lynch',
  cached: Record<string, unknown>,
): ClassicAnalysisResult {
  const meta = (cached.metadata ?? {}) as Record<string, unknown>
  return {
    ticker,
    method,
    signal: (cached.signal as ClassicAnalysisResult['signal']) ?? 'HOLD',
    score: typeof cached.score === 'number' ? cached.score : 0,
    analysis: typeof cached.analysis === 'string' ? cached.analysis : '',
    moat: meta.moat as ClassicAnalysisResult['moat'],
    margin_of_safety: typeof meta.margin_of_safety === 'number' ? meta.margin_of_safety : undefined,
    verdict: typeof meta.verdict === 'string' ? meta.verdict : undefined,
    peg: meta.peg !== undefined ? (meta.peg as number | null) : undefined,
    category: typeof meta.category === 'string' ? meta.category : undefined,
    story: meta.story as ClassicAnalysisResult['story'],
    computed_at: typeof cached.computed_at === 'string' ? cached.computed_at : new Date().toISOString(),
    from_cache: true,
  }
}

/**
 * Construit les métadonnées à persister dans classic_analysis_cache.
 *
 * @param method - Méthode d'analyse
 * @param validated - JSON parsé et validé depuis la réponse Gemini
 */
export function buildMetadata(
  method: 'buffett' | 'lynch',
  validated: GeminiJson,
): Record<string, unknown> {
  if (method === 'buffett') {
    const b = validated as BuffettJson
    return { moat: b.moat, margin_of_safety: b.margin_of_safety, verdict: b.verdict }
  }
  const l = validated as LynchJson
  return { peg: l.peg, category: l.category, story: l.story, verdict: l.verdict }
}

/**
 * Construit la réponse finale après un appel Gemini réussi.
 *
 * @param ticker - Symbole boursier
 * @param method - Méthode d'analyse
 * @param validated - JSON parsé et validé
 * @param analysis - Texte markdown nettoyé
 * @param now - Timestamp ISO de la computation
 */
export function buildFreshResponse(
  ticker: string,
  method: 'buffett' | 'lynch',
  validated: GeminiJson,
  analysis: string,
  now: string,
): ClassicAnalysisResult {
  const base: ClassicAnalysisResult = {
    ticker,
    method,
    signal: validated.signal,
    score: validated.score,
    analysis,
    computed_at: now,
    from_cache: false,
  }

  if (method === 'buffett') {
    const b = validated as BuffettJson
    base.moat = b.moat
    base.margin_of_safety = b.margin_of_safety
    base.verdict = b.verdict
  } else {
    const l = validated as LynchJson
    base.peg = l.peg
    base.category = l.category
    base.story = l.story
    base.verdict = l.verdict
  }

  return base
}

/**
 * Vérifie qu'une erreur est un dépassement de quota Gemini (HTTP 429).
 *
 * @param err - Erreur inconnue capturée dans le catch
 */
export function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('429') || err.message.toLowerCase().includes('quota')
  }
  return false
}
