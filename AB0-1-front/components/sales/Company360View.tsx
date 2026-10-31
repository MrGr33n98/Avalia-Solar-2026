'use client';

import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import Account360Content from '@/components/sales/companies/Account360Content';

export interface Company360ViewProps {
  accountId?: number;
  companyName?: string;
  city?: string;
  state?: string;
  segment?: string;
  domain?: string;
  solarProjectId?: number;
  openByDefault?: boolean;
}

export default function Company360View({
  accountId,
  openByDefault = false,
}: Company360ViewProps) {
  const [open, setOpen] = useState(openByDefault);

  if (!accountId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-semibold text-blue-900 hover:bg-blue-50 px-2"
        >
          <Eye className="mr-1 h-3.5 w-3.5 text-blue-700" /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50/70 border-slate-200 p-4 sm:p-6">
        <Account360Content
          accountId={accountId}
          mode="quick_view"
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
