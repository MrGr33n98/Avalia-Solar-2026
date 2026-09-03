'use client';

import { useState } from 'react';
import { Mail, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  contactEmail?: string;
  onSuccess?: () => void;
}

export default function SendEmailModal({ open, onClose, opportunityId, contactEmail, onSuccess }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [toEmail, setToEmail] = useState(contactEmail || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) {
      return setError('All required fields must be filled out');
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: {
            to_email: toEmail,
            subject,
            body,
            sales_opportunity_id: opportunityId,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      setSuccessMsg('Email sent successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setSubject('');
        setBody('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error sending email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Send email"
      size="md"
      heroIcon={<Mail className="w-8 h-8 text-sky-600" />}
      showCustomizeFields={true}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="send-email-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Send email
          </Button>
        </>
      }
    >
      <form id="send-email-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">To</Label>
          <Input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Proposal & Solar Technical Assessment"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email content..."
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={5}
            required
          />
        </div>
      </form>
    </CRMModal>
  );
}
