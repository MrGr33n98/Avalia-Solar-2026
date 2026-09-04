'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SendEmailModal from '@/components/sales/create/SendEmailModal';

type EmailComposerModalProps = {
  accountId?: number;
  contactId?: number;
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
  opportunityId?: number;
  onSuccess?: () => void;
};

export default function EmailComposerModal({
  contactName,
  contactEmail,
  companyName,
  opportunityId,
  onSuccess,
}: EmailComposerModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-9 border-sky-300 text-sky-900 font-bold hover:bg-sky-50"
      >
        <Mail className="mr-1.5 h-3.5 w-3.5 text-sky-600" /> Enviar E-mail
      </Button>

      <SendEmailModal
        open={open}
        onClose={() => setOpen(false)}
        opportunityId={opportunityId}
        contactEmail={contactEmail}
        contactName={contactName}
        companyName={companyName}
        onSuccess={onSuccess}
      />
    </>
  );
}
