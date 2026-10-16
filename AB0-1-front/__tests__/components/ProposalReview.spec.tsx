import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProposalReview } from '@/components/reviewer/proposals/ProposalReview';
import { reviewsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  reviewsApi: {
    create: jest.fn(),
  },
}));

describe('ProposalReview', () => {
  const mockProposal: MarketplaceProposal = {
    id: 99,
    reference: 'AS-2026-D00000099',
    status: 'completed',
    total_cents: 3500000,
    currency: 'BRL',
    created_at: '2026-10-10T12:00:00Z',
    company: {
      id: 15,
      name: 'SolarTech Brasil',
      city: 'Curitiba',
      state: 'PR',
    },
    project: {
      id: 501,
      status: 'completed',
      milestones: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o formulário de avaliação da proposta com dados da empresa e referência', () => {
    render(<ProposalReview proposal={mockProposal} onBack={jest.fn()} />);

    expect(screen.getByText('SolarTech Brasil')).toBeInTheDocument();
    expect(screen.getByText('Proposta #AS-2026-D00000099')).toBeInTheDocument();
    expect(screen.getByText('Avaliação e feedback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar avaliação/i })).toBeInTheDocument();
  });

  it('envia a avaliação com sucesso chamando reviewsApi.create com content_metadata correto', async () => {
    (reviewsApi.create as jest.Mock).mockResolvedValueOnce({ id: 1, rating: 5 });
    const onSubmitted = jest.fn();

    render(
      <ProposalReview
        proposal={mockProposal}
        onBack={jest.fn()}
        onSubmitted={onSubmitted}
      />
    );

    const commentInput = screen.getByPlaceholderText(/Como foi o atendimento/i);
    fireEvent.change(commentInput, {
      target: { value: 'Excelente atendimento e instalação muito rápida!' },
    });

    const submitBtn = screen.getByRole('button', { name: /Enviar avaliação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewsApi.create).toHaveBeenCalledTimes(1);
      expect(reviewsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 15,
          rating: 5,
          comment: 'Excelente atendimento e instalação muito rápida!',
          content_metadata: expect.objectContaining({
            proposal_id: 99,
            project_id: 501,
            proposal_code: 'AS-2026-D00000099',
            equipment_rating: 5,
            deadline_rating: 5,
            communication_rating: 5,
            installation_rating: 5,
            post_sale_rating: 5,
            cost_benefit_rating: 5,
          }),
        })
      );
      expect(onSubmitted).toHaveBeenCalled();
    });

    expect(screen.getByText('Avaliação enviada com sucesso!')).toBeInTheDocument();
  });

  it('exibe mensagem de erro amigável quando reviewsApi.create falha', async () => {
    (reviewsApi.create as jest.Mock).mockRejectedValueOnce(
      new Error('Você já avaliou esta empresa nesta categoria.')
    );

    render(<ProposalReview proposal={mockProposal} onBack={jest.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /Enviar avaliação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Você já avaliou esta empresa nesta categoria.')
      ).toBeInTheDocument();
    });
  });
});
