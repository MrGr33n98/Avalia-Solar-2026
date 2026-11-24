export type ThemeMode = 'light' | 'dark';
export type DisplayMode = 'inline' | 'fullscreen' | 'pip';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HostCapabilities {
  isConnected: boolean;
  hasOpenAiBridge: boolean;
  canCallTools: boolean;
  canOpenExternal: boolean;
  canRequestDisplayMode: boolean;
  canSendMessage: boolean;
  availableDisplayModes: DisplayMode[];
}

export interface OpenAiRuntimeGlobal {
  theme?: ThemeMode;
  displayMode?: DisplayMode;
  maxHeight?: number;
  locale?: string;
  safeArea?: { insets?: Partial<SafeAreaInsets> };
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  toolResponseMetadata?: Record<string, unknown>;
  widgetState?: unknown;
  setWidgetState?: (state: unknown) => Promise<void> | void;
  callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  sendFollowUpMessage?: (opts: { prompt: string; scrollToBottom?: boolean }) => Promise<void> | void;
  openExternal?: (opts: { href: string; redirectUrl?: string }) => Promise<void> | void;
  requestDisplayMode?: (opts: { mode: DisplayMode }) => Promise<{ mode?: DisplayMode } | void>;
}

declare global {
  interface Window {
    openai?: OpenAiRuntimeGlobal;
    __AVALIA_MCP_HARNESS__?: {
      toolName?: string;
      toolInput?: Record<string, unknown>;
      toolOutput?: unknown;
      theme?: ThemeMode;
      displayMode?: DisplayMode;
      callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
      openExternal?: (href: string) => void;
    };
  }
}

export interface ToolResultState<T> {
  status: 'loading' | 'ready' | 'refreshing' | 'error' | 'offline';
  data: T | null;
  toolInput: Record<string, unknown>;
  errorMessage: string | null;
}

