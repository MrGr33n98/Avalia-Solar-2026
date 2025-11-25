'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leadsApiSafe } from '@/lib/api-client';
import { toast } from 'sonner';

interface Props {
  companyName: string;
  companyId?: number;
}

export default function QuoteForm({ companyName, companyId }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [projectType, setProjectType] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Exibir modal de confirmação imediatamente após o clique
    showLeadConfirmationModal();
    try {
      await leadsApiSafe.create({ name, email, phone, company: companyName, message, project_type: projectType, estimated_budget: estimatedBudget, location, company_id: companyId });
      toast.success('Solicitação enviada com sucesso');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setProjectType('');
      setEstimatedBudget('');
      setLocation('');
    } catch (error) {
      toast.error('Não foi possível enviar a solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Solicitar Orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <Label>Tipo de Projeto</Label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Rural">Rural</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="estimatedBudget">Orçamento Estimado</Label>
            <Input id="estimatedBudget" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="Ex: R$ 50.000" />
          </div>
          <div>
            <Label htmlFor="location">Localização</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cidade - Estado" />
          </div>
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva sua necessidade" />
          </div>
          <div>
            <Label>Empresa</Label>
            <Input value={companyName} readOnly />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Enviando...' : 'Enviar solicitação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ======================
// Modal de confirmação
// ======================

// Cria e injeta, uma única vez, o bloco de estilos do modal
function ensureLeadModalStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('lead-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'lead-modal-styles';
  style.textContent = `
    .lead-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .lead-modal-content { background: #ffffff; color: #111111; font-size: 16px; line-height: 1.4; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); padding: 16px 20px; display: flex; align-items: center; gap: 12px; max-width: 92%; opacity: 1; transition: opacity 300ms ease; }
    .lead-modal-icon { width: 22px; height: 22px; flex: 0 0 auto; color: #16a34a; }
    .lead-modal-text { color: #111111; }
    @media (min-width: 640px) { .lead-modal-content { max-width: 420px; } }
    .fade-out { opacity: 0; }
  `;
  document.head.appendChild(style);
}

// Exibe a mensagem de confirmação de envio por ~5s com fade-out, acessível
function showLeadConfirmationModal() {
  if (typeof document === 'undefined') return;
  ensureLeadModalStyles();

  // Se já existir um overlay prévio, removê-lo para evitar duplicações
  document.querySelectorAll('.lead-modal-overlay').forEach((el) => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'lead-modal-overlay';
  overlay.setAttribute('aria-hidden', 'false');

  const content = document.createElement('div');
  content.className = 'lead-modal-content';
  content.setAttribute('role', 'alert');
  content.setAttribute('aria-live', 'assertive');
  content.setAttribute('tabindex', '-1');

  // Ícone de confirmação (SVG ✓)
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'lead-modal-icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M9 16.17l-3.88-3.88a1 1 0 10-1.41 1.41l4.59 4.59a1 1 0 001.41 0l10-10a1 1 0 10-1.41-1.41L9 16.17z');
  icon.appendChild(path);

  const text = document.createElement('div');
  text.className = 'lead-modal-text';
  text.textContent = 'Obrigado! Passaremos seus contatos para as melhores empresas verificadas.';

  content.appendChild(icon);
  content.appendChild(text);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Gerenciar foco para leitores de tela
  const active = document.activeElement as HTMLElement | null;
  content.focus();

  // Remover após ~5s com fade-out
  const visibleMs = 5000; // tolerância será dada pela transição
  setTimeout(() => {
    content.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      // Restaurar foco ao elemento anterior (se existir)
      if (active && typeof active.focus === 'function') {
        active.focus();
      }
    }, 320);
  }, visibleMs);
}

// Disponibiliza função para testes (JSDOM)
(globalThis as any).showLeadConfirmationModal = showLeadConfirmationModal;
