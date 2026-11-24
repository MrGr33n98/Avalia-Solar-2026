import React, { useEffect, useMemo } from 'react';
import { GetIntegratorReputationPayloadSchema } from '../contracts/schemas';
import { useHostBridge } from '../bridge/host-adapter';
import { recordMcpUiEvent } from '../analytics/telemetry';
import { ReputationView } from './ReputationView';

export const ReputationStandaloneView: React.FC = () => {
  const { rawToolOutput, toolInput, status, errorMessage } = useHostBridge();

  const payload = useMemo(() => {
    const parsed = GetIntegratorReputationPayloadSchema.safeParse(rawToolOutput);
    return parsed.success ? parsed.data : null;
  }, [rawToolOutput]);

  useEffect(() => {
    if (payload) {
      const id = typeof toolInput.company_id === 'number' ? [toolInput.company_id] : undefined;
      recordMcpUiEvent({
        surface: 'reputation',
        action: 'widget_rendered',
        companyIds: id,
        dedupeKey: `reputation:rendered:${payload.data_as_of}`,
      });
    }
  }, [payload, toolInput.company_id]);

  return (
    <ReputationView
      payload={payload}
      loading={status === 'loading'}
      errorMessage={errorMessage}
    />
  );
};
