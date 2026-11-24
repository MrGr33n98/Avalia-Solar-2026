import type { App, McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { DisplayMode, HostCapabilities, SafeAreaInsets, ThemeMode } from './types';

export function detectHostCapabilities(
  app: App | null,
  isConnected: boolean,
  hostContext?: McpUiHostContext | null
): HostCapabilities {
  const oa = typeof window !== 'undefined' ? window.openai : undefined;
  const harness = typeof window !== 'undefined' ? window.__AVALIA_MCP_HARNESS__ : undefined;

  const availableDisplayModes: DisplayMode[] =
    (hostContext?.availableDisplayModes as DisplayMode[] | undefined) ??
    ['inline', 'fullscreen'];

  return {
    isConnected: isConnected || Boolean(harness) || Boolean(oa?.toolOutput),
    hasOpenAiBridge: Boolean(oa),
    canCallTools: Boolean(
      (app && isConnected) || oa?.callTool || harness?.callTool
    ),
    canOpenExternal: Boolean(
      (app && isConnected) || oa?.openExternal || harness?.openExternal
    ),
    canRequestDisplayMode: Boolean(
      (app && isConnected && availableDisplayModes.length > 1) || oa?.requestDisplayMode
    ),
    canSendMessage: Boolean((app && isConnected) || oa?.sendFollowUpMessage),
    availableDisplayModes,
  };
}

export function resolveTheme(hostContext?: McpUiHostContext | null): ThemeMode {
  const oa = typeof window !== 'undefined' ? window.openai : undefined;
  const harness = typeof window !== 'undefined' ? window.__AVALIA_MCP_HARNESS__ : undefined;

  const theme = hostContext?.theme ?? harness?.theme ?? oa?.theme;
  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function resolveSafeArea(hostContext?: McpUiHostContext | null): SafeAreaInsets {
  const oaInsets = typeof window !== 'undefined' ? window.openai?.safeArea?.insets : undefined;
  const insets = hostContext?.safeAreaInsets ?? oaInsets;
  return {
    top: insets?.top ?? 0,
    right: insets?.right ?? 0,
    bottom: insets?.bottom ?? 0,
    left: insets?.left ?? 0,
  };
}

export function isEmbeddedIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

export function sanitizeExternalHttpsUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

