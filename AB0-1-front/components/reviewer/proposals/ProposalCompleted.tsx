'use client';

import React from 'react';
import { ProposalProject } from './ProposalProject';
import type { MarketplaceProposal } from '@/lib/api';

export function ProposalCompleted({
  proposal,
  onViewProposal,
}: {
  proposal: MarketplaceProposal;
  onViewProposal: () => void;
}) {
  return <ProposalProject proposal={proposal} onViewProposal={onViewProposal} />;
}
