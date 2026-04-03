import { describe, expect, it } from 'vitest'
import {
  compactHistory,
  extractLastJsonObject,
  formatPortfolioContext,
  normalizeModelText,
  sanitizeModelAnalysis,
} from '@/lib/ai'

describe('ai helpers', () => {
  it('normalizes whitespace and trims text', () => {
    expect(normalizeModelText('  Bonjour \n\n le   monde  ', 100)).toBe('Bonjour le monde')
  })

  it('keeps only the recent compact history within budget', () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: (index % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `message ${index} ${'x'.repeat(480)}`,
    }))

    const compacted = compactHistory(history)
    expect(compacted.length).toBeLessThanOrEqual(8)
    expect(compacted.at(-1)?.content.startsWith('message 11')).toBe(true)
  })

  it('extracts the last json object from a model response', () => {
    const raw = 'Intro\n{"signal":"HOLD","score":48}\nfin\n{"signal":"BUY","score":80}'
    expect(extractLastJsonObject(raw)).toBe('{"signal":"BUY","score":80}')
  })

  it('sanitizes long model analysis output', () => {
    const analysis = sanitizeModelAnalysis(`A\n\n\nB${'x'.repeat(10000)}`)
    expect(analysis.includes('\n\n')).toBe(true)
    expect(analysis.length).toBeLessThanOrEqual(9000)
  })

  it('formats a compact portfolio context', () => {
    const prompt = formatPortfolioContext([
      {
        ticker: 'AAPL',
        name: 'Apple',
        quantity: 10,
        pru: 100,
        current_price: 150,
        sector: 'Technology',
        envelope: 'CTO',
      },
      {
        ticker: 'MC.PA',
        name: 'LVMH',
        quantity: 2,
        pru: 700,
        current_price: 750,
        sector: 'Luxury',
        envelope: 'PEA',
      },
    ])

    expect(prompt).toContain('Contexte portfolio')
    expect(prompt).toContain('2 positions')
    expect(prompt).toContain('AAPL (Apple)')
    expect(prompt).toContain('Technology')
  })
})
