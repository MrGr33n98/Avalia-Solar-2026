import { render, screen } from '@testing-library/react'
import RealtimeKPICard from '@/app/dashboard/components/RealtimeKPICard'

describe('RealtimeKPICard', () => {
  it('renders title and value', () => {
    render(<RealtimeKPICard title="Eventos" value={42} />)
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})

