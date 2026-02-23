import { renderHook, act } from '@testing-library/react'
import * as cable from '@/app/lib/cable'
import { useCompanyDashboard } from '@/app/dashboard/hooks/useCompanyDashboard'
import { fetchApi } from '@/lib/api'

jest.mock('@/app/lib/cable')
jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}))

describe('useCompanyDashboard', () => {
  beforeEach(() => {
    ;(fetchApi as jest.Mock).mockResolvedValue({
      kpis: {},
      series: { events: [], quotes: [], whatsapp: [], reviews: [] },
    })
  })

  it('updates KPIs when receiving counters', async () => {
    const unsub = jest.fn()
    ;(cable.subscribeCompanyDashboard as any).mockImplementation((_id: number, onMessage: any, onStatus: any) => {
      onStatus('connected')
      setTimeout(() => {
        onMessage({ tracked_at: new Date().toISOString(), type: 'quote_click', counters: { quote_clicks: 5, events_count: 10 } })
      }, 0)
      return { unsubscribe: unsub }
    })

    const { result } = renderHook(() => useCompanyDashboard(1))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 300))
    })

    expect(result.current.kpis.quote_clicks).toBe(5)
    expect(result.current.kpis.events_count).toBe(10)
    expect(result.current.status).toBe('connected')
  })
})

