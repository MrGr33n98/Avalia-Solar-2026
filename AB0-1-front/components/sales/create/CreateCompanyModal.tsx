'use client';

import { useRef, useState } from 'react';
import { Building2, Image as ImageIcon, Plus, RotateCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';
import { salesApi } from '@/lib/api/sales/client';

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCompanyModal({ open, onClose, onSuccess }: CreateCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [personName, setPersonName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return setError('Company name is required');
    setLoading(true);
    setError(null);
    try {
      await salesApi.createAccount({
        name: companyName,
        domain: companyUrl.replace(/^https?:\/\//, ''),
        phone: companyPhone,
        email: companyEmail,
      });

      setSuccessMsg('Company added successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setCompanyName('');
        setDescription('');
        setCompanyEmail('');
        setCompanyPhone('');
        setCompanyAddress('');
        setPersonName('');
        setCompanyUrl('');
        setLogoFileName(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error creating company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a company"
      size="md"
      heroIcon={<Building2 className="w-8 h-8 text-blue-600" />}
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
            form="create-company-form"
            disabled={loading}
            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs"
          >
            {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Add company
          </Button>
        </>
      }
    >
      <form id="create-company-form" onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-md">{successMsg}</p>}

        {/* Company Name */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Company name</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            required
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

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Email</Label>
          <Input
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Phone number</Label>
          <Input
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            placeholder="(11) 3000-0000"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Address</Label>
          <Textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            className="text-xs border-slate-200 focus:border-indigo-500 rounded-md resize-none"
            rows={2}
          />
        </div>

        {/* Person (Select or create a person) */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">Person</Label>
          <div className="relative">
            <UserPlus className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-3 pointer-events-none" />
            <Input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Select or create a person"
              className="h-9 pl-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
            />
          </div>
        </div>

        {/* URL */}
        <div className="space-y-1">
          <Label className="text-xs font-normal text-slate-600">URL</Label>
          <Input
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://"
            className="h-9 text-xs border-slate-200 focus:border-indigo-500 rounded-md"
          />
        </div>

        {/* Logo Upload Trigger */}
        <div className="pt-1">
          <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs border-dashed border-slate-300 text-slate-600 hover:border-slate-400 font-medium w-full flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            {logoFileName ? `Logo selected: ${logoFileName}` : 'Upload company logo'}
          </Button>
        </div>
      </form>
    </CRMModal>
  );
}
