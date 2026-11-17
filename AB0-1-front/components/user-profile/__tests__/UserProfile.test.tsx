import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileTrustCard } from '../UserProfileTrustCard';
import { LinkedInVerifyButton } from '../LinkedInVerifyButton';
import { UserProfileSidebarNav } from '../UserProfileSidebarNav';
import { PrivacySettingsTab } from '../tabs/PrivacySettingsTab';
import { ProductsIUseTab } from '../tabs/ProductsIUseTab';
import { TrustAnchor, PrivacySettings, EquipmentItem } from '../types';

describe('UserProfile Components (G2 Inspired B2B Reputation)', () => {
  const mockTrustAnchor: TrustAnchor = {
    full_name: 'Felipe Henriques Morais',
    display_name: 'Felipe H.',
    avatar_url: null,
    role: 'Founder',
    company: 'Avalia Solar',
    member_since: '2025-01-17T00:00:00Z',
    is_verified: true,
    trust_score: 85,
    connected_accounts: ['linkedin', 'google'],
  };

  describe('UserProfileTrustCard', () => {
    it('renderiza nome, cargo, empresa e prova de tempo de casa', () => {
      render(<UserProfileTrustCard trustAnchor={mockTrustAnchor} />);

      expect(screen.getByText('Felipe Henriques Morais')).toBeInTheDocument();
      expect(screen.getByText('Founder')).toBeInTheDocument();
      expect(screen.getByText('Avalia Solar')).toBeInTheDocument();
      expect(screen.getByText(/Membro desde/i)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('LinkedInVerifyButton', () => {
    it('exibe badge de verificado quando isVerified=true', () => {
      render(<LinkedInVerifyButton isVerified={true} />);
      expect(screen.getByTestId('linkedin-verified-badge')).toBeInTheDocument();
      expect(screen.getByText('Profissional Verificado')).toBeInTheDocument();
    });

    it('exibe botão de ação quando isVerified=false', () => {
      const onVerify = jest.fn();
      render(<LinkedInVerifyButton isVerified={false} onVerify={onVerify} />);

      const button = screen.getByTestId('linkedin-verify-button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(onVerify).toHaveBeenCalledTimes(1);
    });
  });

  describe('UserProfileSidebarNav', () => {
    it('renderiza os itens de navegação e dispara onSelectTab ao clicar', () => {
      const onSelect = jest.fn();
      render(
        <UserProfileSidebarNav
          activeTab="profile_details"
          onSelectTab={onSelect}
          stats={{ reviews_count: 5, saved_reviews_count: 2, drafts_count: 1, equipments_count: 3 }}
        />
      );

      const navReviews = screen.getByTestId('user-nav-my_reviews');
      expect(navReviews).toBeInTheDocument();
      fireEvent.click(navReviews);
      expect(onSelect).toHaveBeenCalledWith('my_reviews');
    });
  });

  describe('PrivacySettingsTab', () => {
    it('alterna o toggle de anonimização e atualiza a pré-visualização ao vivo', () => {
      const mockPrivacy: PrivacySettings = {
        anonymize_last_name: true,
        email_frequency: 'weekly',
        profile_visibility: 'public',
      };
      const onSave = jest.fn().mockResolvedValue(undefined);

      render(
        <PrivacySettingsTab
          initialSettings={mockPrivacy}
          userFullName="Felipe Henriques Morais"
          onSave={onSave}
        />
      );

      // Com anonimização ativa, exibe "Felipe H."
      expect(screen.getByText('Felipe H.')).toBeInTheDocument();

      const toggle = screen.getByTestId('anonymize-toggle');
      fireEvent.click(toggle);

      // Desativado, exibe nome completo
      expect(screen.getByText('Felipe Henriques Morais')).toBeInTheDocument();
    });
  });

  describe('ProductsIUseTab', () => {
    it('exibe empty state ilustrado quando a lista de equipamentos for vazia', () => {
      render(<ProductsIUseTab equipments={[]} />);
      expect(screen.getByTestId('products-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Você ainda não adicionou nenhum equipamento/i)).toBeInTheDocument();
    });

    it('lista equipamentos quando fornecidos', () => {
      const mockEquipments: EquipmentItem[] = [
        {
          id: 'eq1',
          brand: 'WEG',
          model: 'Inversor 5kW',
          category: 'inverter',
          status: 'active',
          date_added: '14 de Janeiro de 2026',
        },
      ];

      render(<ProductsIUseTab equipments={mockEquipments} />);
      expect(screen.getByText('WEG — Inversor 5kW')).toBeInTheDocument();
      expect(screen.getByText('Inversor')).toBeInTheDocument();
    });
  });
});

