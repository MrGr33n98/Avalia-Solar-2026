import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyDocumentTheme,
  type App,
  type McpUiHostContext,
} from '@modelcontextprotocol/ext-apps';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import type { z } from 'zod';
import {
  detectHostCapabilities,
  isEmbeddedIframe,
  resolveSafeArea,
  resolveTheme,
  sanitizeExternalHttpsUrl,
} from './capabilities';
import { BridgeValidationError, toUserReadableError } from './errors';
import type { DisplayMode, HostCapabilities, SafeAreaInsets, ThemeMode } from './types';

interface HostContextValue {
  app: App | null;
  theme: ThemeMode;
  displayMode: DisplayMode;
  safeArea: SafeAreaInsets;
  capabilities: HostCapabilities;
  toolInput: Record<string, unknown>;
  rawToolOutput: unknown;
  status: 'loading' | 'ready' | 'refreshing' | 'error' | 'offline';
  errorMessage: string | null;
  callTool: <T>(
    name: string,
    args: Record<string, unknown>,
    schema?: z.ZodType<T>
  ) => Promise<T | null>;
  openExternalUrl: (rawUrl: string) => Promise<void>;
  requestDisplayMode: (mode: DisplayMode) => Promise<void>;
  sendFollowUpMessage: (text: string) => Promise<void>;
}

const HostContext = createContext<HostContextValue | null>(null);

function extractStructuredPayload(result: unknown): unknown {
  if (!result || typeof result !== 'object') return null;
  const record = result as Record<string, unknown>;
  if ('structuredContent' in record && record.structuredContent) {
    return record.structuredContent;
  }
  if (Array.isArray(record.content)) {
    const textPart = record.content.find(
      (item): item is { type: string; text: string } =>
        Boolean(item && typeof item === 'object' && (item as { type?: string }).type === 'text')
    );
    if (textPart?.text) {
      try {
        return JSON.parse(textPart.text);
      } catch {
        return null;
      }
    }
  }
  if ('schema_version' in record && 'data' in record) {
    return record;
  }
  return null;
}

export interface HostProviderProps {
  appName: string;
  children: React.ReactNode;
  fallbackOutput?: unknown;
}

