import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileTrustCard, validateAvatarFile } from '../UserProfileTrustCard';
import { LinkedInVerifyButton } from '../LinkedInVerifyButton';
import { UserProfileSidebarNav } from '../UserProfileSidebarNav';
import { PrivacySettingsTab } from '../tabs/PrivacySettingsTab';
import { ProductsIUseTab } from '../tabs/ProductsIUseTab';
import { ProfileDetailsTab, validateProfileDetails } from '../tabs/ProfileDetailsTab';
import { MyReviewsTab } from '../tabs/MyReviewsTab';
import { UserProfileContent } from '../UserProfilePageContent';
import { useAuth } from '@/contexts/AuthContext';
import {
  reviewerProfileApi,
  reviewerSolutionsApi,
  reviewDashboardApi,
  usersApi,
} from '@/lib/api';
import {
  buildUserProfileData,
  normalizeSolutions,
  splitFullName,
  joinFullName,
  formatRegion,
} from '../mappers';
import { TrustAnchor, PrivacySettings, EquipmentItem, UserProfileStats } from '../types';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams('tab=profile_details'),
}));

jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/api', () => ({
  reviewerProfileApi: {
    get: jest.fn(),
    update: jest.fn(),
    uploadAvatar: jest.fn(),
  },
  reviewerSolutionsApi: {
    list: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
  reviewDashboardApi: {
    getSummary: jest.fn(),
  },
  usersApi: {
    update: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

beforeAll(() => {
  window.confirm = jest.fn(() => true);
});

describe('UserProfile Components (Production Hardened — Real Data Only)', () => {
  describe('mappers', () => {
    it('divide e junta nomes corretamente', () => {
      expect(splitFullName('Maria Silva')).toEqual({ first: 'Maria', last: 'Silva' });
      expect(splitFullName('Maria de Souza Silva')).toEqual({ first: 'Maria', last: 'de Souza Silva' });
      expect(splitFullName('Carlos')).toEqual({ first: 'Carlos', last: '' });
      expect(splitFullName('   ')).toEqual({ first: '', last: '' });

      expect(joinFullName('Maria', 'Silva')).toBe('Maria Silva');
      expect(joinFullName('Carlos', '')).toBe('Carlos');
      expect(joinFullName('', '')).toBe('');
    });

    it('formata região sem inventar localização', () => {
      expect(formatRegion('Campinas', 'SP')).toBe('Campinas, SP');
      expect(formatRegion(null, 'SP')).toBe('SP');
      expect(formatRegion('Florianópolis', null)).toBe('Florianópolis');
      expect(formatRegion(null, null)).toBe('');
    });

    it('buildUserProfileData nunca injeta dados fictícios, scores arbitrários ou verificação falsa', () => {
      const data = buildUserProfileData({
        authUser: { id: 42, name: 'João Santos', created_at: '2026-03-10T10:00:00Z' },
        profilePayload: {
          user: { id: 42, name: 'João Santos', city: 'Curitiba', state: 'PR', avatar_url: 'https://ex.com/a.png' },
          profile: { profession: 'Engenheiro Solar', company_name: 'Sol Forte', bio: 'Atuando há 5 anos' },
        },
        solutions: [
          { id: '1', name: 'Inversor Solar A', type: 'product', category: 'Inversor', verified: false, status: 'active' },
        ],
        summary: { kpis: { reviews_published: 3 } },
      });

      expect(data.trust_anchor.full_name).toBe('João Santos');
      expect(data.trust_anchor.role).toBe('Engenheiro Solar');
      expect(data.trust_anchor.company).toBe('Sol Forte');
      expect(data.trust_anchor.avatar_url).toBe('https://ex.com/a.png');
      expect(data.trust_anchor.member_since).toBe('2026-03-10T10:00:00Z');
      expect(data.trust_anchor.is_verified).toBe(false);
      expect(data.trust_anchor.trust_score).toBeNull();
      expect(data.personal_details.region).toBe('Curitiba, PR');
      expect(data.stats.reviews_count).toBe(3);
      expect(data.stats.equipments_count).toBe(1);
      expect(data.equipments).toHaveLength(1);
    });

    it('buildUserProfileData com usuário sem perfil preenchido exibe strings vazias em vez de mocks', () => {
      const data = buildUserProfileData({
        authUser: { id: 99, name: null, created_at: null },
        profilePayload: {},
        solutions: [],
        summary: null,
      });

      expect(data.trust_anchor.full_name).toBe('');
      expect(data.trust_anchor.role).toBe('');
      expect(data.trust_anchor.company).toBe('');
      expect(data.trust_anchor.member_since).toBeNull();
      expect(data.trust_anchor.is_verified).toBe(false);
      expect(data.trust_anchor.trust_score).toBeNull();
      expect(data.personal_details.region).toBe('');
      expect(data.personal_details.headline).toBe('');
      expect(data.personal_details.summary).toBe('');
      expect(data.professional_details.company_name).toBe('');
      expect(data.stats.reviews_count).toBeNull();
      expect(data.stats.equipments_count).toBe(0);
      expect(data.equipments).toEqual([]);
    });

    it('normalizeSolutions filtra soluções desabilitadas e inválidas', () => {
      const raw = [
        { id: 10, name: 'Inversor X', type: 'product', category: 'Inversor', status: 'active', verified: true },
        { id: 11, name: 'Módulo Y', type: 'product', category: 'Módulo', status: 'disabled', verified: false },
        { id: null, name: '' },
      ];
      const normalized = normalizeSolutions(raw);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('Inversor X');
      expect(normalized[0].verified).toBe(true);
      expect(normalized[0].status).toBe('active');
    });
  });

  describe('UserProfileTrustCard', () => {
    it('renderiza dados reais do perfil', () => {
      const trustAnchor: TrustAnchor = {
        full_name: 'Ana Ribeiro',
        avatar_url: null,
        role: 'Projetista Solar',
        company: 'Eco Energia',
        member_since: '2025-05-15T00:00:00Z',
        is_verified: false,
        trust_score: null,
      };

      render(<UserProfileTrustCard trustAnchor={trustAnchor} />);

      expect(screen.getByText('Ana Ribeiro')).toBeInTheDocument();
      expect(screen.getByText('Projetista Solar')).toBeInTheDocument();
      expect(screen.getByText('Eco Energia')).toBeInTheDocument();
      expect(screen.getByText(/Membro desde/i)).toBeInTheDocument();
      // Não exibe trust score arbitrário
      expect(screen.queryByTestId('trust-score')).not.toBeInTheDocument();
    });

    it('exibe fallbacks neutros e nenhum trust score quando campos estão vazios', () => {
      const emptyAnchor: TrustAnchor = {
        full_name: '',
        avatar_url: null,
        role: '',
        company: '',
        member_since: null,
        is_verified: false,
        trust_score: null,
      };

      render(<UserProfileTrustCard trustAnchor={emptyAnchor} />);

      expect(screen.getByText('Nome não informado')).toBeInTheDocument();
      expect(screen.getByText('Cargo não informado')).toBeInTheDocument();
      expect(screen.getByText('Empresa não informada')).toBeInTheDocument();
      expect(screen.queryByText(/Membro desde/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('trust-score')).not.toBeInTheDocument();
    });

    it('valida formato e tamanho de foto de perfil', () => {
      const invalidTypeFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      expect(validateAvatarFile(invalidTypeFile)).toContain('Formato inválido');

      const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      expect(validateAvatarFile(oversizedFile)).toContain('5 MB');

      const validFile = new File([new Uint8Array(1024)], 'avatar.png', { type: 'image/png' });
      expect(validateAvatarFile(validFile)).toBeNull();
    });
  });

  describe('LinkedInVerifyButton', () => {
    it('exibe Não verificado quando o usuário não é verificado e recurso não está disponível', () => {
      render(<LinkedInVerifyButton isVerified={false} available={false} />);
      const btn = screen.getByTestId('linkedin-verify-unavailable');
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
      expect(screen.getByText('Não verificado')).toBeInTheDocument();
    });

    it('exibe badge de verificado somente quando isVerified=true', () => {
      render(<LinkedInVerifyButton isVerified={true} />);
      expect(screen.getByTestId('linkedin-verified-badge')).toBeInTheDocument();
      expect(screen.getByText('Profissional Verificado')).toBeInTheDocument();
    });
  });

  describe('UserProfileSidebarNav', () => {
    it('renderiza abas e responde a cliques', () => {
      const onSelect = jest.fn();
      render(
        <UserProfileSidebarNav
          activeTab="profile_details"
          onSelectTab={onSelect}
          stats={{ reviews_count: 3, saved_reviews_count: null, drafts_count: null, equipments_count: 2 }}
        />
      );

      const navReviews = screen.getByTestId('user-nav-my_reviews');
      expect(navReviews).toBeInTheDocument();
      fireEvent.click(navReviews);
      expect(onSelect).toHaveBeenCalledWith('my_reviews');
    });
  });

  describe('ProfileDetailsTab', () => {
    it('valida campos obrigatórios e limites de caracteres', () => {
      expect(
        validateProfileDetails({
          personal: { first_name: '', last_name: 'Santos', region: '', headline: '', summary: '' },
          professional: { company_name: '' },
        })
      ).toBe('Informe seu nome.');

      expect(
        validateProfileDetails({
          personal: { first_name: 'A'.repeat(70), last_name: 'B'.repeat(70), region: '', headline: '', summary: '' },
          professional: { company_name: '' },
        })
      ).toContain('até 120 caracteres');

      expect(
        validateProfileDetails({
          personal: { first_name: 'Carlos', last_name: 'Silva', region: '', headline: 'Eng', summary: 'Bio' },
          professional: { company_name: 'Empresa' },
        })
      ).toBeNull();
    });

    it('chama onSave com os campos persistidos e exibe mensagem de sucesso', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(
        <ProfileDetailsTab
          initialPersonal={{ first_name: 'Lucas', last_name: 'Lima', region: 'SP', headline: 'Técnico', summary: 'Bio' }}
          initialProfessional={{ company_name: 'Solar Tech' }}
          onSave={onSave}
        />
      );

      const saveBtn = screen.getByTestId('save-profile-button');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          personal: { first_name: 'Lucas', last_name: 'Lima', region: 'SP', headline: 'Técnico', summary: 'Bio' },
          professional: { company_name: 'Solar Tech' },
        });
      });
      expect(await screen.findByText('Alterações salvas com sucesso!')).toBeInTheDocument();
    });
  });

  describe('PrivacySettingsTab', () => {
    it('informa com clareza que as preferências são somente leitura baseadas no cadastro', () => {
      const settings: PrivacySettings = {
        anonymize_last_name: null,
        email_frequency: null,
        profile_visibility: null,
      };

      render(<PrivacySettingsTab settings={settings} />);

      expect(screen.getByTestId('privacy-unavailable-notice')).toBeInTheDocument();
      expect(screen.getByTestId('save-privacy-button')).toBeDisabled();
      const toggle = screen.getByTestId('anonymize-toggle');
      expect(toggle).toHaveAttribute('readonly');
    });
  });

  describe('ProductsIUseTab', () => {
    it('exibe empty state ilustrado quando a lista de equipamentos for vazia', () => {
      render(<ProductsIUseTab equipments={[]} />);
      expect(screen.getByTestId('products-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Você ainda não adicionou nenhum equipamento/i)).toBeInTheDocument();
    });

    it('exibe estado de erro de carregamento quando equipments=null', () => {
      render(<ProductsIUseTab equipments={null} />);
      expect(screen.getByTestId('products-load-error')).toBeInTheDocument();
      expect(screen.getByText(/Não foi possível carregar seus equipamentos/i)).toBeInTheDocument();
    });

    it('lista equipamentos reais com status e categoria', () => {
      const mockEquipments: EquipmentItem[] = [
        {
          id: '1',
          name: 'Inversor String 5kW',
          type: 'product',
          category: 'Inversor',
          verified: true,
          status: 'active',
          created_at: '2026-02-01T12:00:00Z',
        },
      ];

      render(<ProductsIUseTab equipments={mockEquipments} />);
      expect(screen.getByText('Inversor String 5kW')).toBeInTheDocument();
      expect(screen.getByText('Verificado')).toBeInTheDocument();
      expect(screen.getByText('Inversor')).toBeInTheDocument();
    });
  });

  describe('MyReviewsTab', () => {
    it('exibe contagem real de avaliações publicadas quando reviews_count > 0', () => {
      const stats: UserProfileStats = {
        reviews_count: 4,
        saved_reviews_count: null,
        drafts_count: null,
        equipments_count: null,
      };
      render(<MyReviewsTab stats={stats} />);

      const summary = screen.getByTestId('reviews-published-summary');
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveTextContent('Você possui 4 avaliações publicadas.');
      expect(screen.getByRole('tab', { name: /Publicadas \(4\)/i })).toBeInTheDocument();
    });

    it('exibe empty state quando reviews_count = 0', () => {
      const stats: UserProfileStats = {
        reviews_count: 0,
        saved_reviews_count: null,
        drafts_count: null,
        equipments_count: null,
      };
      render(<MyReviewsTab stats={stats} />);

      expect(screen.getByTestId('reviews-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Parece que você ainda não publicou nenhuma avaliação/i)).toBeInTheDocument();
    });

    it('exibe aviso de indisponibilidade para salvas e rascunhos', () => {
      const stats: UserProfileStats = {
        reviews_count: 0,
        saved_reviews_count: null,
        drafts_count: null,
        equipments_count: null,
      };
      render(<MyReviewsTab stats={stats} />);

      const savedTab = screen.getByRole('tab', { name: /Salvas/i });
      fireEvent.click(savedTab);
      expect(screen.getByTestId('saved-reviews-unavailable')).toBeInTheDocument();

      const draftsTab = screen.getByRole('tab', { name: /Rascunhos/i });
      fireEvent.click(draftsTab);
      expect(screen.getByTestId('draft-reviews-unavailable')).toBeInTheDocument();
    });
  });

  describe('UserProfileContent Integration', () => {
    const mockCheckAuth = jest.fn().mockResolvedValue(null);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('redireciona para o login quando o usuário não estiver autenticado', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false,
        checkAuth: mockCheckAuth,
      });

      render(<UserProfileContent />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          '/login?redirect=%2Fuser%2Fprofile'
        );
      });
    });

    it('exibe painel de acesso negado quando a role não for de avaliador/admin', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 10, name: 'Empresa Solar', role: 'company' },
        loading: false,
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
      });

      render(<UserProfileContent />);

      expect(await screen.findByTestId('user-profile-forbidden')).toBeInTheDocument();
      expect(
        screen.getByText(/Central disponível para contas de avaliador/i)
      ).toBeInTheDocument();
    });

    it('exibe painel de erro quando a API de perfil falhar', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 10, name: 'João Solar', role: 'review' },
        loading: false,
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
      });

      (reviewerProfileApi.get as jest.Mock).mockRejectedValue(new Error('500 Internal'));
      (reviewerSolutionsApi.list as jest.Mock).mockResolvedValue([]);
      (reviewDashboardApi.getSummary as jest.Mock).mockResolvedValue(null);

      render(<UserProfileContent />);

      expect(await screen.findByTestId('user-profile-error')).toBeInTheDocument();
      expect(
        screen.getByText(/Não foi possível carregar seu perfil/i)
      ).toBeInTheDocument();
    });

    it('carrega dados reais da API e permite salvar alterações de nome e headline', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 10, name: 'Beatriz Costa', role: 'review', created_at: '2025-01-15T00:00:00Z' },
        loading: false,
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
      });

      (reviewerProfileApi.get as jest.Mock).mockResolvedValue({
        user: { id: 10, name: 'Beatriz Costa', city: 'Campinas', state: 'SP', avatar_url: null },
        profile: {
          profession: 'Engenheira de Energia',
          company_name: 'Sol Nascente',
          bio: 'Especialista em telhados industriais',
        },
      });
      (reviewerSolutionsApi.list as jest.Mock).mockResolvedValue([]);
      (reviewDashboardApi.getSummary as jest.Mock).mockResolvedValue({
        kpis: { reviews_published: 2 },
      });
      (usersApi.update as jest.Mock).mockResolvedValue({ id: 10, name: 'Beatriz Costa Lima' });
      (reviewerProfileApi.update as jest.Mock).mockResolvedValue({
        profile: {
          profession: 'Diretora Técnica',
          company_name: 'Sol Nascente',
          bio: 'Especialista em telhados industriais',
        },
      });

      render(<UserProfileContent />);

      // Verifica que carregou dados reais
      expect(await screen.findByText('Beatriz Costa')).toBeInTheDocument();
      expect(screen.getByText('Engenheira de Energia')).toBeInTheDocument();
      expect(screen.getByText('Sol Nascente')).toBeInTheDocument();

      // Edita o nome e headline
      const lastNameInput = screen.getByLabelText(/Sobrenome/i);
      fireEvent.change(lastNameInput, { target: { value: 'Costa Lima' } });

      const headlineInput = screen.getByLabelText(/Título Profissional/i);
      fireEvent.change(headlineInput, { target: { value: 'Diretora Técnica' } });

      // Clica em salvar
      const saveButton = screen.getByTestId('save-profile-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // 1) Deve ter atualizado usersApi.update com o nome completo
        expect(usersApi.update).toHaveBeenCalledWith(10, { name: 'Beatriz Costa Lima' });
        // 2) Deve ter atualizado reviewerProfileApi.update com os campos permitidos
        expect(reviewerProfileApi.update).toHaveBeenCalledWith({
          profession: 'Diretora Técnica',
          bio: 'Especialista em telhados industriais',
          company_name: 'Sol Nascente',
        });
      });
    });
  });
});
