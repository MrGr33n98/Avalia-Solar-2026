import React, { useEffect, useMemo, useState } from 'react';
import {
  GetIntegratorReputationPayloadSchema,
  ShowIntegratorProfilePayloadSchema,
  type GetIntegratorReputationPayload,
} from '../contracts/schemas';
import { useHostBridge } from '../bridge/host-adapter';
import { recordMcpUiEvent } from '../analytics/telemetry';
import { ProfileView } from './ProfileView';
import { BrandHero } from './BrandHero';
import { ProjectPortfolioPreview, readPortfolioPreview } from './ProjectPortfolioPreview';
import { PublicMediaGallery, readGalleryPreview } from './PublicMediaGallery';
import { CatalogPreview, readCatalogPreview } from './CatalogPreview';
import { BrandSections } from './BrandSections';
import { TrustPreview, readTrustPreview } from './TrustPreview';
import { ReputationView } from './ReputationView';

export const ProfileStandaloneView: React.FC = () => {
  const { rawToolOutput, status, errorMessage, callTool } = useHostBridge();
  const [repSubView, setRepSubView] = useState<{
    name: string;
    verificationState: 'platform_verified' | 'unverified';
    payload: GetIntegratorReputationPayload;
  } | null>(null);

  const payload = useMemo(() => {
    const parsed = ShowIntegratorProfilePayloadSchema.safeParse(rawToolOutput);
    return parsed.success ? parsed.data : null;
  }, [rawToolOutput]);

  const portfolio = useMemo(() => readPortfolioPreview(rawToolOutput), [rawToolOutput]);
  const gallery = useMemo(() => readGalleryPreview(rawToolOutput), [rawToolOutput]);
  const catalog = useMemo(() => readCatalogPreview(rawToolOutput), [rawToolOutput]);
  const trust = useMemo(() => readTrustPreview(rawToolOutput), [rawToolOutput]);

  useEffect(() => {
    if (payload) {
      recordMcpUiEvent({
        surface: 'profile',
        action: 'widget_rendered',
        companyIds: [payload.data.integrator.id],
        dedupeKey: `profile:rendered:${payload.data.integrator.id}:${payload.data_as_of}`,
      });
    }
  }, [payload]);

  if (repSubView) {
    return (
      <ReputationView
        companyName={repSubView.name}
        verificationState={repSubView.verificationState}
        payload={repSubView.payload}
        onBack={() => setRepSubView(null)}
      />
    );
  }

  return (
    <ProfileView
      payload={payload}
      hero={payload?.data.integrator.hero_carousel ? (
        <BrandHero key={payload.data.integrator.id} carousel={payload.data.integrator.hero_carousel} />
      ) : undefined}
      portfolio={<BrandSections key={payload?.data.integrator.id} sections={[
        { id: 'projects', label: 'Projetos', content: portfolio && portfolio.state !== 'unavailable' ? <ProjectPortfolioPreview portfolio={portfolio} /> : null },
        { id: 'products', label: 'Produtos', content: catalog && catalog.products.length ? <CatalogPreview catalog={{ ...catalog, services: [] }} /> : null },
        { id: 'services', label: 'Serviços', content: catalog && catalog.services.length ? <CatalogPreview catalog={{ ...catalog, products: [] }} /> : null },
        { id: 'catalog-error', label: 'Catálogo', content: catalog?.state === 'error' ? <CatalogPreview catalog={catalog} /> : null },
        { id: 'gallery', label: 'Galeria', content: gallery && (gallery.state === 'error' || gallery.images.length || gallery.videos.length) ? <PublicMediaGallery gallery={gallery} /> : null },
        { id: 'trust', label: 'Selos e FAQ', content: trust && (trust.state === 'error' || trust.badges.length || trust.faqs.length) ? <TrustPreview trust={trust} /> : null },
      ]} />}
      loading={status === 'loading'}
      errorMessage={errorMessage}
      onOpenReputation={async (companyId, name, state) => {
        const res = await callTool(
          'get_integrator_reputation',
          { company_id: companyId },
          GetIntegratorReputationPayloadSchema
        );
        if (res) {
          setRepSubView({ name, verificationState: state, payload: res });
          recordMcpUiEvent({
            surface: 'profile',
            action: 'reputation_opened',
            companyIds: [companyId],
          });
        }
      }}
      onOpenExternal={(_, companyId) => {
        recordMcpUiEvent({
          surface: 'profile',
          action: 'external_profile_clicked',
          companyIds: [companyId],
        });
      }}
    />
  );
};
