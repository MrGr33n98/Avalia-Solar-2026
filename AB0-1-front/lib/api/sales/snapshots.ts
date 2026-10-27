import {
  SnapshotsReportParams,
  SnapshotsReportResponse,
} from './types';
import { SalesApiError } from './client';

export async function getSnapshotsReport(
  params: SnapshotsReportParams = {},
  signal?: AbortSignal
): Promise<SnapshotsReportResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.granularity) searchParams.set('granularity', params.granularity);
  if (params.pipeline_id) searchParams.set('pipeline_id', String(params.pipeline_id));
  if (params.owner_ids && params.owner_ids.length > 0) {
    params.owner_ids.forEach((id) => searchParams.append('owner_ids[]', String(id)));
  }

  const res = await fetch(`/api/v1/sales/reports/snapshots?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
    signal,
  });

  if (!res.ok) {
    let errJson: {
      error?: {
        message?: string;
        code?: string;
        fields?: Record<string, string[]>;
        request_id?: string;
      } | string;
    } | null = null;
    try {
      errJson = await res.json();
    } catch {
      /* ignore */
    }

    const errObj = typeof errJson?.error === 'object' ? errJson.error : null;
    const errMsg =
      errObj?.message ||
      (typeof errJson?.error === 'string' ? errJson.error : null) ||
      'Erro ao carregar dados de snapshots de pipeline.';

    throw new SalesApiError(
      res.status,
      errMsg,
      errObj?.code || 'SNAPSHOTS_ERROR',
      errObj?.fields,
      errObj?.request_id
    );
  }

  return res.json();
}

export function buildSnapshotsCsvUrl(params: SnapshotsReportParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.granularity) searchParams.set('granularity', params.granularity);
  if (params.pipeline_id) searchParams.set('pipeline_id', String(params.pipeline_id));
  if (params.owner_ids && params.owner_ids.length > 0) {
    params.owner_ids.forEach((id) => searchParams.append('owner_ids[]', String(id)));
  }
  searchParams.set('format', 'csv');

  return `/api/v1/sales/reports/snapshots?${searchParams.toString()}`;
}
