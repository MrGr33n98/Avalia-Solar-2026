import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getStageChecklist,
  saveStageChecklist,
  getOpportunityChecklistState,
  setOpportunityChecklistItem,
  DEFAULT_STAGE_CHECKLISTS,
} from '@/components/sales/pipeline/stageChecklistUtils';
import OpportunitySalesProcessTab from '@/components/sales/opportunities/OpportunitySalesProcessTab';
import SalesPipelinesSettingsPage from '@/app/dashboard/sales/settings/pipelines/page';
import { salesApi } from '@/lib/api/sales/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/sales/settings/pipelines',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock salesApi
jest.mock('@/lib/api/sales/client', () => ({
  salesApi: {
    getPipelines: jest.fn(),
    createPipeline: jest.fn(),
    updatePipeline: jest.fn(),
    deletePipeline: jest.fn(),
    updateOpportunity: jest.fn(),
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Felipe Henrique', email: 'felipe@avaliasolar.com.br' },
    isAdmin: true,
  }),
}));

describe('Pipelines & Stage Checklist Management', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('stageChecklistUtils', () => {
    it('returns canonical default checklist for known stages', () => {
      const prospectChecklist = getStageChecklist('sales', 'prospect');
      expect(prospectChecklist.length).toBeGreaterThan(0);
      expect(prospectChecklist[0]).toContain('Confirmar dados');

      const proposalChecklist = getStageChecklist('sales', 'proposal');
      expect(proposalChecklist.some((item) => item.includes('dimensionamento'))).toBe(true);
    });

    it('persists and retrieves custom stage checklist in localStorage', () => {
      const customItems = ['Analisar telhado no drone', 'Solicitar ART de engenharia'];
      saveStageChecklist('sales', 'custom_survey', customItems);

      const retrieved = getStageChecklist('sales', 'custom_survey');
      expect(retrieved).toEqual(customItems);
    });

    it('manages opportunity checklist item completion state', () => {
      const oppId = 999;
      const stageKey = 'qualified';
      const item = 'Validar perfil BANT';

      expect(getOpportunityChecklistState(oppId, stageKey)[item]).toBeFalsy();

      setOpportunityChecklistItem(oppId, stageKey, item, true);
      expect(getOpportunityChecklistState(oppId, stageKey)[item]).toBe(true);

      setOpportunityChecklistItem(oppId, stageKey, item, false);
      expect(getOpportunityChecklistState(oppId, stageKey)[item]).toBe(false);
    });
  });

  describe('OpportunitySalesProcessTab', () => {
    const mockOpp = {
      id: 101,
      name: 'Residencial Alphaville 5kWp',
      stage_key: 'proposal',
      stage: { id: 5, key: 'proposal', name: 'Apresentação & Proposta', probability: 65 },
      probability: 65,
    };

    const mockPipeline = {
      id: 1,
      name: 'Avalia Solar B2B Sales',
      key: 'b2b_sales',
      stages: [
        { id: 1, key: 'prospect', name: 'Prospecção', position: 1, probability: 10 },
        { id: 2, key: 'proposal', name: 'Apresentação & Proposta', position: 2, probability: 65 },
        { id: 3, key: 'won', name: 'Fechado Ganho', position: 3, probability: 100 },
      ],
    };

    it('renders current stage name, probability, and settings link', () => {
      render(<OpportunitySalesProcessTab opp={mockOpp} activePipeline={mockPipeline} />);

      expect(screen.getByText(/Etapa Atual: Apresentação & Proposta/i)).toBeInTheDocument();
      expect(screen.getByText(/65% prob/i)).toBeInTheDocument();

      const settingsLink = screen.getByTitle(/Configurar etapas e diretrizes nas Configurações do CRM/i);
      expect(settingsLink).toHaveAttribute('href', '/dashboard/sales/settings/pipelines');
    });

    it('allows toggling checklist tasks and updates completion percentage', () => {
      render(<OpportunitySalesProcessTab opp={mockOpp} activePipeline={mockPipeline} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Initially unchecked
      expect(checkboxes[0]).not.toBeChecked();

      // Click to check
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('SalesPipelinesSettingsPage', () => {
    const mockPipelines = [
      {
        id: 1,
        name: 'Funil Comercial B2B',
        key: 'b2b_sales',
        active: true,
        opportunities_count: 5,
        stages: [
          { id: 10, name: 'Prospecção', key: 'prospect', position: 1, probability: 20, terminal_type: null },
          { id: 20, name: 'Fechado Ganho', key: 'won', position: 2, probability: 100, terminal_type: 'won' },
        ],
      },
    ];

    beforeEach(() => {
      (salesApi.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);
    });

    it('renders pipelines list and stage configuration', async () => {
      render(<SalesPipelinesSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pipelines & Processos de Venda')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Funil Comercial B2B')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Prospecção')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Fechado Ganho')).toBeInTheDocument();
    });

    it('switches between Admin and Read-Only simulation modes', async () => {
      render(<SalesPipelinesSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pipelines & Processos de Venda')).toBeInTheDocument();
      });

      // Default is Admin
      const saveButtons = screen.getAllByRole('button', { name: /Salvar Alterações/i });
      expect(saveButtons[0]).toBeEnabled();

      // Click Read-Only profile button
      const readOnlyBtn = screen.getByRole('button', { name: /Read-Only/i });
      fireEvent.click(readOnlyBtn);

      // Read-Only warning banner appears
      expect(screen.getByText(/Modo Somente Leitura:/i)).toBeInTheDocument();

      // Save button becomes disabled
      const readOnlySaveButtons = screen.getAllByRole('button', { name: /Salvar Alterações/i });
      expect(readOnlySaveButtons[0]).toBeDisabled();
    });
  });
});
