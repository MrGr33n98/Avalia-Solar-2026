'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Search,
  Building2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from '@/context/CompanyContext';
import {
  companyTeamApi,
  CompanyMemberItem,
  CompanyInvitationItem,
} from '@/lib/api';

const ROLE_CONFIG: Record<
  string,
  { label: string; description: string; badgeClass: string; icon: React.ElementType }
> = {
  owner: {
    label: 'Proprietário',
    description: 'Acesso irrestrito a configurações, finanças e membros',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold',
    icon: ShieldAlert,
  },
  manager: {
    label: 'Gerente',
    description: 'Gerencia perfis, catálogo e convites de equipe',
    badgeClass: 'bg-sky-500/10 text-sky-500 border-sky-500/20 font-semibold',
    icon: ShieldCheck,
  },
  editor: {
    label: 'Editor',
    description: 'Atualiza informações, mídia e responde avaliações',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: Shield,
  },
  viewer: {
    label: 'Visualizador',
    description: 'Somente leitura de relatórios e painéis',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: Shield,
  },
};

export default function TeamManagementWorkspace() {
  const { activeCompany } = useCompanyContext();
  const { toast } = useToast();

  const [members, setMembers] = useState<CompanyMemberItem[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal de convite
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Modal de confirmação de exclusão
  const [memberToRemove, setMemberToRemove] = useState<CompanyMemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchTeamData = useCallback(async () => {
    if (!activeCompany?.id) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        companyTeamApi.getMembers(),
        companyTeamApi.getInvitations(),
      ]);
      setMembers(membersRes.items || []);
      setInvitations(invitesRes.items || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar equipe:', err);
      toast({
        title: 'Erro de comunicação',
        description: 'Não foi possível carregar os membros e convites da empresa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeCompany?.id, toast]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    try {
      await companyTeamApi.sendInvitation(inviteEmail.trim(), inviteRole);
      toast({
        title: 'Convite enviado!',
        description: `Enviamos as instruções de acesso para ${inviteEmail}.`,
      });
      setInviteEmail('');
      setInviteRole('editor');
      setInviteModalOpen(false);
      fetchTeamData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Falha ao processar o convite.';
      toast({
        title: 'Não foi possível convidar',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    try {
      await companyTeamApi.updateMemberRole(memberId, newRole);
      toast({
        title: 'Papel atualizado',
        description: 'As permissões do membro foram redefinidas com sucesso.',
      });
      fetchTeamData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Não foi possível atualizar o papel do membro.';
      toast({
        title: 'Operação bloqueada',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await companyTeamApi.removeMember(memberToRemove.id);
      toast({
        title: 'Membro removido',
        description: `${memberToRemove.user.email} não tem mais acesso à empresa.`,
      });
      setMemberToRemove(null);
      fetchTeamData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Não foi possível remover o membro.';
      toast({
        title: 'Ação não permitida',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResendInvite = async (invitationId: number) => {
    try {
      await companyTeamApi.resendInvitation(invitationId);
      toast({
        title: 'Convite reenviado',
        description: 'O e-mail de convite foi reenviado com novo prazo de validade.',
      });
      fetchTeamData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Não foi possível reenviar o convite.';
      toast({
        title: 'Erro ao reenviar',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleRevokeInvite = async (invitationId: number) => {
    try {
      await companyTeamApi.revokeInvitation(invitationId);
      toast({
        title: 'Convite revogado',
        description: 'O link de acesso enviado foi invalidado.',
      });
      fetchTeamData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Não foi possível revogar o convite.';
      toast({
        title: 'Erro ao revogar',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user.name && m.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'all' || m.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Contexto Empresarial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {activeCompany?.name || 'Empresa Ativa'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Gestão de Equipe & Permissões
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de governança multiusuário, hierarquia de papéis corporativos e convites transacionais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTeamData}
            disabled={loading}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            onClick={() => setInviteModalOpen(true)}
            size="sm"
            className="h-9 px-4 text-xs font-medium shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Convidar Membro
          </Button>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Membros Ativos</CardDescription>
            <CardTitle className="text-3xl font-black text-foreground">{members.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Usuários com acesso corporativo verificado
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Convites Pendentes</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-500">
              {invitations.filter((i) => i.status === 'pending').length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Tokens expiráveis em até 7 dias
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium">Segurança Multi-Tenant</CardDescription>
            <CardTitle className="text-3xl font-black text-primary">Ativa</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            Isolamento de tenancy com proteção de último owner
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="members" className="text-xs flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Membros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="text-xs flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Convites ({invitations.filter((i) => i.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Membros */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Filtrar papel:</span>
              <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                <SelectTrigger className="h-9 text-xs w-40">
                  <SelectValue placeholder="Todos os papéis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="owner">Proprietário</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Membro</th>
                    <th className="py-3 px-4">Papel & Permissões</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Data de Ingresso</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Carregando membros da organização...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum membro encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const roleMeta = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer;
                      const RoleIcon = roleMeta.icon;

                      return (
                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                                {(m.user.name || m.user.email).substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground text-xs">
                                  {m.user.name || 'Sem nome informado'}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {m.user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleMeta.badgeClass}`}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleMeta.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground hidden lg:inline">
                                ({roleMeta.description})
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={
                                m.user.status === 'active' || !m.user.status
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }
                            >
                              {m.user.status === 'active' || !m.user.status ? 'Ativo' : 'Revogado'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(m.id, 'owner')}
                                  disabled={m.role === 'owner'}
                                >
                                  Tornar Proprietário (Owner)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(m.id, 'manager')}
                                  disabled={m.role === 'manager'}
                                >
                                  Tornar Gerente (Manager)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(m.id, 'editor')}
                                  disabled={m.role === 'editor'}
                                >
                                  Tornar Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(m.id, 'viewer')}
                                  disabled={m.role === 'viewer'}
                                >
                                  Tornar Visualizador
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setMemberToRemove(m)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  Remover da Empresa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Convites Pendentes */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">E-mail Convidado</th>
                    <th className="py-3 px-4">Papel Proposto</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Validade</th>
                    <th className="py-3 px-4">Convidado Por</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Carregando convites pendentes...
                      </td>
                    </tr>
                  ) : invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhum convite pendente no momento.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => {
                      const roleMeta = ROLE_CONFIG[inv.role] || ROLE_CONFIG.editor;
                      const isPending = inv.status === 'pending';

                      return (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                            {inv.email}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleMeta.badgeClass}`}>
                              {roleMeta.label}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={
                                isPending
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : inv.status === 'accepted'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }
                            >
                              {inv.status === 'pending'
                                ? 'Pendente'
                                : inv.status === 'accepted'
                                ? 'Aceito'
                                : inv.status === 'expired'
                                ? 'Expirado'
                                : 'Revogado'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground">
                            {inv.invited_by?.name || inv.invited_by?.email || 'Administrador'}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendInvite(inv.id)}
                                  className="h-7 px-2 text-[11px]"
                                >
                                  Reenviar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                                >
                                  Revogar
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Convidar Membro */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-4 h-4 text-primary" />
              Convidar Membro para {activeCompany?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              O destinatário receberá um e-mail transacional com link de ativação válido por 7 dias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold">
                E-mail Corporativo
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colaborador@empresa.com.br"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-semibold">
                Nível de Permissão (Papel)
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" className="text-xs h-9">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="text-left">
                      <div className="font-semibold text-xs">Editor</div>
                      <div className="text-[10px] text-muted-foreground">
                        Edita perfil, responde avaliações e gerencia catálogo
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="text-left">
                      <div className="font-semibold text-xs">Gerente</div>
                      <div className="text-[10px] text-muted-foreground">
                        Adiciona/remove editores e gerencia conteúdo comercial
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="text-left">
                      <div className="font-semibold text-xs">Visualizador</div>
                      <div className="text-[10px] text-muted-foreground">
                        Acesso somente leitura para auditoria e relatórios
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="text-left">
                      <div className="font-semibold text-xs">Proprietário (Owner)</div>
                      <div className="text-[10px] text-muted-foreground">
                        Acesso total, gestão de faturamento e administração de equipe
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingInvite} className="text-xs h-8">
                {isSubmittingInvite ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Remoção */}
      <Dialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertCircle className="w-4 h-4" />
              Remover Membro da Empresa
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja remover {memberToRemove?.user.email} da organização? O acesso será revogado imediatamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMemberToRemove(null)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              className="text-xs h-8"
            >
              {isRemoving ? 'Removendo...' : 'Confirmar Remoção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
