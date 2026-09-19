'use client';

import { useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { AIControlPlaneHeader } from '@/components/sales/ai/AIControlPlaneHeader';
import { ApprovalQueue } from '@/components/sales/ai/ApprovalQueue';
import { ApprovalInspector } from '@/components/sales/ai/ApprovalInspector';
import { ApproveModal } from '@/components/sales/ai/ApproveModal';
import { RejectModal } from '@/components/sales/ai/RejectModal';
import { SnoozeModal } from '@/components/sales/ai/SnoozeModal';
import {
  ApprovalRequest,
  useApprovals,
  useApproveMutation,
  useRejectMutation,
  useSnoozeMutation,
  useExecuteMutation,
} from '@/lib/api/mcp/approvals';

export default function AIApprovalInboxPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'snooze' | null>(null);
  const [targetRequest, setTargetRequest] = useState<ApprovalRequest | null>(null);

  // Filters calculation based on active tab
  const getFilters = () => {
    switch (activeTab) {
      case 'high_risk':
        return { status: 'pending', risk_tier: 'r3' }; // ou r3/r4
      case 'expiring':
        return { status: 'pending', expiring_soon: true };
      case 'snoozed':
        return { status: 'pending', snoozed: true };
      case 'all':
        return {};
      case 'pending':
      default:
        return { status: 'pending', snoozed: false };
    }
  };

  const { data: listResponse, isLoading } = useApprovals(getFilters());
  const approvals = listResponse?.data || [];

  // Mutations
  const approveMutation = useApproveMutation();
  const rejectMutation = useRejectMutation();
  const snoozeMutation = useSnoozeMutation();
  const executeMutation = useExecuteMutation();

  // Auto-select first item if none selected
  const effectiveSelectedUuid = selectedUuid || (approvals.length > 0 ? approvals[0].request_uuid : null);

  const handleOpenApprove = (req: ApprovalRequest) => {
    setTargetRequest(req);
    setModalType('approve');
  };

  const handleOpenReject = (req: ApprovalRequest) => {
    setTargetRequest(req);
    setModalType('reject');
  };

  const handleOpenSnooze = (req: ApprovalRequest) => {
    setTargetRequest(req);
    setModalType('snooze');
  };

  const handleConfirmApprove = async (uuid: string) => {
    await approveMutation.mutateAsync(uuid);
  };

  const handleConfirmReject = async (uuid: string, reason?: string) => {
    await rejectMutation.mutateAsync({ uuid, reason });
  };

  const handleConfirmSnooze = async (uuid: string, until: string, reason?: string) => {
    await snoozeMutation.mutateAsync({ uuid, until, reason });
  };

  const handleExecute = async (req: ApprovalRequest) => {
    await executeMutation.mutateAsync({ uuid: req.request_uuid });
  };

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col h-[calc(100vh-5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <AIControlPlaneHeader />

        {/* 2-Column Split: Approval Queue (Left) & Inspector (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left: Queue (5 cols) */}
          <div className="md:col-span-5 h-full overflow-hidden border-r border-slate-200">
            <ApprovalQueue
              approvals={approvals}
              selectedUuid={effectiveSelectedUuid}
              onSelect={(uuid) => setSelectedUuid(uuid)}
              isLoading={isLoading}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedUuid(null);
              }}
            />
          </div>

          {/* Right: Inspector (7 cols) */}
          <div className="md:col-span-7 h-full overflow-hidden">
            <ApprovalInspector
              requestUuid={effectiveSelectedUuid}
              onOpenApprove={handleOpenApprove}
              onOpenReject={handleOpenReject}
              onOpenSnooze={handleOpenSnooze}
              onExecute={handleExecute}
              isExecuting={executeMutation.isPending}
            />
          </div>
        </div>

        {/* Action Modals */}
        <ApproveModal
          request={targetRequest}
          isOpen={modalType === 'approve'}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmApprove}
          isApproving={approveMutation.isPending}
        />

        <RejectModal
          request={targetRequest}
          isOpen={modalType === 'reject'}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmReject}
          isRejecting={rejectMutation.isPending}
        />

        <SnoozeModal
          request={targetRequest}
          isOpen={modalType === 'snooze'}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmSnooze}
          isSnoozing={snoozeMutation.isPending}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
