'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeToAnalytics } from '@/lib/analytics';

interface LoggedEvent {
  id: string;
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

/**
 * AnalyticsDebugger - Overlay para visualização de eventos em tempo real.
 * Exibido apenas em desenvolvimento ou staging.
 */
export function AnalyticsDebugger() {
  const pathname = usePathname();
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isChatRoute = pathname === '/chat' || pathname?.startsWith('/chat/');

  useEffect(() => {
    // Só renderiza em desenvolvimento ou se for equipe interna
    const isDev = process.env.NODE_ENV === 'development';
    const isStaging = process.env.NEXT_PUBLIC_ENV === 'staging';
    const isInternal =
      typeof window !== 'undefined' && localStorage.getItem('is_internal_team') === 'true';

    if (isDev || isStaging || isInternal) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    return subscribeToAnalytics((name, properties) => {
      setEvents((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          name,
          properties,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9), // Mantém apenas os últimos 10
      ]);
    });
  }, [isVisible]);

  if (!isVisible || isChatRoute) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 max-h-[400px] w-[350px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800">Analytics Debugger</h3>
            <button onClick={() => setEvents([])} className="text-xs text-blue-600 hover:underline">
              Limpar
            </button>
          </div>

          <div className="space-y-3">
            {events.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400 italic">
                Nenhum evento capturado ainda.
              </p>
            )}
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded border border-gray-100 bg-gray-50 p-2 text-[10px]"
              >
                <div className="mb-1 flex justify-between font-mono">
                  <span className="font-bold text-indigo-600">{event.name}</span>
                  <span className="text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="max-h-[100px] overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-1 text-gray-300">
                  {JSON.stringify(event.properties, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors ${
          isOpen ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        title="Analytics Debugger"
      >
        <span className="text-xs font-bold">{events.length}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </button>
    </div>
  );
}
