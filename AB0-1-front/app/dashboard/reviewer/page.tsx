'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Wallet,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tipagem para os dados do dashboard
interface Review {
  id: string;
  companyName: string;
  rating: number;
  status: 'sent' | 'under_review' | 'answered';
  date: string;
}

interface GiftCard {
  id: string;
  value: number;
  status: 'available' | 'redeemed';
  code?: string;
}

export default function ReviewerDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock de dados para visualização inicial
  useEffect(() => {
    setTimeout(() => {
      setReviews([
        { id: '1', companyName: 'Solar Tech Brasil', rating: 5, status: 'answered', date: '2024-01-15' },
        { id: '2', companyName: 'Eco Energia', rating: 4, status: 'under_review', date: '2024-01-20' },
        { id: '3', companyName: 'Luz do Sol S.A', rating: 3, status: 'sent', date: '2024-01-25' },
      ]);
      setGiftCards([
        { id: '1', value: 50, status: 'available' },
        { id: '2', value: 30, status: 'redeemed', code: 'SOLAR-2024-XYZ' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100">Enviado</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Em análise</Badge>;
      case 'answered':
        return <Badge variant="default" className="bg-emerald-500 text-white">Respondido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Painel</h1>
            <p className="text-slate-500 mt-1">Bem-vindo de volta! Aqui estão suas avaliações e recompensas.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white border-slate-200">
              Nova Avaliação
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Ver Empresas
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total de Reviews</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{reviews.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Reviews Pendentes</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {reviews.filter(r => r.status !== 'answered').length}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Gift Cards Disponíveis</p>
                  <h3 className="text-2xl font-bold mt-1">
                    R$ {giftCards.filter(g => g.status === 'available').reduce((acc, curr) => acc + curr.value, 0)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="reviews" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Minhas Avaliações
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Gift Cards e Recompensas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg">Histórico de Avaliações</CardTitle>
                <CardDescription>Acompanhe o status de cada review enviada.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Empresa</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Nota</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-slate-900">{review.companyName}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{new Date(review.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(review.status)}</td>
                          <td className="px-6 py-4">
                            <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-emerald-600 p-0 h-auto font-medium flex items-center gap-1">
                              Ver detalhes <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftCards.map((card) => (
                <Card key={card.id} className={`border-none shadow-sm relative overflow-hidden ${card.status === 'redeemed' ? 'opacity-75 grayscale' : 'bg-white'}`}>
                  <div className={`absolute top-0 right-0 p-2 ${card.status === 'redeemed' ? 'bg-slate-200' : 'bg-emerald-500'} text-white rounded-bl-xl`}>
                    <Gift className="h-4 w-4" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-900">R$ {card.value},00</CardTitle>
                    <CardDescription>Gift Card Avalia Solar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {card.status === 'redeemed' ? (
                      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Código de Resgate</p>
                        <code className="text-lg font-mono text-slate-700">{card.code}</code>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Este Gift Card está pronto para ser resgatado. Use em nossos parceiros.</p>
                    )}
                    <Button 
                      className={`w-full ${card.status === 'redeemed' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      disabled={card.status === 'redeemed'}
                    >
                      {card.status === 'redeemed' ? 'Já Resgatado' : 'Resgatar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
