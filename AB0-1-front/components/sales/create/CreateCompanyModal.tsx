'use client';

import { useRef, useState } from 'react';
import { Building2, Image as ImageIcon, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';
import { CRMFormField, CRMFormRow } from '@/components/sales/ui/CRMForm';
import CRMPersonSelect, { PersonOption } from '@/components/sales/ui/CRMPersonSelect';
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
  const [selectedPersonContact, setSelectedPersonContact] = useState<PersonOption | null>(null);
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
    if (!companyName.trim()) return setError('Nome da empresa é obrigatório');
    setLoading(true);
    setError(null);
    try {
      let city: string | undefined;
      let state: string | undefined;
      if (companyAddress.trim()) {
        const parts = companyAddress.split(/[-—,]/);
        if (parts.length >= 2) {
          city = parts[parts.length - 2].trim();
          state = parts[parts.length - 1].trim();
        } else {
          city = companyAddress.trim();
        }
      }

      const cleanDomain = companyUrl
        ? companyUrl.replace(/^https?:\/\//, '').split('/')[0]
        : undefined;

      const personParts = personName.trim().split(' ');
      const firstName = selectedPersonContact?.first_name || personParts[0] || undefined;
      const lastName = selectedPersonContact?.last_name || personParts.slice(1).join(' ') || undefined;

      await salesApi.createAccount({
        name: companyName.trim(),
        domain: cleanDomain,
        website: companyUrl.trim() || undefined,
        phone: companyPhone.trim() || undefined,
        email: companyEmail.trim() || undefined,
        city,
        state,
        segment: 'Integrador / Instalador',
        primary_contact: (firstName || selectedPersonContact?.id)
          ? {
              id: selectedPersonContact?.id,
              first_name: firstName || 'Contato',
              last_name: lastName,
              email: selectedPersonContact?.email || companyEmail.trim() || undefined,
              phone: companyPhone.trim() || undefined,
            }
          : undefined,
      });

      setSuccessMsg('Empresa cadastrada com sucesso!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:account-created'));
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setCompanyName('');
        setDescription('');
        setCompanyEmail('');
        setCompanyPhone('');
        setCompanyAddress('');
        setPersonName('');
        setSelectedPersonContact(null);
        setCompanyUrl('');
        setLogoFileName(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a company"
      description="Cadastrar nova empresa B2B ou organização cliente no CRM."
      size="md"
      heroIcon={<Building2 className="w-8 h-8 text-indigo-700" />}
      showCustomizeFields={true}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-10 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-company-form"
            disabled={loading}
            className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : null} Add company
          </Button>
        </>
      }
    >
      <form id="create-company-form" onSubmit={handleSubmit} className="space-y-5 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{successMsg}</p>}

        {/* Company Name */}
        <CRMFormField label="Company name" required>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Usinas & Engenharia Solar S/A"
            className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            required
          />
        </CRMFormField>

        {/* Description */}
        <CRMFormField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre atuação da empresa, segmento solar e perfil corporativo..."
            className="text-xs border-slate-300 focus:border-indigo-600 rounded-lg p-3 resize-none"
            rows={2}
          />
        </CRMFormField>

        {/* 2-Column Row: Email & Phone */}
        <CRMFormRow cols={2}>
          <CRMFormField label="Email">
            <Input
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="contato@empresa.com.br"
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            />
          </CRMFormField>

          <CRMFormField label="Phone number">
            <Input
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="(11) 3000-0000"
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            />
          </CRMFormField>
        </CRMFormRow>

        {/* Address */}
        <CRMFormField label="Address">
          <Textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            placeholder="Av. Paulista, 1000 — São Paulo, SP"
            className="text-xs border-slate-300 focus:border-indigo-600 rounded-lg p-3 resize-none"
            rows={2}
          />
        </CRMFormField>

        {/* 2-Column Row: Primary Person & Website URL */}
        <CRMFormRow cols={2}>
          <CRMFormField label="Person (Contato Principal)">
            <CRMPersonSelect
              value={personName}
              selectedContact={selectedPersonContact}
              onChange={(name, contact) => {
                setPersonName(name);
                setSelectedPersonContact(contact || null);
              }}
              placeholder="Select or create a person"
            />
          </CRMFormField>

          <CRMFormField label="URL / Website">
            <Input
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://empresa.com.br"
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            />
          </CRMFormField>
        </CRMFormRow>

        {/* Logo Upload Trigger */}
        <CRMFormField label="Logo da Empresa">
          <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 text-xs border-dashed border-slate-300 text-slate-700 hover:border-indigo-400 font-semibold w-full flex items-center justify-center gap-2 rounded-lg bg-slate-50/50"
          >
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            {logoFileName ? `Logo selecionado: ${logoFileName}` : 'Upload company logo'}
          </Button>
        </CRMFormField>
      </form>
    </CRMModal>
  );
}
