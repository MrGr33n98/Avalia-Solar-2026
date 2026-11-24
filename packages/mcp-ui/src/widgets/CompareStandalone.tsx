import React, { useEffect, useMemo } from 'react';
import { CompareIntegratorsPayloadSchema } from '../contracts/schemas';
import { useHostBridge } from '../bridge/host-adapter';
import { recordMcpUiEvent } from '../analytics/telemetry';
import { CompareView } from './CompareView';

export const CompareStandaloneView: React.FC = () => {
  const { rawToolOutput, status, errorMessage, displayMode, capabilities, requestDisplayMode } =
    useHostBridge();

  const payload = useMemo(() => {
    const parsed = CompareIntegratorsPayloadSchema.safeParse(rawToolOutput);
    return parsed.success ? parsed.data : null;
  }, [rawToolOutput]);

  useEffect(() => {
    if (payload) {
      recordMcpUiEvent({
        surface: 'compare',
        action: 'widget_rendered',
        companyIds: payload.data.companies.map((c) => c.id),
        dedupeKey: `compare:rendered:${payload.data_as_of}`,
      });
    }
  }, [payload]);

  return (
    <CompareView
      payload={payload}
      loading={status === 'loading'}
      errorMessage={errorMessage}
      displayMode={displayMode}
      canExpand={capabilities.canRequestDisplayMode}
      onRequestExpand={() => {
        void requestDisplayMode('fullscreen');
        recordMcpUiEvent({ surface: 'compare', action: 'display_mode_changed' });
      }}
    />
  );
};
