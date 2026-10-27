'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { Button } from '@/components/ui/button';
import { SnapshotsHeader } from './SnapshotsHeader';
import { PipelineSizeCard } from './PipelineSizeCard';
import { WinRateCard } from './WinRateCard';
import {
  getSnapshotsReport,
  buildSnapshotsCsvUrl,
} from '@/lib/api/sales/snapshots';
import { SnapshotsReportResponse } from '@/lib/api/sales/types';

export default function SnapshotsPage() {
  const [periodDays, setPeriodDays] = useState<number>(90);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SnapshotsReportResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - periodDays);

    const toStr = toDate.toISOString().split('T')[0];
    const fromStr = fromDate.toISOString().split('T')[0];

    getSnapshotsReport(
      {
        from: fromStr,
        to: toStr,
        granularity,
      },
      controller.signal
    )
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Erro ao carregar os snapshots de vendas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [periodDays, granularity]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const handleExportCSV = () => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - periodDays);

    const url = buildSnapshotsCsvUrl({
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
      granularity,
    });

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `snapshots_${periodDays}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto w-full max-w-7xl space-y-6 font-sans">
        {/* Header com Filtros */}
        <SnapshotsHeader
          periodDays={periodDays}
          onPeriodChange={setPeriodDays}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onRefresh={fetchData}
          onExportCSV={handleExportCSV}
          loading={loading}
        />

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
              >
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-[280px] bg-slate-100 dark:bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 dark:text-red-200 text-sm">
              Não foi possível carregar os snapshots
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              className="bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Tentar novamente
            </Button>
          </div>
        )}

        {/* Main Content Cards */}
        {data && (
          <div className="space-y-6">
            {/* Card 1: Pipeline Size */}
            <PipelineSizeCard
              summary={data.pipeline.summary}
              series={data.pipeline.series}
              meta={data.meta}
            />

            {/* Card 2: Win Rate */}
            <WinRateCard
              summary={data.win_rate.summary}
              series={data.win_rate.series}
              meta={data.meta}
            />
          </div>
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
