'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import { proposalChatUrl } from '@/lib/marketplace-proposals';
import { Button } from '@/components/ui/button';

export function ProposalConversationCta({ proposal }: { proposal: MarketplaceProposal }) {
  return (
    <Button
      asChild
      className="w-full bg-[hsl(var(--dashboard-warning))] text-[hsl(var(--dashboard-ink))] shadow-none hover:opacity-90"
    >
      <Link href={proposalChatUrl(proposal)}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Conversar com a empresa ({proposal.company.name})
      </Link>
    </Button>
  );
}
