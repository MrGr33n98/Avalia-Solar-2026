import { render, screen } from '@testing-library/react'
import CategoryClientComponent from '../../CategoryClientComponent'

describe('CategoryClientComponent banners', () => {
  it('exibe CompanyCard para empresas iniciais com banner_url', () => {
    const initialCategory: any = { id: 1, name: 'Carports Solares', banner_url: null }
    const initialCompanies: any[] = [
      { id: 117, name: 'Marcopolo', banner_url: 'http://localhost:3001/rails/active_storage/blobs/redirect/x/banner.jpg', logo_url: null, description: '', website: '', phone: '', address: '', created_at: '', updated_at: '' },
      { id: 233, name: 'WEG Solar', banner_url: null, logo_url: null, description: '', website: '', phone: '', address: '', created_at: '', updated_at: '' },
    ]
    render(<CategoryClientComponent initialCategory={initialCategory} initialCompanies={initialCompanies} />)
    expect(screen.getByText('Marcopolo')).toBeInTheDocument()
    expect(screen.getByText('WEG Solar')).toBeInTheDocument()
  })
})