export const HostProvider: React.FC<HostProviderProps> = ({
  appName,
  children,
  fallbackOutput,
}) => {
  const harness = typeof window !== 'undefined' ? window.__AVALIA_MCP_HARNESS__ : undefined;
  const oa = typeof window !== 'undefined' ? window.openai : undefined;
  const embedded = isEmbeddedIframe();

  const [hostContext, setHostContext] = useState<McpUiHostContext | null>(null);
  const [toolInput, setToolInput] = useState<Record<string, unknown>>(
    () => harness?.toolInput ?? oa?.toolInput ?? {}
  );
  const [rawToolOutput, setRawToolOutput] = useState<unknown>(
    () => harness?.toolOutput ?? oa?.toolOutput ?? (!embedded ? fallbackOutput ?? null : null)
  );
  const [status, setStatus] = useState<HostContextValue['status']>(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    return harness?.toolOutput || oa?.toolOutput || (!embedded && fallbackOutput) ? 'ready' : 'loading';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    () => harness?.displayMode ?? oa?.displayMode ?? 'inline'
  );

  const latestRequestIdRef = useRef(0);

  const { app, isConnected, error } = useApp({
    appInfo: { name: appName, version: '1.0.0' },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolinput = (params) => {
        if (params.arguments) {
          setToolInput(params.arguments);
        }
      };

      createdApp.ontoolresult = (result) => {
        if (result.isError) {
          setStatus('error');
          setErrorMessage('A ferramenta retornou um erro ao carregar os dados.');
          return;
        }
        const extracted = extractStructuredPayload(result);
        if (extracted) {
          setRawToolOutput(extracted);
          setStatus('ready');
          setErrorMessage(null);
        }
      };

      createdApp.ontoolcancelled = () => {
        setStatus((prev) => (prev === 'loading' ? 'error' : prev));
        setErrorMessage('Consulta cancelada pelo usuário ou host.');
      };

      createdApp.onhostcontextchanged = (ctx) => {
        setHostContext((prev) => ({ ...prev, ...ctx }));
        if (ctx.displayMode === 'inline' || ctx.displayMode === 'fullscreen' || ctx.displayMode === 'pip') {
          setDisplayMode(ctx.displayMode);
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext() ?? hostContext);

  useEffect(() => {
    if (app && isConnected) {
      const ctx = app.getHostContext();
      if (ctx) {
        setHostContext(ctx);
        if (ctx.displayMode === 'inline' || ctx.displayMode === 'fullscreen' || ctx.displayMode === 'pip') {
          setDisplayMode(ctx.displayMode);
        }
      }
    }
  }, [app, isConnected]);

  useEffect(() => {
    if (error && embedded && !rawToolOutput && !oa?.toolOutput) {
      setStatus('error');
      setErrorMessage(toUserReadableError(error));
    }
  }, [error, embedded, rawToolOutput, oa?.toolOutput]);

  useEffect(() => {
    const onOnline = () => setStatus((prev) => (prev === 'offline' ? (rawToolOutput ? 'ready' : 'loading') : prev));
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [rawToolOutput]);

  const theme = useMemo(() => resolveTheme(hostContext), [hostContext]);
  const safeArea = useMemo(() => resolveSafeArea(hostContext), [hostContext]);
  const capabilities = useMemo(
    () => detectHostCapabilities(app, isConnected, hostContext),
    [app, isConnected, hostContext]
  );

  useEffect(() => {
    applyDocumentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const callTool = useCallback(
    async <T,>(
      name: string,
      args: Record<string, unknown>,
      schema?: z.ZodType<T>
    ): Promise<T | null> => {
      const requestId = ++latestRequestIdRef.current;
      setStatus((prev) => (prev === 'ready' || rawToolOutput ? 'refreshing' : 'loading'));
      setErrorMessage(null);

      try {
        let result: unknown;
        if (harness?.callTool) {
          result = await harness.callTool(name, args);
        } else if (app && isConnected) {
          result = await app.callServerTool({ name, arguments: args });
        } else if (oa?.callTool) {
          result = await oa.callTool(name, args);
        } else {
          throw new Error('Bridge indisponível para nova consulta.');
        }

        if (requestId !== latestRequestIdRef.current) {
          return null;
        }

        if (
          result &&
          typeof result === 'object' &&
          'isError' in result &&
          (result as { isError?: boolean }).isError
        ) {
          throw new Error('Tool execution failed');
        }

        const payload = extractStructuredPayload(result);
        if (!payload) {
          throw new BridgeValidationError('Empty or invalid structuredContent');
        }

        const validated = schema ? schema.parse(payload) : (payload as T);
        setStatus('ready');
        return validated;
      } catch (err) {
        if (requestId !== latestRequestIdRef.current) {
          return null;
        }
        setStatus(rawToolOutput ? 'ready' : 'error');
        setErrorMessage(toUserReadableError(err));
        return null;
      }
    },
    [app, isConnected, oa, harness, rawToolOutput]
  );

  const openExternalUrl = useCallback(
    async (rawUrl: string) => {
      const safe = sanitizeExternalHttpsUrl(rawUrl);
      if (!safe) return;

      if (harness?.openExternal) {
        harness.openExternal(safe);
        return;
      }
      if (oa?.openExternal) {
        await oa.openExternal({ href: safe });
        return;
      }
      if (app && isConnected) {
        await app.openLink({ url: safe });
        return;
      }
      window.open(safe, '_blank', 'noopener,noreferrer');
    },
    [app, isConnected, oa, harness]
  );

  const requestDisplayMode = useCallback(
    async (mode: DisplayMode) => {
      try {
        if (oa?.requestDisplayMode) {
          await oa.requestDisplayMode({ mode });
          setDisplayMode(mode);
          return;
        }
        if (app && isConnected) {
          const res = await app.requestDisplayMode({ mode });
          if (res?.mode) setDisplayMode(res.mode as DisplayMode);
          else setDisplayMode(mode);
        }
      } catch {
        // Host declined display mode transition; keep current mode gracefully.
      }
    },
    [app, isConnected, oa]
  );

  const sendFollowUpMessage = useCallback(
    async (text: string) => {
      if (oa?.sendFollowUpMessage) {
        await oa.sendFollowUpMessage({ prompt: text, scrollToBottom: true });
        return;
      }
      if (app && isConnected) {
        await app.sendMessage({
          role: 'user',
          content: [{ type: 'text', text }],
        });
      }
    },
    [app, isConnected, oa]
  );

  const value = useMemo<HostContextValue>(
    () => ({
      app,
      theme,
      displayMode,
      safeArea,
      capabilities,
      toolInput,
      rawToolOutput,
      status,
      errorMessage,
      callTool,
      openExternalUrl,
      requestDisplayMode,
      sendFollowUpMessage,
    }),
    [
      app,
      theme,
      displayMode,
      safeArea,
      capabilities,
      toolInput,
      rawToolOutput,
      status,
      errorMessage,
      callTool,
      openExternalUrl,
      requestDisplayMode,
      sendFollowUpMessage,
    ]
  );

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
};

export function useHostBridge(): HostContextValue {
  const ctx = useContext(HostContext);
  if (!ctx) {
    throw new Error('useHostBridge must be used within HostProvider');
  }
  return ctx;
}

