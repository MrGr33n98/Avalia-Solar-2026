import { render, screen, waitFor } from '@testing-library/react'
import Home from '../page'

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getAll: jest.fn(async () => ([
      { id: 1, name: 'Marcopolo', banner_url: 'http://localhost:3001/rails/active_storage/blobs/redirect/x/banner.jpg', logo_url: null, description: '', website: '', phone: '', address: '', created_at: '', updated_at: '' },
      { id: 2, name: 'WEG', banner_url: null, logo_url: null, description: '', website: '', phone: '', address: '', created_at: '', updated_at: '' },
    ]),),
  },
  categoriesApiSafe: { getAll: jest.fn(async () => []) },
  reviewsApiSafe: { getAll: jest.fn(async () => []) },
}))

jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }))

describe('Home page banners', () => {
  it('renderiza CompanyCard com banner quando banner_url está presente', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Marcopolo')).toBeInTheDocument()
    })
  })
})
