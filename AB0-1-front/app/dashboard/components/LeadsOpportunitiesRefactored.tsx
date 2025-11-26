'use client';

/**
 * LeadsOpportunities - Refatorado com shadcn/ui
 * CRM completo para gestão de leads e oportunidades
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Target,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
import type { Lead } from '../types';

// Utils
import { cn, formatRelativeTime, formatPhone } from '../utils';
import { fetchApi } from '@/lib/api';

interface LeadsOpportunitiesProps {
  companyId: string;
}

type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'converted' | 'lost';
type FilterStatus = 'all' | LeadStatus;

export default function LeadsOpportunities({ companyId }: LeadsOpportunitiesProps) {
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchApi<any[]>(
          '/leads',
          { params: { company_id: companyId } }
        );
        const mapped: Lead[] = Array.isArray(data) ? data.map((l: any) => ({
          id: String(l.id),
          name: l.name,
          email: l.email,
          phone: l.phone,
          message: l.message,
          status: 'new',
          created_at: l.created_at,
          company: l.company,
        })) : [];
        setLeads(mapped);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  // Computed values
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchQuery) {
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(lead => lead.status === filterStatus);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [leads, searchQuery, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      negotiating: leads.filter(l => l.status === 'negotiating').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };
    const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
    const conversionRate = total > 0 ? (byStatus.converted / total) * 100 : 0;

    return { total, byStatus, totalValue, conversionRate };
  }, [leads]);

  // Handlers
  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(leads.map(lead =>
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));

    toast({
      title: 'Status atualizado!',
      description: `Lead movido para "${getStatusLabel(newStatus)}".`,
    });
  };

  const handleContactAction = (lead: Lead, action: 'phone' | 'email' | 'whatsapp') => {
    switch (action) {
      case 'phone':
        window.open(`tel:${lead.phone.replace(/\D/g, '')}`);
        break;
      case 'email':
        window.open(`mailto:${lead.email}`);
        break;
      case 'whatsapp':
        const phone = lead.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`);
        break;
    }

    // Update status to contacted if it's new
    if (lead.status === 'new') {
      handleStatusChange(lead.id, 'contacted');
    }
  };

  const openDetailDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailDialog(true);
  };

  const getStatusColor = (status: LeadStatus) => {
    const colors = {
      new: 'bg-blue-500',
      contacted: 'bg-green-500',
      negotiating: 'bg-yellow-500',
      converted: 'bg-purple-500',
      lost: 'bg-red-500',
    };
    return colors[status];
  };

  const getStatusLabel = (status: LeadStatus) => {
    const labels = {
      new: 'Novo',
      contacted: 'Contatado',
      negotiating: 'Em Negociação',
      converted: 'Convertido',
      lost: 'Perdido',
    };
    return labels[status];
  };

  const getStatusBadgeVariant = (status: LeadStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (status === 'new') return 'default';
    if (status === 'lost') return 'destructive';
    if (status === 'converted') return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Leads e Oportunidades</h2>
        <p className="text-muted-foreground">
          Gerencie contatos e acompanhe oportunidades de negócio
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold">{stats.byStatus.new}</p>
              </div>
              <div className={cn('w-3 h-3 rounded-full', getStatusColor('new'))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contatados</p>
                <p className="text-2xl font-bold">{stats.byStatus.contacted}</p>
              </div>
              <div className={cn('w-3 h-3 rounded-full', getStatusColor('contacted'))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Negociação</p>
                <p className="text-2xl font-bold">{stats.byStatus.negotiating}</p>
              </div>
              <div className={cn('w-3 h-3 rounded-full', getStatusColor('negotiating'))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold">{stats.byStatus.converted}</p>
              </div>
              <div className={cn('w-3 h-3 rounded-full', getStatusColor('converted'))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
                <p className="text-3xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou mensagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="contacted">Contatados</SelectItem>
                <SelectItem value="negotiating">Em Negociação</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Carregando leads...</h3>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'Nenhum lead encontrado'
                  : 'Nenhum lead recebido'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Quando clientes entrarem em contato, os leads aparecerão aqui.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Lead Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        {lead.company && (
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(lead.phone)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatRelativeTime(lead.created_at)}</span>
                      </div>
                      {lead.source && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          <span>{lead.source}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm line-clamp-2">{lead.message}</p>
                    </div>

                    {lead.value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none"
                      onClick={() => handleContactAction(lead, 'phone')}
                    >
                      <Phone className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Ligar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none"
                      onClick={() => handleContactAction(lead, 'email')}
                    >
                      <Mail className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">E-mail</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none"
                      onClick={() => handleContactAction(lead, 'whatsapp')}
                    >
                      <MessageSquare className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">WhatsApp</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted')}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Marcar como contatado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'negotiating')}>
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          Em negociação
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'converted')}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-purple-600" />
                          Convertido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'lost')}>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Marcar como perdido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDetailDialog(lead)}>
                          Ver detalhes completos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>Informações completas do contato</DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome</p>
                  <p className="font-semibold">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedLead.status)}>
                    {getStatusLabel(selectedLead.status)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p>{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                  <p>{formatPhone(selectedLead.phone)}</p>
                </div>
                {selectedLead.company && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                    <p>{selectedLead.company}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Mensagem</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{selectedLead.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Recebido em</p>
                  <p className="text-sm">
                    {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {selectedLead.value && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor</p>
                    <p className="text-sm font-semibold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.value)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock Data
const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    message: 'Gostaria de um orçamento para reforma completa de apartamento de 80m². Preciso de projeto arquitetônico e acompanhamento de obra.',
    status: 'new',
    created_at: new Date(Date.now() - 3600000),
    source: 'Website',
    value: 45000,
    company: 'Silva Construções',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 97654-3210',
    message: 'Interessada em projeto de arquitetura para casa nova. Terreno de 250m² em condomínio.',
    status: 'contacted',
    created_at: new Date(Date.now() - 86400000),
    source: 'Instagram',
    value: 120000,
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@empresa.com',
    phone: '(11) 96543-2109',
    message: 'Preciso de consultoria para projeto comercial. Loja de 150m² em shopping.',
    status: 'negotiating',
    created_at: new Date(Date.now() - 172800000),
    source: 'Indicação',
    value: 85000,
    company: 'Oliveira Comércio',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 95432-1098',
    message: 'Gostaria de fazer uma reforma na cozinha e banheiro. Pode fazer uma visita?',
    status: 'converted',
    created_at: new Date(Date.now() - 259200000),
    source: 'Google',
    value: 28000,
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    phone: '(11) 94321-0987',
    message: 'Orçamento para paisagismo de área externa residencial.',
    status: 'lost',
    created_at: new Date(Date.now() - 345600000),
    source: 'Facebook',
  },
];
