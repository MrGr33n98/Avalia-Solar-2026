'use client';

import { useRef, useState } from 'react';
import { Camera, RotateCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CRMModal from '@/components/sales/ui/CRMModal';
import { CRMFormField, CRMFormRow } from '@/components/sales/ui/CRMForm';
import CRMCompanySelect, { CompanyOption } from '@/components/sales/ui/CRMCompanySelect';
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
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
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
    if (!personName.trim()) return setError('Nome do contato é obrigatório');
    setLoading(true);
    setError(null);
    try {
      const personParts = personName.trim().split(' ');
      const firstName = personParts[0];
      const lastName = personParts.slice(1).join(' ') || undefined;

      await salesApi.createContact({
        sales_account_id: accountId || selectedCompany?.id || undefined,
        company_name: companyInputName.trim() || undefined,
        first_name: firstName,
        last_name: lastName,
        email: personEmail.trim() || undefined,
        phone: personPhone.trim() || undefined,
        whatsapp: personPhone.trim() || undefined,
        decision_role: decisionRole,
      });

      setSuccessMsg('Pessoa cadastrada com sucesso!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:contact-created'));
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setPersonName('');
        setPersonEmail('');
        setDescription('');
        setCompanyInputName('');
        setSelectedCompany(null);
        setPersonPhone('');
        setPersonAddress('');
        setPersonUrl('');
        setPhotoFileName(null);
        onSuccess?.();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar contato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Add a person"
      description="Cadastrar novo decisor ou contato comercial no CRM."
      size="md"
      heroIcon={<User className="w-8 h-8 text-sky-600" />}
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
            form="create-person-form"
            disabled={loading}
            className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin mr-2" /> : null} Add person
          </Button>
        </>
      }
    >
      <form id="create-person-form" onSubmit={handleSubmit} className="space-y-5 font-sans">
        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
        {successMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{successMsg}</p>}

        {/* Person Name */}
        <CRMFormField label="Person name" required>
          <Input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Ex: Carlos Silva"
            className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            required
          />
        </CRMFormField>

        {/* 2-Column Row: Email & Phone */}
        <CRMFormRow cols={2}>
          <CRMFormField label="Email">
            <Input
              type="email"
              value={personEmail}
              onChange={(e) => setPersonEmail(e.target.value)}
              placeholder="carlos@empresa.com.br"
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            />
          </CRMFormField>

          <CRMFormField label="Phone number">
            <Input
              value={personPhone}
              onChange={(e) => setPersonPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
            />
          </CRMFormField>
        </CRMFormRow>

        {/* Description */}
        <CRMFormField label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Observações sobre o papel no comitê de compra solar..."
            className="text-xs border-slate-300 focus:border-indigo-600 rounded-lg p-3 resize-none"
            rows={2}
          />
        </CRMFormField>

        {/* 2-Column Row: Company & Decision Role */}
        <CRMFormRow cols={2}>
          <CRMFormField label="Company">
            <CRMCompanySelect
              value={companyInputName}
              selectedAccount={selectedCompany}
              onChange={(name, company) => {
                setCompanyInputName(name);
                setSelectedCompany(company || null);
              }}
              placeholder="Selecione ou digite a empresa..."
            />
          </CRMFormField>

          <CRMFormField label="Decision role">
            <select
              value={decisionRole}
              onChange={(e) => setDecisionRole(e.target.value)}
              className="w-full h-10 text-xs rounded-lg border border-slate-300 bg-white px-3.5 text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="decision_maker">Decision Maker</option>
              <option value="economic_buyer">Economic Buyer</option>
              <option value="champion">Champion</option>
              <option value="technical_buyer">Technical Buyer</option>
            </select>
          </CRMFormField>
        </CRMFormRow>

        {/* Address */}
        <CRMFormField label="Address">
          <Textarea
            value={personAddress}
            onChange={(e) => setPersonAddress(e.target.value)}
            placeholder="Endereço corporativo / Cidade"
            className="text-xs border-slate-300 focus:border-indigo-600 rounded-lg p-3 resize-none"
            rows={2}
          />
        </CRMFormField>

        {/* URL */}
        <CRMFormField label="URL / LinkedIn">
          <Input
            value={personUrl}
            onChange={(e) => setPersonUrl(e.target.value)}
            placeholder="https://linkedin.com/in/perfil"
            className="h-10 text-xs border-slate-300 focus:border-indigo-600 rounded-lg px-3.5"
          />
        </CRMFormField>

        {/* Photo Upload Trigger */}
        <CRMFormField label="Foto do Contato">
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 text-xs border-dashed border-slate-300 text-slate-700 hover:border-indigo-400 font-semibold w-full flex items-center justify-center gap-2 rounded-lg bg-slate-50/50"
          >
            <Camera className="w-4 h-4 text-sky-600" />
            {photoFileName ? `Foto selecionada: ${photoFileName}` : 'Upload lead / person photo'}
          </Button>
        </CRMFormField>
      </form>
    </CRMModal>
  );
}
