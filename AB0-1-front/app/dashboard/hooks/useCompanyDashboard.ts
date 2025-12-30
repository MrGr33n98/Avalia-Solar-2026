import { useEffect, useMemo, useReducer, useRef } from 'react'
import { fetchApi } from '@/lib/api'
import { subscribeCompanyDashboard } from '@/app/lib/cable'

type KPI = {
  events_count: number
  quote_clicks: number
  whatsapp_clicks: number
  reviews_count: number
  average_rating: number
  rating_count: number
}

type Point = { t: number; value: number; type?: string }

type State = {
  status: 'idle' | 'loading' | 'connected' | 'disconnected' | 'error'
  kpis: KPI
  series: { events: Point[]; quotes: Point[]; whatsapp: Point[]; reviews: Point[] }
}

const initialState: State = {
  status: 'idle',
  kpis: {
    events_count: 0,
    quote_clicks: 0,
    whatsapp_clicks: 0,
    reviews_count: 0,
    average_rating: 0,
    rating_count: 0,
  },
  series: { events: [], quotes: [], whatsapp: [], reviews: [] },
}

type Action =
  | { type: 'SET_STATUS'; status: State['status'] }
  | { type: 'SET_BASELINE'; kpis: Partial<KPI>; series?: Partial<State['series']> }
  | { type: 'MERGE_COUNTERS'; kpis: Partial<KPI> }
  | { type: 'APPEND_POINT'; key: keyof State['series']; point: Point }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'SET_BASELINE':
      return {
        ...state,
        kpis: { ...state.kpis, ...action.kpis },
        series: { ...state.series, ...(action.series || {}) },
      }
    case 'MERGE_COUNTERS':
      return { ...state, kpis: { ...state.kpis, ...action.kpis } }
    case 'APPEND_POINT': {
      const arr = state.series[action.key]
      const next = [...arr, action.point]
      // limitar tamanho para performance
      const trimmed = next.length > 100 ? next.slice(next.length - 100) : next
      return { ...state, series: { ...state.series, [action.key]: trimmed } }
    }
    default:
      return state
  }
}

export function useCompanyDashboard(companyId: number) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const batchRef = useRef<{ counters?: Partial<KPI>; points: Array<{ key: keyof State['series']; point: Point }> }>({ points: [] })
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    dispatch({ type: 'SET_STATUS', status: 'loading' })

    ;(async () => {
      try {
        const baseline = await fetchApi<any>(`/api/v1/companies/${companyId}/analytics/historical`)
        if (!mounted) return
        const baseKpis: Partial<KPI> = baseline?.kpis || {}
        const baseSeries: Partial<State['series']> = baseline?.series || {}
        dispatch({ type: 'SET_BASELINE', kpis: baseKpis, series: baseSeries })
      } catch (e) {
        dispatch({ type: 'SET_STATUS', status: 'error' })
      }
    })()

    const sub = subscribeCompanyDashboard(
      companyId,
      (msg) => {
        // acumular em batch para reduzir rerenders
        const t = Date.parse(msg.tracked_at)
        const type = msg.type
        // counters
        if (msg.counters) {
          batchRef.current.counters = { ...(batchRef.current.counters || {}), ...msg.counters }
        }
        // pontos
        if (type) {
          if (type === 'quote_click') batchRef.current.points.push({ key: 'quotes', point: { t, value: 1, type } })
          else if (type === 'whatsapp_click') batchRef.current.points.push({ key: 'whatsapp', point: { t, value: 1, type } })
          else if (type === 'review_created') batchRef.current.points.push({ key: 'reviews', point: { t, value: 1, type } })
          batchRef.current.points.push({ key: 'events', point: { t, value: 1, type } })
        }
        if (!timerRef.current) {
          timerRef.current = window.setTimeout(() => {
            const counters = batchRef.current.counters
            const points = batchRef.current.points
            batchRef.current = { points: [] }
            timerRef.current = null
            if (counters) dispatch({ type: 'MERGE_COUNTERS', kpis: counters })
            points.forEach((p) => dispatch({ type: 'APPEND_POINT', key: p.key, point: p.point }))
          }, 250)
        }
      },
      (status) => dispatch({ type: 'SET_STATUS', status })
    )

    return () => {
      mounted = false
      sub.unsubscribe()
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [companyId])

  const kpis = state.kpis
  const series = state.series
  const status = state.status

  return useMemo(() => ({ kpis, series, status }), [kpis, series, status])
}

