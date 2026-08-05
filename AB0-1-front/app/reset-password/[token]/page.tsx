import { redirect } from 'next/navigation';

/**
 * Rota legada mantida apenas para não renderizar tokens recebidos no path.
 * Novos links usam exclusivamente /reset-password#token=..., cujo fragmento
 * não é enviado ao servidor. O token legado é descartado e nunca processado.
 */
export default function LegacyResetPasswordPage() {
  redirect('/forgot-password?reason=legacy_reset_link');
}
