import { getApiOrigin } from './api-config';

type CableMessage = any;

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
  const origin = getApiOrigin();
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
