import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchTickerDividends,
  FmpConfigurationError,
  FmpRateLimitError,
  FmpServiceError,
  resetFmpDividendsRateLimitCooldownForTests,
} from '@/lib/fmp-dividends'
import { clearTtlCache } from '@/lib/cache'

describe('fetchTickerDividends', () => {
  beforeEach(() => {
    clearTtlCache()
    vi.restoreAllMocks()
    delete process.env.FMP_API_KEY
    resetFmpDividendsRateLimitCooldownForTests()
  })

  it('remonte une erreur explicite si FMP_API_KEY est absente', async () => {
    await expect(fetchTickerDividends('MSFT')).rejects.toBeInstanceOf(FmpConfigurationError)
  })

  it('remonte une erreur explicite si FMP refuse la clé API', async () => {
    process.env.FMP_API_KEY = 'bad-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    )

    await expect(fetchTickerDividends('MSFT')).rejects.toBeInstanceOf(FmpConfigurationError)
  })

  it('remonte une erreur de service si FMP est indisponible', async () => {
    process.env.FMP_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    )

    await expect(fetchTickerDividends('MSFT')).rejects.toBeInstanceOf(FmpServiceError)
  })

  it('remonte une erreur dédiée si FMP rate limit le ticker', async () => {
    process.env.FMP_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    )

    await expect(fetchTickerDividends('TTE')).rejects.toBeInstanceOf(FmpRateLimitError)
  })

  it('utilise le endpoint stable/dividends avec le paramètre symbol courant', async () => {
    process.env.FMP_API_KEY = 'test-key'
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => [
          {
            date: '2025-02-20',
            adjDividend: 0.3,
            recordDate: '2025-02-20',
            paymentDate: '2025-03-13',
          },
          {
            date: '2024-11-21',
            adjDividend: 0.3,
            recordDate: '2024-11-21',
            paymentDate: '2024-12-12',
          },
          {
            date: '2024-08-15',
            adjDividend: 0.3,
            recordDate: '2024-08-15',
            paymentDate: '2024-09-12',
          },
          {
            date: '2024-05-15',
            adjDividend: 0.3,
            recordDate: '2024-05-16',
            paymentDate: '2024-06-13',
          },
        ],
      })

    vi.stubGlobal('fetch', fetchMock)

    const data = await fetchTickerDividends('MSFT')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://financialmodelingprep.com/stable/dividends?symbol=MSFT&apikey=test-key',
    )
    expect(data?.frequency).toBe('quarterly')
    expect(data?.annualDividendPerShare).toBe(1.2)
    expect(data?.history).toHaveLength(4)
  })

  it('retourne null si le ticker ne verse pas de dividendes', async () => {
    process.env.FMP_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    )

    const data = await fetchTickerDividends('MSFT')

    expect(data).toBeNull()
  })
})
