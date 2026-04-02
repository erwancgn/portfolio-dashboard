import { sanitizeModelAnalysis } from '@/lib/ai'

type ClassicMethod = 'buffett' | 'lynch'
type Signal = 'BUY' | 'HOLD' | 'SELL'
type FairSignal = 'undervalued' | 'fair' | 'overvalued'
type Confidence = 'low' | 'medium' | 'high'

const VALID_SIGNALS = new Set<Signal>(['BUY', 'HOLD', 'SELL'])
const VALID_MOATS = new Set(['wide', 'narrow', 'none'])
const VALID_STORIES = new Set(['strong', 'moderate', 'weak'])
const VALID_FAIR_SIGNALS = new Set<FairSignal>(['undervalued', 'fair', 'overvalued'])
const VALID_CONFIDENCE = new Set<Confidence>(['low', 'medium', 'high'])
const VALID_LYNCH_CATEGORIES = new Set([
  'slow_grower',
  'stalwart',
  'fast_grower',
  'cyclical',
  'turnaround',
  'asset_play',
])

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isSafeTicker(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 20 &&
    /^[A-Z0-9.\-]+$/i.test(value.trim())
  )
}

export function validateTickerAnalysisJson(input: unknown): {
  signal: Signal
  score: number
} | null {
  if (!input || typeof input !== 'object') return null

  const { signal, score } = input as Record<string, unknown>
  const safeScore = asFiniteNumber(score)
  if (!VALID_SIGNALS.has(signal as Signal) || safeScore === null) return null

  return {
    signal: signal as Signal,
    score: clamp(Math.round(safeScore), 0, 100),
  }
}

export function validateClassicAnalysisJson(
  method: ClassicMethod,
  input: unknown,
): {
  signal: Signal
  score: number
  moat?: 'wide' | 'narrow' | 'none'
  margin_of_safety?: number
  verdict?: string
  peg?: number | null
  category?: string
  story?: 'strong' | 'moderate' | 'weak'
} | null {
  const base = validateTickerAnalysisJson(input)
  if (!base || !input || typeof input !== 'object') return null

  const raw = input as Record<string, unknown>
  const verdict = typeof raw.verdict === 'string' ? raw.verdict : undefined

  if (method === 'buffett') {
    const margin = asFiniteNumber(raw.margin_of_safety)
    if (!VALID_MOATS.has(raw.moat as string) || margin === null) return null
    return {
      ...base,
      moat: raw.moat as 'wide' | 'narrow' | 'none',
      margin_of_safety: clamp(Math.round(margin), -1000, 1000),
      verdict,
    }
  }

  const hasPeg = raw.peg === null || typeof raw.peg === 'number'
  const peg = raw.peg === null ? null : asFiniteNumber(raw.peg)
  if (
    !hasPeg ||
    !VALID_LYNCH_CATEGORIES.has(raw.category as string) ||
    !VALID_STORIES.has(raw.story as string) ||
    peg === null && raw.peg !== null
  ) {
    return null
  }

  return {
    ...base,
    peg: peg === null ? null : clamp(Number(peg.toFixed(2)), -1000, 1000),
    category: raw.category as string,
    story: raw.story as 'strong' | 'moderate' | 'weak',
    verdict,
  }
}

export function validateFairValueJson(input: unknown): {
  fair_value: number | null
  current_price: number
  currency: string
  signal: FairSignal
  upside_percent: number
  analysis: string
  methodology: string
  confidence: Confidence
} | null {
  if (!input || typeof input !== 'object') return null

  const raw = input as Record<string, unknown>
  const currentPrice = asFiniteNumber(raw.current_price)
  const fairValue = raw.fair_value === null ? null : asFiniteNumber(raw.fair_value)
  const upsidePercent = asFiniteNumber(raw.upside_percent)
  const currency = typeof raw.currency === 'string' ? raw.currency.toUpperCase().slice(0, 4) : ''
  const analysis = typeof raw.analysis === 'string' ? sanitizeModelAnalysis(raw.analysis) : ''
  const methodology = typeof raw.methodology === 'string' ? raw.methodology.trim().slice(0, 80) : ''

  if (
    currentPrice === null ||
    currentPrice <= 0 ||
    fairValue === undefined ||
    upsidePercent === null ||
    !currency ||
    !VALID_FAIR_SIGNALS.has(raw.signal as FairSignal) ||
    !VALID_CONFIDENCE.has(raw.confidence as Confidence) ||
    !analysis ||
    !methodology
  ) {
    return null
  }

  return {
    fair_value: fairValue === null ? null : Number(fairValue.toFixed(2)),
    current_price: Number(currentPrice.toFixed(2)),
    currency,
    signal: raw.signal as FairSignal,
    upside_percent: Number(clamp(upsidePercent, -1000, 1000).toFixed(2)),
    analysis,
    methodology,
    confidence: raw.confidence as Confidence,
  }
}
