import { describe, expect, it } from 'vitest'
import {
  getQuantityHeldOnDate,
  type DividendPositionTransaction,
} from '@/lib/dividend-position-history'

describe('getQuantityHeldOnDate', () => {
  it('reconstitue la quantité détenue à partir des transactions postérieures', () => {
    const transactions: DividendPositionTransaction[] = [
      {
        positionId: 'pos-1',
        ticker: 'MSFT',
        type: 'buy',
        quantity: 2,
        executedAt: '2025-01-10T10:00:00.000Z',
      },
      {
        positionId: 'pos-1',
        ticker: 'MSFT',
        type: 'sell',
        quantity: 1,
        executedAt: '2025-02-18T10:00:00.000Z',
      },
      {
        positionId: 'pos-1',
        ticker: 'MSFT',
        type: 'buy',
        quantity: 0.5,
        executedAt: '2025-05-20T10:00:00.000Z',
      },
    ]

    const quantityAtDividendDate = getQuantityHeldOnDate(
      1.5,
      '2025-03-01T00:00:00.000Z',
      transactions,
    )

    expect(quantityAtDividendDate).toBe(1)
  })

  it('ne retourne jamais une quantité négative', () => {
    const transactions: DividendPositionTransaction[] = [
      {
        positionId: 'pos-1',
        ticker: 'MSFT',
        type: 'buy',
        quantity: 4,
        executedAt: '2025-06-01T00:00:00.000Z',
      },
    ]

    const quantityAtDividendDate = getQuantityHeldOnDate(
      1,
      '2025-01-01T00:00:00.000Z',
      transactions,
    )

    expect(quantityAtDividendDate).toBe(0)
  })
})
