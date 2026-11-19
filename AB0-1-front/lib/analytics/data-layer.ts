/**
 * Buffer de eventos de analytics autorizado pelo Consent Mode.
 * O dataLayer é uma fila: não precisa aguardar a biblioteca externa do GTM.
 * O chamador DEVE verificar hasAnalyticsConsent() antes de publicar.
 */
export function pushAnalyticsDataLayerEvent(
  eventName: string,
  parameters: Record<string, unknown>
): boolean {
  if (typeof window === 'undefined' || !eventName.trim()) return false;

  const analyticsWindow = window as Window & { dataLayer: Record<string, unknown>[] };
  if (!Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer = [];
  }

  // O campo event é controlado pelo contrato e não pode ser sobrescrito pelo payload.
  analyticsWindow.dataLayer.push({ ...parameters, event: eventName });
  return true;
}
