import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SelectEligibleLeadDialog } from '@/components/company-dashboard/proposals/SelectEligibleLeadDialog';
import type { MarketplaceProposal } from '@/lib/api';

describe('SelectEligibleLeadDialog', () => {
  const mockDistributions = [
    {
      id: 101,
      status: 'accepted',
      assigned_at: '2026-10-10T10:00:00Z',
      lead: {
        id: 201,
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(11) 98888-7777',
        project_profile: 'Residencial',
        city: 'São Paulo',
        state: 'SP',
        monthly_kwh: 450,
        bill_value: 420,
      },
    },
    {
      id: 102,
      status: 'accepted',
      assigned_at: '2026-10-11T10:00:00Z',
      lead: {
        id: 202,
        name: 'João Santos',
        email: 'joao@example.com',
        phone: '(11) 97777-6666',
        project_profile: 'Comercial',
        city: 'Campinas',
        state: 'SP',
        monthly_kwh: 1200,
        bill_value: 1100,
      },
    },
  ];

  const mockExistingProposals: MarketplaceProposal[] = [
    {
      id: 1,
      reference: 'AS-2026-D00000001',
      status: 'sent',
      total_cents: 2000000,
      currency: 'BRL',
      created_at: '2026-10-10T12:00:00Z',
      lead_distribution_id: 101, // Já possui proposta
      company: { id: 1, name: 'Empresa Teste' },
      lead: mockDistributions[0].lead,
    },
  ];

  it('filtra distribuições que já possuem propostas criadas (G-05)', () => {
    render(
      <SelectEligibleLeadDialog
        isOpen={true}
        onClose={jest.fn()}
        distributions={mockDistributions}
        existingProposals={mockExistingProposals}
        onConfirm={jest.fn()}
        isCreating={false}
      />
    );

    // Maria Silva já tem proposta (dist 101), portanto só João Santos (dist 102) deve estar disponível
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
    expect(screen.getByText('João Santos')).toBeInTheDocument();
    expect(screen.getByText('1200 kWh/mês')).toBeInTheDocument();
  });

  it('exige seleção de um lead antes de habilitar a confirmação', async () => {
    const onConfirmMock = jest.fn();

    render(
      <SelectEligibleLeadDialog
        isOpen={true}
        onClose={jest.fn()}
        distributions={mockDistributions}
        existingProposals={mockExistingProposals}
        onConfirm={onConfirmMock}
        isCreating={false}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Criar proposta para este lead/i });
    expect(submitBtn).toBeDisabled();

    // Selecionar João Santos
    fireEvent.click(screen.getByText('João Santos'));
    expect(submitBtn).toBeEnabled();

    // Confirmar
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith(102);
    });
  });
});
