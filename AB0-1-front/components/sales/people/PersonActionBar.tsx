'use client';

import { Calendar, FileText, Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonActionBarProps {
  onLogActivity: () => void;
  onWriteNote: () => void;
  onSendEmail: () => void;
  onSendText: () => void;
  onCallContact: () => void;
  phone?: string | null;
  whatsapp?: string | null;
}

export default function PersonActionBar({
  onLogActivity,
  onWriteNote,
  onSendEmail,
  onSendText,
  onCallContact,
  phone: _phone,
  whatsapp: _whatsapp,
}: PersonActionBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-xs flex flex-wrap items-center gap-2">
      {/* 1. Log activity */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLogActivity}
        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:text-indigo-900 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
        <span>Log activity</span>
      </Button>

      {/* 2. Write note */}
      <Button
        variant="outline"
        size="sm"
        onClick={onWriteNote}
        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:text-amber-900 hover:bg-amber-50/50 hover:border-amber-200 transition-colors flex items-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5 text-amber-600" />
        <span>Write note</span>
      </Button>

      {/* 3. Send email */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSendEmail}
        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:text-sky-900 hover:bg-sky-50/50 hover:border-sky-200 transition-colors flex items-center gap-1.5"
      >
        <Mail className="w-3.5 h-3.5 text-sky-600" />
        <span>Send email</span>
      </Button>

      {/* 4. Send text (WhatsApp / SMS) */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSendText}
        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:text-emerald-900 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors flex items-center gap-1.5"
      >
        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
        <span>Send text</span>
      </Button>

      {/* 5. Call contact */}
      <Button
        variant="outline"
        size="sm"
        onClick={onCallContact}
        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:text-indigo-900 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
      >
        <Phone className="w-3.5 h-3.5 text-emerald-600" />
        <span>Call contact</span>
      </Button>
    </div>
  );
}
