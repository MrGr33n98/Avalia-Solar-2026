'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';

interface Company {
  id: number;
  name: string;
}

interface LeadModalInternalProps {
  company: Company;
  category: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeadFormData {
  name: string;
  whatsapp: string;
  city: string;
  state: string;
  projectType: string;
  powerRange: string;
  message: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function LeadModalInternal({
  company,
  category,
  open,
  onOpenChange,
}: LeadModalInternalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    whatsapp: '',
    city: '',
    state: '',
    projectType: '',
    powerRange: '',
    message: '',
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nome obrigatório';
    if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp obrigatório';
    else if (!/^\d{11}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      newErrors.whatsapp = 'WhatsApp deve ter 11 dígitos (BR)';
    }
    if (!formData.city.trim()) newErrors.city = 'Cidade obrigatória';
    if (!formData.state) newErrors.state = 'Estado obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      track('lead_submit_internal', {
        company_id: company.id,
        company_name: company.name,
        category,
        project_type: formData.projectType,
      });

      // Simulação - em produção seria um POST real
      await new Promise((resolve) => setTimeout(resolve, 800));

      track('lead_success', {
        company_id: company.id,
        category,
      });

      setStep('success');
      setTimeout(() => {
        setStep('form');
        onOpenChange(false);
        setFormData({
          name: '',
          whatsapp: '',
          city: '',
          state: '',
          projectType: '',
          powerRange: '',
          message: '',
        });
      }, 3000);
    } catch (error) {
      console.error('Lead submission failed:', error);
      setErrors({ submit: 'Erro ao enviar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                Solicitar Orçamento
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                Para: <strong>{company.name}</strong>
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  placeholder="(11) 9XXXX-XXXX"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    handleFieldChange(
                      'whatsapp',
                      e.target.value.replace(/\D/g, '')
                    )
                  }
                  className={errors.whatsapp ? 'border-red-500' : ''}
                />
                {errors.whatsapp && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) =>
                    handleFieldChange('state', value)
                  }
                >
                  <SelectTrigger
                    className={errors.state ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.state}
                  </p>
                )}
              </div>

              {/* Tipo de Projeto */}
              <div className="space-y-2">
                <Label htmlFor="projectType">Tipo de Projeto</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) =>
                    handleFieldChange('projectType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agribusiness">Agronegócio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Faixa de Potência */}
              <div className="space-y-2">
                <Label htmlFor="powerRange">Faixa de Potência</Label>
                <Select
                  value={formData.powerRange}
                  onValueChange={(value) =>
                    handleFieldChange('powerRange', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-75">Até 75kW</SelectItem>
                    <SelectItem value="75-300">75–300kW</SelectItem>
                    <SelectItem value="300+">+300kW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Compartilhe detalhes sobre seu projeto..."
                  rows={3}
                  value={formData.message}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                />
              </div>

              {errors.submit && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                size="lg"
              >
                {loading ? 'Enviando...' : 'Receber Propostas'}
              </Button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-950 mb-2">
              Pedido Enviado!
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Enviamos seu pedido para empresas qualificadas. Em breve eles
              entrarão em contato.
            </p>

            {/* Upsell */}
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs font-bold text-blue-900 mb-2">
                💡 Dica: Quer resposta mais rápida?
              </p>
              <p className="text-xs text-blue-800 mb-3">
                Prefira empresas com contato direto! Elas respondem em minutos.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onOpenChange(false)}
              >
                Ver Empresas com Contato Direto
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Encerrando em breve...
            </p>
          </div>
        )}

        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
