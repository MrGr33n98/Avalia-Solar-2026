import {
  formatPowerTerm,
  formatGenerationTerm,
  formatDeadlineTerm,
  formatWarrantyTerm,
  getProposalCardMetrics,
  groupProposalsByProject,
} from '@/lib/marketplace-proposals';
import type { MarketplaceProposal } from '@/lib/api';

describe('marketplace-proposals helpers', () => {
  describe('formatters de termos técnicos', () => {
    it('formata termos de potência com segurança', () => {
      expect(formatPowerTerm(null)).toBeNull();
      expect(formatPowerTerm('')).toBeNull();
      expect(formatPowerTerm('8.5')).toBe('8,5 kWp');
      expect(formatPowerTerm('8,5')).toBe('8,5 kWp');
      expect(formatPowerTerm('10 kWp')).toBe('10 kWp');
      expect(formatPowerTerm('15 kW')).toBe('15 kW');
    });

    it('formata termos de geração estimada com segurança', () => {
      expect(formatGenerationTerm(null)).toBeNull();
      expect(formatGenerationTerm('')).toBeNull();
      expect(formatGenerationTerm('1150')).toBe('1.150 kWh/mês');
      expect(formatGenerationTerm('1200 kWh')).toBe('1200 kWh');
    });

    it('formata prazos de instalação', () => {
      expect(formatDeadlineTerm(null)).toBeNull();
      expect(formatDeadlineTerm('')).toBeNull();
      expect(formatDeadlineTerm('20')).toBe('20 dias');
      expect(formatDeadlineTerm('30 dias')).toBe('30 dias');
      expect(formatDeadlineTerm('2 meses')).toBe('2 meses');
    });

    it('formata garantias', () => {
      expect(formatWarrantyTerm(null)).toBeNull();
      expect(formatWarrantyTerm('')).toBeNull();
      expect(formatWarrantyTerm('25')).toBe('25 anos');
      expect(formatWarrantyTerm('10 anos')).toBe('10 anos');
    });
  });

  describe('groupProposalsByProject', () => {
    const baseProposal: MarketplaceProposal = {
      id: 1,
      reference: 'AS-2026-D001',
      status: 'sent',
      total_cents: 4850000,
      currency: 'BRL',
      created_at: '2026-10-15T12:00:00Z',
      company: {
        id: 10,
        name: 'SolarTech Energia',
        city: 'Florianópolis',
        state: 'SC',
      },
      request: {
        id: 42,
        project_profile: 'residential',
        city: 'Florianópolis',
        state: 'SC',
        created_at: '2026-10-14T10:00:00Z',
      },
      lead: {
        id: 42,
        name: 'Comprador Teste',
        city: 'Florianópolis',
        state: 'SC',
        monthly_kwh: 650,
      },
      version: {
        id: 101,
        number: 1,
        status: 'published',
        title: 'Sistema Residencial 8,5 kWp',
        total_cents: 4850000,
        currency: 'BRL',
        items: [],
        terms: [
          { id: 1, key: 'system_power', label: 'Potência', value: '8.5', position: 0 },
          { id: 2, key: 'monthly_generation', label: 'Geração', value: '1150', position: 1 },
          { id: 3, key: 'warranty', label: 'Garantia', value: '25', position: 2 },
          { id: 4, key: 'installation_deadline', label: 'Prazo', value: '20', position: 3 },
        ],
      },
    };

    it('agrupa propostas pelo id da solicitação/lead canônica', () => {
      const proposal2: MarketplaceProposal = {
        ...baseProposal,
        id: 2,
        company: {
          id: 11,
          name: 'EcoPower Soluções',
          city: 'São José',
          state: 'SC',
        },
      };

      const groups = groupProposalsByProject([baseProposal, proposal2]);
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe(42);
      expect(groups[0].title).toBe('Projeto Residencial');
      expect(groups[0].location).toBe('Florianópolis, SC');
      expect(groups[0].receivedCount).toBe(2);
      expect(groups[0].totalProposals).toBe(2);
      expect(groups[0].powerEstimate).toBe('8,5 kWp');
    });

    it('separa projetos distintos quando há leads diferentes', () => {
      const proposalDiffProject: MarketplaceProposal = {
        ...baseProposal,
        id: 3,
        request: {
          id: 99,
          project_profile: 'commercial',
          city: 'Joinville',
          state: 'SC',
        },
        lead: {
          id: 99,
          monthly_kwh: 3000,
        },
      };

      const groups = groupProposalsByProject([baseProposal, proposalDiffProject]);
      expect(groups).toHaveLength(2);
      expect(groups[0].id).toBe(42);
      expect(groups[1].id).toBe(99);
      expect(groups[1].title).toBe('Projeto Comercial');
    });

    it('extrai as 4 métricas técnicas do cartão', () => {
      const metrics = getProposalCardMetrics(baseProposal);
      expect(metrics).toHaveLength(4);
      expect(metrics[0]).toEqual({ key: 'power', label: 'Potência', value: '8,5 kWp' });
      expect(metrics[1]).toEqual({ key: 'generation', label: 'Geração estimada', value: '1.150 kWh/mês' });
      expect(metrics[2]).toEqual({ key: 'warranty', label: 'Garantia', value: '25 anos' });
      expect(metrics[3]).toEqual({ key: 'deadline', label: 'Prazo', value: '20 dias' });
    });
  });
});
