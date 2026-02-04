import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, MessageCircle, Eye, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lead } from '@/lib/api';

interface QuotesPanelProps {
  data: Lead[];
  loading?: boolean;
  onViewDetails?: (id: string) => void;
  onCancel?: (id: string) => void;
  onTabChange?: (tabId: string) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  pending_otp: { label: 'Aguardando Validação', color: 'bg-yellow-100 text-yellow-800' },
  verified: { label: 'Verificado', color: 'bg-blue-100 text-blue-800' },
  proposal_sent: { label: 'Proposta Enviada', color: 'bg-green-100 text-green-800' },
  canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export function QuotesPanel({ data, loading, onViewDetails, onCancel, onTabChange }: QuotesPanelProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredData = data.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return ['draft', 'pending_otp', 'verified'].includes(item.status || '');
    if (activeTab === 'replied') return item.status === 'proposal_sent';
    if (activeTab === 'closed') return item.status === 'canceled';
    return true;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="rounded-2xl shadow-sm border overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Meus Orçamentos</CardTitle>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="open">Abertos</TabsTrigger>
              <TabsTrigger value="replied">Respondidos</TabsTrigger>
              <TabsTrigger value="closed">Finalizados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Empresa</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-gray-500 font-medium">Nenhum orçamento encontrado</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/empresas">Solicitar novo orçamento</a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((quote) => (
                  <TableRow key={quote.id} className="group transition-colors hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-gray-100">
                          <AvatarImage src={quote.company_logo_url || ''} />
                          <AvatarFallback className="bg-teal-50 text-teal-700 font-semibold">
                            {quote.company?.substring(0, 2).toUpperCase() || 'ES'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{quote.company || 'Empresa não identificada'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{quote.product_vertical || 'Energia Solar'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`font-medium ${statusMap[quote.status || '']?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusMap[quote.status || '']?.label || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{formatDate(quote.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewDetails?.(quote.id.toString())}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/messages?quoteId=${quote.id}`}>
                              <MessageCircle className="mr-2 h-4 w-4" /> Mensagens
                            </a>
                          </DropdownMenuItem>
                          {['draft', 'pending_otp', 'verified'].includes(quote.status || '') && (
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => onCancel?.(quote.id.toString())}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
