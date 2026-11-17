'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserTabId, UserProfileData } from './types';
import { UserProfileTrustCard } from './UserProfileTrustCard';
import { UserProfileSidebarNav } from './UserProfileSidebarNav';
import { ProfileDetailsTab } from './tabs/ProfileDetailsTab';
import { ProductsIUseTab } from './tabs/ProductsIUseTab';
import { PrivacySettingsTab } from './tabs/PrivacySettingsTab';
import { MyReviewsTab } from './tabs/MyReviewsTab';

interface UserProfileShellProps {
  initialData: UserProfileData;
  onUpdateProfile?: (data: any) => Promise<void>;
  className?: string;
}

export function UserProfileShell({
  initialData,
  onUpdateProfile,
  className = '',
}: UserProfileShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') as UserTabId | null;

  const [activeTab, setActiveTab] = useState<UserTabId>(
    rawTab && isValidTab(rawTab) ? rawTab : 'profile_details'
  );

  const [profileData, setProfileData] = useState<UserProfileData>(initialData);

  useEffect(() => {
    if (rawTab && isValidTab(rawTab) && rawTab !== activeTab) {
      setActiveTab(rawTab);
    }
  }, [rawTab, activeTab]);

  const handleSelectTab = (tab: UserTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    url.hash = 'main';
    window.history.pushState({}, '', url.toString());
  };

  const handleSaveProfile = async (updated: {
    personal: UserProfileData['personal_details'];
    professional: UserProfileData['professional_details'];
  }) => {
    const next = {
      ...profileData,
      personal_details: updated.personal,
      professional_details: updated.professional,
      trust_anchor: {
        ...profileData.trust_anchor,
        full_name: `${updated.personal.first_name} ${updated.personal.last_name}`.trim(),
        role: updated.personal.headline || profileData.trust_anchor.role,
        company: updated.professional.company_name || profileData.trust_anchor.company,
      },
    };
    setProfileData(next);
    if (onUpdateProfile) {
      await onUpdateProfile(next);
    }
  };

  const handleSavePrivacy = async (privacy: UserProfileData['privacy_settings']) => {
    const next = {
      ...profileData,
      privacy_settings: privacy,
    };
    setProfileData(next);
    if (onUpdateProfile) {
      await onUpdateProfile(next);
    }
  };

  const handleRemoveEquipment = (id: string) => {
    setProfileData({
      ...profileData,
      equipments: profileData.equipments.filter((eq) => eq.id !== id),
      stats: {
        ...profileData.stats,
        equipments_count: Math.max(0, profileData.stats.equipments_count - 1),
      },
    });
  };

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Coluna Esquerda: Trust Anchor & Navegação */}
          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-8">
            <UserProfileTrustCard
              trustAnchor={profileData.trust_anchor}
              onEditAvatar={() => alert('Modal de upload de foto em desenvolvimento')}
              onVerifyLinkedIn={() => alert('Handshake OAuth LinkedIn em desenvolvimento')}
            />

            <UserProfileSidebarNav
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              stats={profileData.stats}
            />
          </aside>

          {/* Coluna Direita: Canvas de Conteúdo da Aba Ativa */}
          <main
            id="main"
            className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
          >
            {activeTab === 'profile_details' && (
              <ProfileDetailsTab
                initialPersonal={profileData.personal_details}
                initialProfessional={profileData.professional_details}
                onSave={handleSaveProfile}
              />
            )}

            {activeTab === 'products_used' && (
              <ProductsIUseTab
                equipments={profileData.equipments}
                onAddEquipment={() => alert('Modal de adição de inversores/módulos homologados')}
                onRemoveEquipment={handleRemoveEquipment}
                onLeaveReview={() => router.push('/reviews/new')}
              />
            )}

            {activeTab === 'my_reviews' && (
              <MyReviewsTab
                stats={profileData.stats}
                onWriteReview={() => router.push('/reviews/new')}
              />
            )}

            {activeTab === 'privacy_settings' && (
              <PrivacySettingsTab
                initialSettings={profileData.privacy_settings}
                userFullName={profileData.trust_anchor.full_name}
                onSave={handleSavePrivacy}
              />
            )}

            {/* Fallback amigável para abas adicionais */}
            {['activity_center', 'my_rewards', 'my_lists', 'community_qa', 'achievements', 'notifications'].includes(
              activeTab
            ) && (
              <div className="text-center py-16">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Seção em Expansão
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  A seção selecionada está sendo integrada ao novo ecossistema de reputação do Avalia Solar 2026.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function isValidTab(tab: string): tab is UserTabId {
  return [
    'activity_center',
    'my_reviews',
    'products_used',
    'my_rewards',
    'my_lists',
    'community_qa',
    'achievements',
    'notifications',
    'profile_details',
    'privacy_settings',
  ].includes(tab);
}

