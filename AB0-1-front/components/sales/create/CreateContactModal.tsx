'use client';

import { useRef, useState } from 'react';
import { Building2, Camera, Plus, RotateCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';
import { salesApi } from '@/lib/api/sales/client';

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  accountId?: number;
  onSuccess?: () => void;
}

export default function CreateContactModal({ open, onClose, accountId, onSuccess }: CreateContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [description, setDescription] = useState('');
  const [companyInputName, setCompanyInputName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [personAddress, setPersonAddress] = useState('');
  const [personUrl, setPersonUrl] = useState('');
  const [decisionRole, setDecisionRole] = useState('decision_maker');
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return setError('Person name is required');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createContact({
        sales_account_id: accountId,
        first_name: personName,
        email: personEmail,
        phone: personPhone,
        whatsapp: personPhone,
        decision_role: decisionRole,
      });

      setSuccessMsg('Person added successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setPersonName('');
        setPersonEmail('');
        setDescription('');
        setCompanyInputName('');
        setPersonPhone('');
        setPersonAddress('');
        setPersonUrl('');
        setPhotoFileName(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error adding person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a person"
      size="md"
      heroIcon={<User className="w-8 h-8 text-sky-600" />}
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
            form="create-person-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Add person
          </Button>
        </>
      }
    >
      <form id="create-person-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        {/* Person Name */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Person name</Label>
          <Input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Email</Label>
          <Input
            type="email"
            value={personEmail}
            onChange={(e) => setPersonEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={2}
          />
        </div>

        {/* Company (Select or create a company) */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Company</Label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-3 pointer-events-none" />
            <Input
              value={companyInputName}
              onChange={(e) => setCompanyInputName(e.target.value)}
              placeholder="Select or create a company"
              className="h-9 pl-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Phone number</Label>
          <Input
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            placeholder="(11) 99999-0000"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Address</Label>
          <Textarea
            value={personAddress}
            onChange={(e) => setPersonAddress(e.target.value)}
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={2}
          />
        </div>

        {/* URL */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">URL</Label>
          <Input
            value={personUrl}
            onChange={(e) => setPersonUrl(e.target.value)}
            placeholder="https://"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Decision Role */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Decision role</Label>
          <select
            value={decisionRole}
            onChange={(e) => setDecisionRole(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:border-indigo-500"
          >
            <option value="decision_maker">Decision Maker</option>
            <option value="economic_buyer">Economic Buyer</option>
            <option value="champion">Champion</option>
            <option value="technical_buyer">Technical Buyer</option>
          </select>
        </div>

        {/* Lead Photo Upload Trigger */}
        <div className="pt-1">
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs border-dashed border-slate-300 text-slate-600 hover:border-slate-400 font-medium w-full flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            {photoFileName ? `Photo selected: ${photoFileName}` : 'Upload lead / person photo'}
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
