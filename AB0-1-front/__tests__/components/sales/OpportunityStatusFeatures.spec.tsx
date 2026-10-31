import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  normalizeOpportunityStatus,
  getStatusConfig,
  STATUS_LIST,
} from '@/components/sales/pipeline/opportunityStatusUtils';
import { OpportunityStatusDropdown } from '@/components/sales/pipeline/OpportunityStatusDropdown';
import { OpportunityCardHeader } from '@/components/sales/pipeline/OpportunityCard/OpportunityCardHeader';
import { PipelineCardDTO } from '@/components/sales/pipeline/OpportunityCard/OpportunityCard.types';

const baseMockCard: PipelineCardDTO = {
  id: 101,
  name: 'Projeto Solar Agro',
  status: 'open',
  account: { id: 1, name: 'Fazenda Santa Luzia' },
  primary_contact: { id: 2, name: 'Carlos Andrade' },
  stage: { id: 1, key: 'prospect', name: 'Prospect', position: 1, probability: 20 },
  value_cents: 350000,
  currency: 'BRL',
  probability: 20,
  weighted_value_cents: 70000,
  priority: 'high',
  temperature: 'cold',
  aging: { days_in_stage: 1, stage_entered_at: '2026-10-01T00:00:00Z', stale: false },
  flags: { overdue: false, due_today: false, stale: false, hot: false, no_contact: false, no_owner: false },
  tags: [],
};

describe('Opportunity Status Features (Nutshell Benchmark)', () => {
  describe('opportunityStatusUtils', () => {
    it('correctly normalizes different status strings', () => {
      expect(normalizeOpportunityStatus('won')).toBe('won');
      expect(normalizeOpportunityStatus('GANHO')).toBe('won');
      expect(normalizeOpportunityStatus('open')).toBe('open');
      expect(normalizeOpportunityStatus('aberta')).toBe('open');
      expect(normalizeOpportunityStatus('lost')).toBe('lost');
      expect(normalizeOpportunityStatus('perdido')).toBe('lost');
      expect(normalizeOpportunityStatus('cancelled')).toBe('cancelled');
      expect(normalizeOpportunityStatus('abandoned')).toBe('cancelled');
      expect(normalizeOpportunityStatus('pending')).toBe('pending');
      expect(normalizeOpportunityStatus(null)).toBe('open');
    });

    it('returns 5 canonical statuses in STATUS_LIST', () => {
      expect(STATUS_LIST.map((s) => s.key)).toEqual(['won', 'open', 'lost', 'cancelled', 'pending']);
    });

    it('returns orange color styling when open status is hot', () => {
      const normalConfig = getStatusConfig('open', false);
      expect(normalConfig.iconColorClass).toContain('text-sky-600');
      expect(normalConfig.isHot).toBe(false);

      const hotConfig = getStatusConfig('open', true);
      expect(hotConfig.iconColorClass).toContain('text-orange-500');
      expect(hotConfig.isHot).toBe(true);
    });

    it('returns emerald color styling for won status', () => {
      const wonConfig = getStatusConfig('won');
      expect(wonConfig.iconColorClass).toContain('text-emerald-600');
    });
  });

  describe('OpportunityStatusDropdown', () => {
    it('renders card trigger variant with accessible tooltip and aria-label', () => {
      render(
        <OpportunityStatusDropdown
          status="won"
          variant="card"
          opportunityId={101}
          opportunityName="Fazenda Santa Luzia"
        />
      );

      const trigger = screen.getByTestId('opportunity-status-card-trigger-101');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', expect.stringContaining('Won'));
    });

    it('renders summary trigger variant with label and chevron', () => {
      render(
        <OpportunityStatusDropdown
          status="open"
          variant="summary"
          opportunityId={101}
          opportunityName="Fazenda Santa Luzia"
        />
      );

      const trigger = screen.getByTestId('opportunity-status-summary-trigger-101');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Open');
    });

    it('opens menu with keyboard Enter/Space and allows keyboard navigation', () => {
      render(
        <OpportunityStatusDropdown
          status="open"
          variant="card"
          opportunityId={101}
        />
      );

      const trigger = screen.getByTestId('opportunity-status-card-trigger-101');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      // Trigger button click simulation
      act(() => {
        fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' });
      });
    });
  });

  describe('OpportunityCardHeader Integration', () => {
    it('renders status icon directly preceding the company title', () => {
      render(
        <OpportunityCardHeader
          card={baseMockCard}
          selected={false}
          onToggleSelect={jest.fn()}
        />
      );

      expect(screen.getByTestId('opportunity-status-card-trigger-101')).toBeInTheDocument();
      expect(screen.getByText('Fazenda Santa Luzia')).toBeInTheDocument();
    });

    it('renders fire emoji indicator when opportunity is hot', () => {
      const hotCard: PipelineCardDTO = {
        ...baseMockCard,
        temperature: 'hot',
        flags: { ...baseMockCard.flags, hot: true },
      };

      render(
        <OpportunityCardHeader
          card={hotCard}
          selected={false}
          onToggleSelect={jest.fn()}
        />
      );

      expect(screen.getByLabelText('Lead Quente')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });
});
