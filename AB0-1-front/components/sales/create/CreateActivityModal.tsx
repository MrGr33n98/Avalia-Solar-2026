'use client';

import { useState } from 'react';
import { PhoneCall, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';

interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId?: number;
  contactId?: number;
  onSuccess?: () => void;
}

export default function CreateActivityModal({
  open,
  onClose,
  opportunityId,
  contactId,
  onSuccess,
}: CreateActivityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activityType, setActivityType] = useState('call');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return setError('Subject is required');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activity: {
            activity_type: activityType,
            subject,
            body: description,
            sales_opportunity_id: opportunityId,
            sales_contact_id: contactId,
            occurred_at: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to log activity');
      setSuccessMsg('Activity logged successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setSubject('');
        setDescription('');
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error logging activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Log an activity"
      size="md"
      heroIcon={<PhoneCall className="w-8 h-8 text-indigo-600" />}
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
            form="create-activity-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Log activity
          </Button>
        </>
      }
    >
      <form id="create-activity-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Activity type</Label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:border-indigo-500"
          >
            <option value="call">Phone Call</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email Sent</option>
            <option value="whatsapp">WhatsApp Message</option>
            <option value="note">Note / Observation</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Call to align payback requirements with CTO"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Notes / Details</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Summarize key decision points, objections, and next steps..."
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={3}
          />
        </div>
      </form>
    </CRMModal>
  );
}
