'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { webhooksApi, CompanyWebhook, WebhookPayload } from '@/lib/api/webhooks';

const AVAILABLE_EVENTS = [
  { id: 'intent.hot', label: 'Lead de Alta Intenção (Hot)', description: 'Disparado quando um lead atinge intenção altíssima de compra' },
  { id: 'intent.boiling', label: 'Lead em Ebulição (Boiling)', description: 'Disparado quando um lead está pronto para converter' },
  { id: 'intent.immediate', label: 'Intenção Imediata', description: 'Disparado quando o lead demonstra urgência' },
  { id: 'intent.declared', label: 'Intenção Declarada', description: 'Disparado quando o lead pede contato' },
  { id: 'lead.captured', label: 'Lead Capturado', description: 'Disparado quando um novo lead entra no sistema' },
  { id: 'lead.identified', label: 'Lead Identificado', description: 'Disparado quando um visitante anônimo vira lead' }
];

export default function WebhooksManagement() {
  const [webhooks, setWebhooks] = useState<CompanyWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<CompanyWebhook | null>(null);
  
  // Form State
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Secret visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await webhooksApi.getWebhooks();
      setWebhooks(res.webhooks);
    } catch (error) {
      console.error('Failed to fetch webhooks', error);
      toast({
        title: 'Erro ao carregar webhooks',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (webhook?: CompanyWebhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setUrl(webhook.url);
      setActive(webhook.active);
      setSelectedEvents(webhook.events || []);
    } else {
      setEditingWebhook(null);
      setUrl('');
      setActive(true);
      setSelectedEvents([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWebhook(null);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) => 
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      toast({
        title: 'URL Inválida',
        description: 'A URL deve começar com http:// ou https://',
        variant: 'destructive',
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: 'Nenhum evento selecionado',
        description: 'Selecione pelo menos um evento para enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: WebhookPayload = {
        url,
        active,
        events: selectedEvents,
      };

      if (editingWebhook) {
        await webhooksApi.updateWebhook(editingWebhook.id, payload);
        toast({ title: 'Webhook atualizado com sucesso!' });
      } else {
        await webhooksApi.createWebhook(payload);
        toast({ title: 'Webhook criado com sucesso!' });
      }
      
      await fetchWebhooks();
      handleCloseModal();
    } catch (error) {
      toast({
        title: 'Erro ao salvar webhook',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;
    
    try {
      await webhooksApi.deleteWebhook(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast({ title: 'Webhook excluído com sucesso!' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (webhook: CompanyWebhook, newActive: boolean) => {
    try {
      await webhooksApi.updateWebhook(webhook.id, {
        url: webhook.url,
        events: webhook.events,
        active: newActive
      });
      setWebhooks(webhooks.map((w) => w.id === webhook.id ? { ...w, active: newActive } : w));
      toast({ title: newActive ? 'Webhook ativado' : 'Webhook desativado' });
    } catch (error) {
      toast({
        title: 'Erro ao alterar status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Integrações (Webhooks)</h2>
          <p className="text-sm text-white/40">Conecte seus sistemas para receber eventos do Avalia Solar em tempo real.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      <Card className="bg-card/50 border-white/10 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center p-12">
              <div className="bg-white/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum webhook configurado</h3>
              <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
                Crie um webhook para receber informações sobre leads e intenções diretamente no seu CRM ou sistema interno.
              </p>
              <Button onClick={() => handleOpenModal()} variant="outline" className="border-white/10">
                Adicionar meu primeiro webhook
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">URL</TableHead>
                    <TableHead className="text-white/60">Eventos</TableHead>
                    <TableHead className="text-white/60">Assinatura (Secret)</TableHead>
                    <TableHead className="text-right text-white/60">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={webhook.active} 
                            onCheckedChange={(checked) => handleToggleActive(webhook, checked)} 
                          />
                          <Badge variant={webhook.active ? "default" : "secondary"} className={webhook.active ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-white/10"}>
                            {webhook.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={webhook.url}>
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((evt) => (
                            <Badge key={evt} variant="outline" className="text-[10px] border-white/10 text-white/60">
                              {evt.replace('intent.', '').replace('lead.', '')}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-[10px] border-white/10 text-white/60">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-black/40 px-2 py-1 rounded text-xs text-white/60 font-mono w-24 truncate block">
                            {visibleSecrets[webhook.id] ? webhook.secret_key : '••••••••••••••••'}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-white/40 hover:text-white"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {visibleSecrets[webhook.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={() => handleOpenModal(webhook)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(webhook.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1A1F2C] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white/80">URL do Endpoint</Label>
              <Input
                id="url"
                placeholder="https://sua-api.com.br/webhooks/avalia"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
              />
              <p className="text-xs text-white/40">Deve ser uma URL publicamente acessível iniciando com http:// ou https://</p>
            </div>

            <div className="space-y-3">
              <Label className="text-white/80">Eventos Inscritos</Label>
              <div className="grid gap-2 border border-white/10 p-3 rounded-md bg-black/10 max-h-[250px] overflow-y-auto">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 py-2">
                    <Checkbox 
                      id={`event-${event.id}`} 
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      className="mt-1 border-white/20 data-[state=checked]:bg-primary"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label 
                        htmlFor={`event-${event.id}`} 
                        className="text-sm font-medium leading-none text-white cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label} <span className="text-xs font-mono text-white/40 ml-1">({event.id})</span>
                      </label>
                      <p className="text-xs text-white/40">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4 bg-black/10">
              <div className="space-y-0.5">
                <Label className="text-white/80 text-base">Webhook Ativo</Label>
                <p className="text-xs text-white/40">
                  Receber dados em tempo real
                </p>
              </div>
              <Switch
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingWebhook ? 'Salvar Alterações' : 'Criar Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
