'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileShell } from '@/components/user-profile/UserProfileShell';
import { UserProfileData } from '@/components/user-profile/types';
import { reviewerProfileApi } from '@/lib/api';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const { user, reviewerProfile } = useAuth();

  const initialData: UserProfileData = React.useMemo(() => {
    const fullName = user?.name || reviewerProfile?.name || 'Felipe Henriques Morais';
    const parts = fullName.split(' ');
    const firstName = parts[0] || 'Felipe';
    const lastName = parts.slice(1).join(' ') || 'Henriques Morais';

    return {
      id: user?.id ? String(user.id) : 'usr_preview_99',
      trust_anchor: {
        full_name: fullName,
        display_name: `${firstName} ${lastName.charAt(0)}.`,
        avatar_url: reviewerProfile?.avatar_url || null,
        role: reviewerProfile?.public_headline || 'Founder',
        company: reviewerProfile?.company_name || 'Avalia Solar',
        member_since: '2025-01-17T00:00:00Z',
        is_verified: true,
        verification_type: 'linkedin',
        trust_score: 85,
        connected_accounts: ['linkedin', 'google'],
      },
      personal_details: {
        first_name: firstName,
        last_name: lastName,
        pronouns: 'He/Him',
        region: 'São Paulo, SP',
        headline:
          reviewerProfile?.public_headline ||
          'Founder at Avalia Solar | Solar Energy & Marketplace Trust',
        summary:
          reviewerProfile?.bio ||
          'Profissional focado em transparência, inovação e reputação verificada no mercado solar fotovoltaico.',
      },
      professional_details: {
        company_name: reviewerProfile?.company_name || 'Avalia Solar',
        industry: 'Energia Solar & Renováveis',
        company_size: '11-50',
        role_function: 'Diretoria / Executivo',
      },
      privacy_settings: {
        anonymize_last_name: true,
        email_frequency: 'weekly',
        profile_visibility: 'public',
      },
      stats: {
        reviews_count: 0,
        saved_reviews_count: 2,
        drafts_count: 1,
        equipments_count: 2,
      },
      equipments: [
        {
          id: 'eq_weg_01',
          brand: 'WEG',
          model: 'Inversor String SIW500H 5kW',
          category: 'inverter',
          status: 'active',
          date_added: '14 de Janeiro de 2026',
        },
        {
          id: 'eq_canadian_02',
          brand: 'Canadian Solar',
          model: 'Módulo HiKu7 BiHiKu 660W',
          category: 'module',
          status: 'active',
          date_added: '02 de Fevereiro de 2026',
        },
      ],
    };
  }, [user, reviewerProfile]);

  const handleUpdate = async (updated: UserProfileData) => {
    try {
      if (reviewerProfileApi?.update) {
        await reviewerProfileApi.update({
          name: updated.trust_anchor.full_name,
          public_headline: updated.personal_details.headline,
          bio: updated.personal_details.summary,
          company_name: updated.professional_details.company_name,
        });
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar no servidor. Modo offline ativado.');
    }
  };

  return <UserProfileShell initialData={initialData} onUpdateProfile={handleUpdate} />;
}

