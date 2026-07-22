import LiveInbox from './LiveInbox';
import { Suspense } from 'react';

export const metadata = {
  title: 'Inbox de atendimento | Avalia Solar',
  robots: { index: false, follow: false },
};

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-slate-100" aria-busy="true" />}>
      <LiveInbox />
    </Suspense>
  );
}
