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
