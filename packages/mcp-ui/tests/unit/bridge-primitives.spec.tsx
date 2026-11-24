import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeExternalHttpsUrl } from '../../src/bridge/capabilities';
import { HostProvider, useHostBridge } from '../../src/bridge/host-adapter';
import { RatingInline, LogoAvatar, SourceNote, VerificationBadge } from '../../src/design/primitives';
import { recordMcpUiEvent, resetTelemetryDedupeForTests } from '../../src/analytics/telemetry';
import { ListIntegratorsPayloadSchema } from '../../src/contracts/schemas';
import { FIXTURE_INTEGRATORS } from '../../src/fixtures/staging-fixtures';

describe('MCP Bridge & Design Primitives', () => {
  beforeEach(() => {
    delete window.__AVALIA_MCP_HARNESS__;
    resetTelemetryDedupeForTests();
  });

  it('sanitizes URLs to allow https only and rejects javascript/http schemes', () => {
    expect(sanitizeExternalHttpsUrl('https://www.avaliasolar.com.br/companies/alfa')).toBe(
      'https://www.avaliasolar.com.br/companies/alfa'
    );
    expect(sanitizeExternalHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalHttpsUrl('http://insecure.example')).toBeNull();
  });

  it('never renders 0.0 rating when sample size is zero', () => {
    render(<RatingInline average={null} count={0} />);
    expect(screen.getByText(/Sem avaliações/i)).toBeInTheDocument();
  });

  it('renders initials fallback when logo_url is absent', () => {
    render(<LogoAvatar name="Solar Staging Alfa" logoUrl={null} />);
    expect(screen.getByText('SS')).toBeInTheDocument();
  });

  it('renders verification badge and source note provenance', () => {
    render(
      <>
        <VerificationBadge state="platform_verified" showExplanation />
        <SourceNote
          sourceType="company_declared"
          dataAsOf="2026-11-24T03:59:12Z"
          limitations={['Cidade da sede não comprova cobertura.']}
        />
      </>
    );
    expect(screen.getByText(/Verificada na plataforma/i)).toBeInTheDocument();
    expect(screen.getByText(/Cidade da sede não comprova cobertura/i)).toBeInTheDocument();
  });

  it('prevents duplicate telemetry and forbids PII keys', () => {
    const sink = vi.fn();
    const first = recordMcpUiEvent({
      surface: 'search',
      action: 'widget_rendered',
      companyIds: [3, 4],
      dedupeKey: 'search:init',
      sink,
    });
    const dup = recordMcpUiEvent({
      surface: 'search',
      action: 'widget_rendered',
      companyIds: [3, 4],
      dedupeKey: 'search:init',
      sink,
    });

    expect(first).not.toBeNull();
    expect(dup).toBeNull();
    expect(sink).toHaveBeenCalledTimes(1);
    expect(Object.keys(first!)).not.toContain('email');
    expect(Object.keys(first!)).not.toContain('phone');
  });

  it('discards stale out-of-order callTool responses cleanly', async () => {
    let resolveFirst!: (val: unknown) => void;
    let resolveSecond!: (val: unknown) => void;

    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_INTEGRATORS,
      callTool: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve;
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveSecond = resolve;
            })
        ),
    };

    const results: unknown[] = [];

    const Probe: React.FC = () => {
      const { callTool } = useHostBridge();
      return (
        <button
          onClick={() => {
            void callTool('list_integrators', { query: 'first' }, ListIntegratorsPayloadSchema).then(
              (r) => results.push(['first', r])
            );
            void callTool('list_integrators', { query: 'second' }, ListIntegratorsPayloadSchema).then(
              (r) => results.push(['second', r])
            );
          }}
        >
          Trigger
        </button>
      );
    };

    render(
      <HostProvider appName="probe" fallbackOutput={FIXTURE_INTEGRATORS}>
        <Probe />
      </HostProvider>
    );

    screen.getByText('Trigger').click();
    resolveSecond({ structuredContent: FIXTURE_INTEGRATORS });
    resolveFirst({ structuredContent: FIXTURE_INTEGRATORS });

    await vi.waitFor(() => expect(results).toHaveLength(2));
    expect(results).toContainEqual(['second', FIXTURE_INTEGRATORS]);
    expect(results).toContainEqual(['first', null]);
  });
});

