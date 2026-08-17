import { redirect } from 'next/navigation';

/** Legacy path intentionally does not process tokens from the URL path. */
export default function LegacyConfirmEmailPage() {
  redirect('/confirm-email?reason=legacy_confirmation_link');
}
