import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpportunityTagPicker from '@/components/sales/opportunities/OpportunityTagPicker';
import { salesApi } from '@/lib/api/sales/client';

jest.mock('@/lib/api/sales/client', () => ({
  salesApi: {
    getTags: jest.fn(),
    applyTag: jest.fn(),
    removeTag: jest.fn(),
    createTag: jest.fn(),
  },
}));

describe('OpportunityTagPicker component', () => {
  const mockInitialTags = [
    { id: 1, name: 'Alta Prioridade', slug: 'alta-prioridade', color: '#0284c7', entity_type: 'Opportunity' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial tags with their names and remove buttons', () => {
    render(<OpportunityTagPicker opportunityId={123} initialTags={mockInitialTags} />);

    expect(screen.getByText('Alta Prioridade')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remover marcador alta prioridade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add tag\.\.\./i })).toBeInTheDocument();
  });

  it('renders "+ Add tags..." when no tags are attached', () => {
    render(<OpportunityTagPicker opportunityId={123} initialTags={[]} />);

    expect(screen.getByRole('button', { name: /\+ add tags\.\.\./i })).toBeInTheDocument();
  });

  it('opens popover, loads tags from API and allows toggling a tag', async () => {
    const orgTags = [
      { id: 1, name: 'Alta Prioridade', slug: 'alta-prioridade', color: '#0284c7', entity_type: 'Opportunity' },
      { id: 2, name: 'Cliente Interessado', slug: 'cliente-interessado', color: '#16a34a', entity_type: 'Opportunity' },
    ];
    (salesApi.getTags as jest.Mock).mockResolvedValue(orgTags);
    (salesApi.applyTag as jest.Mock).mockResolvedValue(undefined);

    const onUpdated = jest.fn();
    render(<OpportunityTagPicker opportunityId={123} initialTags={mockInitialTags} onUpdated={onUpdated} />);

    // Click trigger to open popover
    const triggerBtn = screen.getByRole('button', { name: /add tag\.\.\./i });
    await userEvent.click(triggerBtn);

    // Expect tags to be fetched and listed
    await waitFor(() => {
      expect(salesApi.getTags).toHaveBeenCalledWith('Opportunity');
      expect(screen.getByText('Cliente Interessado')).toBeInTheDocument();
    });

    // Toggle unapplied tag
    const tagToApply = screen.getByText('Cliente Interessado');
    await userEvent.click(tagToApply);

    await waitFor(() => {
      expect(salesApi.applyTag).toHaveBeenCalledWith(2, 'Opportunity', 123);
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('removes an applied tag when remove button is clicked', async () => {
    (salesApi.removeTag as jest.Mock).mockResolvedValue(undefined);
    const onUpdated = jest.fn();

    render(<OpportunityTagPicker opportunityId={123} initialTags={mockInitialTags} onUpdated={onUpdated} />);

    const removeBtn = screen.getByRole('button', { name: /remover marcador alta prioridade/i });
    await userEvent.click(removeBtn);

    await waitFor(() => {
      expect(salesApi.removeTag).toHaveBeenCalledWith(1, 'Opportunity', 123);
      expect(onUpdated).toHaveBeenCalled();
      expect(screen.queryByText('Alta Prioridade')).not.toBeInTheDocument();
    });
  });

  it('allows creating a new tag under search query and applies it immediately', async () => {
    (salesApi.getTags as jest.Mock).mockResolvedValue([]);
    const createdTag = {
      id: 99,
      name: 'Parecer Pendente',
      slug: 'parecer-pendente',
      color: '#0284c7',
      entity_type: 'Opportunity',
    };
    (salesApi.createTag as jest.Mock).mockResolvedValue(createdTag);
    (salesApi.applyTag as jest.Mock).mockResolvedValue(undefined);

    const onUpdated = jest.fn();
    render(<OpportunityTagPicker opportunityId={123} initialTags={[]} onUpdated={onUpdated} />);

    // Open popover
    await userEvent.click(screen.getByRole('button', { name: /\+ add tags\.\.\./i }));

    const searchInput = await screen.findByPlaceholderText(/buscar ou criar marcador\.\.\./i);
    await userEvent.type(searchInput, 'Parecer Pendente');

    // Click the create button
    const createBtn = await screen.findByText(/criar marcador “parecer pendente”/i);
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(salesApi.createTag).toHaveBeenCalledWith({
        name: 'Parecer Pendente',
        color: '#0284c7',
        entity_type: 'Opportunity',
      });
      expect(salesApi.applyTag).toHaveBeenCalledWith(99, 'Opportunity', 123);
      expect(onUpdated).toHaveBeenCalled();
      expect(screen.getAllByText('Parecer Pendente').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays real API errors when loading tags fails', async () => {
    (salesApi.getTags as jest.Mock).mockRejectedValue(new Error('Erro 500 no banco'));

    render(<OpportunityTagPicker opportunityId={123} initialTags={[]} />);

    await userEvent.click(screen.getByRole('button', { name: /\+ add tags\.\.\./i }));

    await waitFor(() => {
      expect(screen.getByText('Erro 500 no banco')).toBeInTheDocument();
    });
  });
});
