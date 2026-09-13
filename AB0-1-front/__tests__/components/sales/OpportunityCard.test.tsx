import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunityCard } from '@/components/sales/pipeline/OpportunityCard';
import { PipelineCardDTO } from '@/components/sales/pipeline/OpportunityCard/OpportunityCard.types';

const mockCard: PipelineCardDTO = {
  id: 42,
  name: 'Oportunidade Usina Solar 50kWp',
  status: 'open',
  account: {
    id: 101,
    name: 'Solar Tech Cuiabá',
  },
  primary_contact: {
    id: 201,
    name: 'João Carlos Silva',
    email: 'joao@solartech.com.br',
    phone: '65999998888',
  },
  owner: {
    id: 301,
    name: 'Felipe Santos',
  },
  stage: {
    id: 1,
    key: 'prospect',
    name: 'Prospect',
    position: 1,
    probability: 10,
  },
  value_cents: 150000,
  currency: 'BRL',
  probability: 10,
  weighted_value_cents: 15000,
  priority: 'high',
  temperature: 'cold',
  source: 'Indicação',
  qualification: {
    score: 80,
    bant_summary: 'BANT Qualificado',
  },
  last_activity: {
    id: 501,
    type: 'call',
    description: 'Ligação de alinhamento com engenharia',
    occurred_at: '2026-09-10T10:00:00Z',
  },
  next_action: {
    id: 601,
    type: 'meeting',
    title: 'Apresentar proposta técnica',
    due_at: '2026-09-15T14:00:00Z',
    overdue: false,
  },
  aging: {
    days_in_stage: 2,
    stage_entered_at: '2026-09-10T00:00:00Z',
    stale: false,
  },
  flags: {
    overdue: false,
    due_today: false,
    stale: false,
    hot: false,
    no_contact: false,
    no_owner: false,
  },
  tags: [
    { id: 1, name: 'Comercial', color: '#10b981' },
  ],
};

