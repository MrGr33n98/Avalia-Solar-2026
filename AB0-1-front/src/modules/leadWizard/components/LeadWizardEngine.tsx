'use client';

import React, { useEffect } from 'react';
import { useLeadWizard } from '../hooks/useLeadWizard';
import { WizardRenderer } from './WizardRenderer';

interface LeadWizardEngineProps {
  categoryId: number;
  preferredCompanyId?: number;
  onClose?: () => void;
  onSuccess?: (leadId: number) => void;
}

export const LeadWizardEngine: React.FC<LeadWizardEngineProps> = ({ 
  categoryId, 
  preferredCompanyId,
  onClose,
  onSuccess 
}) => {
  const wizardState = useLeadWizard(categoryId, preferredCompanyId);

  // Expose success callback
  useEffect(() => {
    if (wizardState.status === 'SUCCESS' && wizardState.leadResult && onSuccess) {
      onSuccess(wizardState.leadResult.lead_id);
    }
  }, [wizardState.status, wizardState.leadResult, onSuccess]);

  // Handle component unmount abandonment tracking
  useEffect(() => {
    return () => {
      if (wizardState.status === 'STEP_ACTIVE') {
        wizardState.abandonWizard();
      }
    };
  }, [wizardState.status, wizardState.abandonWizard]);

  return (
    <div className="w-full relative">
      <WizardRenderer wizardState={wizardState} />
    </div>
  );
};
