'use client';

import { useRouter } from 'next/navigation';
import CreateCompanyModal from './CreateCompanyModal';
import CreateContactModal from './CreateContactModal';
import CreateTaskModal from './CreateTaskModal';
import CreateActivityModal from './CreateActivityModal';
import CreateQuoteModal from './CreateQuoteModal';
import SendEmailModal from './SendEmailModal';
import CreateLeadModal from '@/components/sales/leads/create/CreateLeadModal';

interface CRMGlobalCreateHostProps {
  modalType: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CRMGlobalCreateHost({ modalType, onClose, onSuccess }: CRMGlobalCreateHostProps) {
  const router = useRouter();

  if (!modalType) return null;

  if (modalType === 'import') {
    onClose();
    router.push('/dashboard/sales/import');
    return null;
  }

  return (
    <>
      <CreateLeadModal
        open={modalType === 'opportunity' || modalType === 'lead'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <CreateCompanyModal
        open={modalType === 'company'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <CreateContactModal
        open={modalType === 'contact'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <CreateTaskModal
        open={modalType === 'task'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <CreateActivityModal
        open={modalType === 'activity'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <CreateQuoteModal
        open={modalType === 'quote'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
      <SendEmailModal
        open={modalType === 'email'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </>
  );
}