describe('OpportunityCard Dual-Density Component', () => {
  const onOpenDetails = jest.fn();
  const onToggleSelect = jest.fn();
  const onToggleExpand = jest.fn();
  const onDragStart = jest.fn();
  const onAction = jest.fn();
  const onCreateTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Compact Density Mode', () => {
    it('renders required operational data in compact mode', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
        />
      );

      // Card container testids
      expect(screen.getByTestId('opportunity-card-42')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-card-compact-42')).toBeInTheDocument();
      expect(screen.queryByTestId('opportunity-card-expanded-42')).not.toBeInTheDocument();

      // Company and contact
      expect(screen.getByText('Solar Tech Cuiabá')).toBeInTheDocument();
      expect(screen.getByText('João Carlos Silva')).toBeInTheDocument();

      // Value, probability and aging
      expect(screen.getByText('R$ 1.500')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('2d')).toBeInTheDocument();

      // Temperature badge
      expect(screen.getByText('COLD')).toBeInTheDocument();

      // Expand control button
      const expandBtn = screen.getByTestId('opportunity-card-expand-42');
      expect(expandBtn).toBeInTheDocument();
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
      expect(expandBtn).toHaveAttribute('aria-label', 'Expandir oportunidade');

      // Hidden details in compact mode
      expect(screen.queryByText('Ligação de alinhamento com engenharia')).not.toBeInTheDocument();
      expect(screen.queryByText('Apresentar proposta técnica')).not.toBeInTheDocument();
      expect(screen.queryByText('BANT Qualificado')).not.toBeInTheDocument();
    });

    it('triggers onToggleExpand without triggering onOpenDetails when clicking expand button', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
        />
      );

      const expandBtn = screen.getByTestId('opportunity-card-expand-42');
      fireEvent.click(expandBtn);

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).not.toHaveBeenCalled();
    });

    it('triggers onToggleSelect without triggering onOpenDetails when clicking checkbox', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
          onAction={onAction}
        />
      );

      const checkbox = screen.getByTestId('opportunity-card-checkbox-42');
      fireEvent.click(checkbox);

      expect(onToggleSelect).toHaveBeenCalledWith(42);
      expect(onOpenDetails).not.toHaveBeenCalled();
    });
  });

  describe('Expanded Density Mode', () => {
    it('renders full operational and informational context when expanded', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="expanded"
          onOpenDetails={onOpenDetails}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
          onCreateTask={onCreateTask}
        />
      );

      expect(screen.getByTestId('opportunity-card-42')).toBeInTheDocument();
      expect(screen.getByTestId('opportunity-card-expanded-42')).toBeInTheDocument();
      expect(screen.queryByTestId('opportunity-card-compact-42')).not.toBeInTheDocument();

      // Informational context rendered
      expect(screen.getByText('Ligação de alinhamento com engenharia')).toBeInTheDocument();
      expect(screen.getByText('Apresentar proposta técnica')).toBeInTheDocument();
      expect(screen.getByText('BANT Qualificado')).toBeInTheDocument();
      expect(screen.getByText('Comercial')).toBeInTheDocument();

      // Collapse button has aria-expanded="true"
      const collapseBtn = screen.getByTestId('opportunity-card-expand-42');
      expect(collapseBtn).toBeInTheDocument();
      expect(collapseBtn).toHaveAttribute('aria-expanded', 'true');
      expect(collapseBtn).toHaveAttribute('aria-label', 'Recolher oportunidade');
    });

    it('triggers onToggleExpand without triggering onOpenDetails when clicking collapse button', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="expanded"
          onOpenDetails={onOpenDetails}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
        />
      );

      const collapseBtn = screen.getByTestId('opportunity-card-expand-42');
      fireEvent.click(collapseBtn);

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).not.toHaveBeenCalled();
    });
  });

  describe('Card Body Interactions & Accessibility', () => {
    it('triggers onOpenDetails when clicking the card body', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      const card = screen.getByTestId('opportunity-card-42');
      fireEvent.click(card);

      expect(onOpenDetails).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).toHaveBeenCalledWith(mockCard);
    });

    it('triggers onOpenDetails when pressing Enter or Space on the card', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      const card = screen.getByTestId('opportunity-card-42');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onOpenDetails).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: ' ' });
      expect(onOpenDetails).toHaveBeenCalledTimes(2);
    });

    it('supports drag start events with the card payload', () => {
      render(
        <OpportunityCard
          card={mockCard}
          density="compact"
          onOpenDetails={onOpenDetails}
          onDragStart={onDragStart}
        />
      );

      const card = screen.getByTestId('opportunity-card-42');
      fireEvent.dragStart(card);

      expect(onDragStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Operational Visual States', () => {
    it('applies selected styles when selected=true', () => {
      render(
        <OpportunityCard
          card={mockCard}
          selected={true}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      const card = screen.getByTestId('opportunity-card-42');
      expect(card.className).toContain('border-blue-700');
      expect(card.className).toContain('ring-2');
    });

    it('applies overdue border when card has overdue flag', () => {
      const overdueCard = {
        ...mockCard,
        flags: { ...mockCard.flags, overdue: true },
      };

      render(
        <OpportunityCard
          card={overdueCard}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      const card = screen.getByTestId('opportunity-card-42');
      expect(card.className).toContain('border-red-300');
    });

    it('renders HOT temperature badge correctly', () => {
      const hotCard = {
        ...mockCard,
        temperature: 'hot',
      };

      render(
        <OpportunityCard
          card={hotCard}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    it('renders WARM temperature badge correctly', () => {
      const warmCard = {
        ...mockCard,
        temperature: 'warm',
      };

      render(
        <OpportunityCard
          card={warmCard}
          density="compact"
          onOpenDetails={onOpenDetails}
        />
      );

      expect(screen.getByText('WARM')).toBeInTheDocument();
    });
  });
});
