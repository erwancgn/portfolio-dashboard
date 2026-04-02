import { describe, expect, it } from 'vitest'
import {
  isSafeTicker,
  validateClassicAnalysisJson,
  validateFairValueJson,
  validateTickerAnalysisJson,
} from '@/lib/ai-validation'

describe('ai validation', () => {
  it('accepts safe tickers and rejects malformed input', () => {
    expect(isSafeTicker('MC.PA')).toBe(true)
    expect(isSafeTicker('BTC-USD')).toBe(true)
    expect(isSafeTicker('DROP TABLE')).toBe(false)
    expect(isSafeTicker('')).toBe(false)
  })

  it('validates and clamps quick analysis payloads', () => {
    expect(validateTickerAnalysisJson({ signal: 'BUY', score: 140 })).toEqual({
      signal: 'BUY',
      score: 100,
    })
    expect(validateTickerAnalysisJson({ signal: 'XXX', score: 20 })).toBeNull()
  })

  it('validates buffett analysis payloads', () => {
    expect(
      validateClassicAnalysisJson('buffett', {
        signal: 'HOLD',
        score: 71.7,
        moat: 'wide',
        margin_of_safety: 24.3,
        verdict: 'buy_at_discount',
      }),
    ).toEqual({
      signal: 'HOLD',
      score: 72,
      moat: 'wide',
      margin_of_safety: 24,
      verdict: 'buy_at_discount',
    })
  })

  it('rejects invalid lynch payloads', () => {
    expect(
      validateClassicAnalysisJson('lynch', {
        signal: 'BUY',
        score: 80,
        peg: 0.8,
        category: 'unknown',
        story: 'strong',
      }),
    ).toBeNull()
  })

  it('validates fair value payloads', () => {
    expect(
      validateFairValueJson({
        fair_value: 120.456,
        current_price: 100.123,
        currency: 'usd',
        signal: 'undervalued',
        upside_percent: 20.123,
        analysis: '  Prix cible crédible.  ',
        methodology: 'Consensus analystes',
        confidence: 'medium',
      }),
    ).toEqual({
      fair_value: 120.46,
      current_price: 100.12,
      currency: 'USD',
      signal: 'undervalued',
      upside_percent: 20.12,
      analysis: 'Prix cible crédible.',
      methodology: 'Consensus analystes',
      confidence: 'medium',
    })
  })
})
