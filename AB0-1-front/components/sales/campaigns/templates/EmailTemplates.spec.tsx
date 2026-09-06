import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  jest.setTimeout(15000);

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

  it('calls previewEmailTemplate API with draft payload and template id for existing template', async () => {
    jest.mocked(api.previewEmailTemplate).mockResolvedValue({
      preview: {
        subject: 'Sua proposta Maria',
        preheader: undefined,
        body_html: '<p>Olá Maria</p>',
      },
      context_mode: 'sample',
    });

    render(<TemplatesWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Proposta Solar')).toBeInTheDocument();
    });

    // Click edit on template
    const editBtn = screen.getByRole('button', { name: /Editar/i });
    editBtn.click();

    await waitFor(() => {
      expect(screen.getByText('Editar: Proposta Solar')).toBeInTheDocument();
    });

    // Click preview button
    const previewBtn = screen.getByRole('button', { name: /Prévia/i });
    previewBtn.click();

    await waitFor(() => {
      expect(api.previewEmailTemplate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          draft: expect.objectContaining({
            subject_template: 'Sua proposta {{person.first_name}}',
          }),
        })
      );
      expect(screen.getByText('Prévia: Sua proposta Maria')).toBeInTheDocument();
      expect(screen.getByText('Dados de demonstração')).toBeInTheDocument();
    });
  });

  it('triggers sendTemplateTest with draft data and displays error if delivery fails', async () => {
    jest.mocked(api.sendTemplateTest).mockRejectedValue(new Error('AWS SES não configurado.'));

    render(<TemplatesWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Proposta Solar')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Editar/i });
    editBtn.click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enviar teste/i })).toBeInTheDocument();
    });

    const testSendBtn = screen.getByRole('button', { name: /Enviar teste/i });
    testSendBtn.click();

    await waitFor(() => {
      expect(screen.getByText('Enviar E-mail de Teste')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('seu.email@empresa.com.br');
    fireEvent.change(input, { target: { value: 'teste@exemplo.com' } });

    const submitBtn = screen.getByRole('button', { name: /Enviar Agora/i });
    submitBtn.click();

    await waitFor(() => {
      expect(api.sendTemplateTest).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          to_email: 'teste@exemplo.com',
          draft: expect.objectContaining({
            name: 'Proposta Solar',
          }),
        })
      );
      expect(screen.getAllByText('AWS SES não configurado.').length).toBeGreaterThan(0);
    });
  });
});
