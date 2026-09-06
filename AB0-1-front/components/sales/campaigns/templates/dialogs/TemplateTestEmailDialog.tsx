'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, X } from 'lucide-react';

interface TemplateTestEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTest: (email: string) => Promise<void>;
  defaultEmail?: string;
}

export function TemplateTestEmailDialog({
  isOpen,
  onClose,
  onSendTest,
  defaultEmail = '',
}: TemplateTestEmailDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await onSendTest(email);
      setSuccess(`E-mail de teste enviado com sucesso para ${email}!`);
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar e-mail de teste.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-md bg-background rounded-lg shadow-xl border p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Enviar E-mail de Teste
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Endereço de E-mail de Destino</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com.br"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              O template será renderizado com dados de exemplo e enviado imediatamente.
            </p>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
          {success && <p className="text-xs text-emerald-600 bg-emerald-500/10 p-2 rounded">{success}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={sending}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={sending || !email} className="gap-1.5">
              {sending ? 'Enviando...' : 'Enviar Agora'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
