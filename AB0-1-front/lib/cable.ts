import { getApiOrigin } from './api-config';

type CableMessage = any;
const PROD_API_ORIGIN = 'https://api.avaliasolar.com.br';

function isLocalHostUrl(url: string): boolean {
  return /(^|:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}

function shouldForcePublicApiOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV !== 'production') return false;
  return !['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function sanitizeOrigin(origin: string): string {
  const trimmed = (origin || '').trim();
  if (!trimmed) return '';
  if (shouldForcePublicApiOrigin() && isLocalHostUrl(trimmed)) {
    return PROD_API_ORIGIN;
  }
  return trimmed;
}

function toWsUrl(origin: string): string {
  if (!origin) return '';
  if (origin.startsWith('https://')) return origin.replace('https://', 'wss://');
  if (origin.startsWith('http://')) return origin.replace('http://', 'ws://');
  return origin.replace(/^http/, 'ws');
}

export function subscribeCompanyDashboard(
  companyId: string | number,
  onMessage: (msg: CableMessage) => void
) {
  const origin = sanitizeOrigin(getApiOrigin()) || (process.env.NODE_ENV === 'production' ? PROD_API_ORIGIN : '');
  const wsOrigin = toWsUrl(origin);
  if (!wsOrigin) {
    console.warn('ActionCable: Missing WS Origin', { wsOrigin });
    return () => {};
  }

  const url = `${wsOrigin}/cable`;
  console.log('ActionCable: Connecting to', url);
  const socket = new WebSocket(url);

  socket.onopen = () => {
    const identifier = JSON.stringify({ channel: 'CompanyDashboardChannel', company_id: Number(companyId) });
    socket.send(JSON.stringify({ command: 'subscribe', identifier }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Ignore pings and internal confirmations
      if (data.type === 'ping' || data.type === 'welcome' || data.type === 'confirm_subscription') return;
      if (data.message) onMessage(data.message);
    } catch {
      // ignore
    }
  };

  socket.onerror = (error) => {
    console.error('ActionCable: WebSocket Error', error);
    // ignore; UI can fall back to polling
  };

  return () => {
    try {
      socket.close();
    } catch {
      // ignore
    }
  };
}
