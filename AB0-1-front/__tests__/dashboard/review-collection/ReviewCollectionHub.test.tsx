import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewCollectionHub } from '@/app/dashboard/components/review-collection/ReviewCollectionHub';
import { ReputationMilestones } from '@/app/dashboard/components/review-collection/ReputationMilestones';
import { ReviewButtonEmbed } from '@/app/dashboard/components/review-collection/ReviewButtonEmbed';
import { ShareableReviewForm } from '@/app/dashboard/components/review-collection/ReviewShareCard';

jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('ReviewCollectionHub & Children', () => {
  const sampleForms: ShareableReviewForm[] = [
    {
      id: 1,
      name: 'Formulário Principal',
      token: 'tok-main',
      status: 'active',
      settings: { whatsapp_message: 'Avalie nossa empresa: {{review_form_link}}' },
    },
    {
      id: 2,
      name: 'Formulário Pós-Venda',
      token: 'tok-pos',
      status: 'active',
    },
  ];

  it('renders empty state when no forms exist', () => {
    const onCreate = jest.fn();
    render(
      <ReviewCollectionHub
        forms={[]}
        onSelectForm={jest.fn()}
        onCreateForm={onCreate}
        companyName="Solar Alfa"
        approvedReviewsCount={0}
      />
    );

    expect(screen.getByText('Nenhum canal de coleta configurado')).toBeInTheDocument();
    const btn = screen.getByText('Criar Primeiro Formulário');
    fireEvent.click(btn);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders active form and share actions when forms exist', () => {
    const onSelect = jest.fn();
    render(
      <ReviewCollectionHub
        forms={sampleForms}
        selectedFormId={1}
        onSelectForm={onSelect}
        onCreateForm={jest.fn()}
        companyName="Solar Alfa"
        approvedReviewsCount={5}
      />
    );

    expect(screen.getAllByText('Formulário Principal').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Link público do formulário de avaliação')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solicitar via e-mail/i })).toBeInTheDocument();
    expect(screen.getByText(/QR Code · Baixar PNG/)).toBeInTheDocument();
  });

  it('renders form selector dropdown when more than 1 form is present', () => {
    const onSelect = jest.fn();
    render(
      <ReviewCollectionHub
        forms={sampleForms}
        selectedFormId={1}
        onSelectForm={onSelect}
        onCreateForm={jest.fn()}
        companyName="Solar Alfa"
        approvedReviewsCount={5}
      />
    );

    const select = screen.getByLabelText(/selecione o formulário para coleta/i);
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '2' } });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('disables actions when selected form is inactive', () => {
    const inactiveForm: ShareableReviewForm = {
      id: 3,
      name: 'Formulário Antigo',
      token: 'tok-old',
      status: 'inactive',
    };

    render(
      <ReviewCollectionHub
        forms={[inactiveForm]}
        selectedFormId={3}
        onSelectForm={jest.fn()}
        onCreateForm={jest.fn()}
        companyName="Solar Alfa"
        approvedReviewsCount={0}
      />
    );

    expect(screen.getByText(/Este formulário está inativo no momento/i)).toBeInTheDocument();
  });

  describe('ReputationMilestones', () => {
    it('shows pending status for all milestones when count is 0', () => {
      render(<ReputationMilestones approvedReviewsCount={0} />);
      expect(screen.getByTestId('milestone-completed-count')).toHaveTextContent('0/3 marcos concluídos');
      expect(screen.getByTestId('milestone-first_review')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-progress').getAttribute('style')).toContain('width: 0%');
    });

    it('shows first milestone achieved when count is 5', () => {
      render(<ReputationMilestones approvedReviewsCount={5} />);
      expect(screen.getByTestId('milestone-completed-count')).toHaveTextContent('1/3 marcos concluídos');
      expect(screen.getByTestId('milestone-first_review').getAttribute('aria-label')).toContain('Concluído');
      expect(screen.getByTestId('milestone-ranking_ready').getAttribute('aria-label')).toContain('Próximo marco');
    });

    it('shows celebration state when count is 30 or more', () => {
      render(<ReputationMilestones approvedReviewsCount={32} />);
      expect(screen.getByTestId('milestone-completed-count')).toHaveTextContent('3/3 marcos concluídos');
    });
  });

  it('milestones support keyboard and show explanatory details without false badge grants', () => {
    render(<ReputationMilestones approvedReviewsCount={10} />);
    const last = screen.getByTestId('milestone-community_milestone');
    fireEvent.click(last);
    expect(last).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('milestone-info-panel')).toHaveTextContent('não há concessão automática');
  });

  it('shows no data when approved review totals are unavailable', () => {
    render(<ReputationMilestones approvedReviewsCount={null} />);
    expect(screen.getByTestId('milestone-completed-count')).toHaveTextContent('Progresso indisponível');
  });

  describe('ReviewButtonEmbed', () => {
    it('generates snippet with widget channel and copies to clipboard', async () => {
      render(<ReviewButtonEmbed formToken="tok-widget" companyName="Solar Alfa" />);

      const codeBlock = screen.getByText(/<!-- Avalia Solar Review Button -->/i);
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock.textContent).toContain('source=widget');
      expect(codeBlock.textContent).toContain('tok-widget');

      const copyBtn = screen.getByText('Copiar Código');
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
