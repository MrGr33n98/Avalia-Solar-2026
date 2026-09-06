import { render, screen, waitFor } from '@testing-library/react';
import TemplatesWorkspace from './TemplatesWorkspace';
import * as api from '@/lib/api/sales/emailTemplates';

jest.mock('@/lib/api/sales/emailTemplates');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Carlos', company_id: 10 } }),
}));
jest.mock('@/components/sales/layout/SalesLayoutWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockTemplates = [
  {
    id: 1,
    name: 'Proposta Solar',
    subject_template: 'Sua proposta {{person.first_name}}',
    category: 'Prospecção',
    status: 'active' as const,
    schema_version: 1,
    shared: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
];

const mockStats = {
  total: 1,
  active: 1,
  draft: 0,
  archived: 0,
  shared: 1,
  in_use: 0,
};

describe('Email Templates Module UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(api.listEmailTemplates).mockResolvedValue({
      templates: mockTemplates,
      meta: { page: 1, per_page: 12, total: 1, total_pages: 1 },
    });
    jest.mocked(api.getTemplateStats).mockResolvedValue(mockStats);
    jest.mocked(api.getTemplateVariables).mockResolvedValue({
      groups: [
        {
          key: 'person',
          label: 'Pessoa',
          variables: [{ token: '{{person.first_name}}', label: 'Primeiro nome' }],
        },
      ],
    });
    jest.mocked(api.getTemplateCategories).mockResolvedValue({ categories: ['Prospecção'] });
  });

  it('renders templates library workspace with stats and template card', async () => {
    render(<TemplatesWorkspace />);

    await waitFor(() => {
      expect(screen.getAllByText('Templates de E-mail').length).toBeGreaterThan(0);
      expect(screen.getByText('Proposta Solar')).toBeInTheDocument();
    });

    expect(screen.getByText('Total de Templates')).toBeInTheDocument();
    expect(screen.getByText('Novo template')).toBeInTheDocument();
  });
});
