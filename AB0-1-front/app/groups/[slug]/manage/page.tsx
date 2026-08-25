'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  BookOpen,
  FileText,
  ShieldAlert,
  BarChart3,
  Plus,
  Trash2,
  Check,
  X,
  Ban,
  ArrowLeft,
} from 'lucide-react';
import {
  getGroup,
  getMembers,
  getTopics,
  getRules,
  getPendingRequests,
  approveMembershipRequest,
  rejectMembershipRequest,
  updateMemberRole,
  suspendMember,
  createTopic,
  deleteTopic,
  createRule,
  deleteRule,
  getGroupAnalytics,
  getContentReports,
  resolveContentReport,
} from '@/lib/api/groups';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';

type TabType = 'members' | 'requests' | 'topics' | 'rules' | 'reports' | 'analytics';

export default function GroupManagePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [period, setPeriod] = useState<number>(30);

  // CRUD state for new topic
  const [newTopicName, setNewTopicName] = useState('');
  // CRUD state for new rule
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');

  // 1. Fetch Group Info (for title and permission checking)
  const { data: group, isLoading: groupLoading, isError: groupError } = useQuery({
    queryKey: ['group', slug],
    queryFn: () => getGroup(slug),
  });

  // Guard: if user is not authorized to moderate, redirect or block
  const canModerate = group?.permissions?.can_moderate;

  // 2. Fetch Tab Content queries (only enabled when respective tab is active)
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['group-members-manage', slug],
    queryFn: () => getMembers(slug),
    enabled: activeTab === 'members' && !!canModerate,
  });

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['group-requests-manage', slug],
    queryFn: () => getPendingRequests(slug),
    enabled: activeTab === 'requests' && !!canModerate,
  });

  const { data: topics, isLoading: topicsLoading, refetch: refetchTopics } = useQuery({
    queryKey: ['group-topics-manage', slug],
    queryFn: () => getTopics(slug),
    enabled: activeTab === 'topics' && !!canModerate,
  });

  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['group-rules-manage', slug],
    queryFn: () => getRules(slug),
    enabled: activeTab === 'rules' && !!canModerate,
  });

  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['group-reports-manage', group?.id],
    queryFn: () => getContentReports(group?.id, 'open'),
    enabled: activeTab === 'reports' && !!canModerate && !!group?.id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['group-analytics-manage', slug, period],
    queryFn: () => getGroupAnalytics(slug, period),
    enabled: activeTab === 'analytics' && !!canModerate,
  });

  // 3. Mutations for actions
  const approveMutation = useMutation({
    mutationFn: (id: number) => approveMembershipRequest(slug, id),
    onSuccess: () => {
      refetchRequests();
      toast({ title: 'Membro aprovado', description: 'O membro foi adicionado à comunidade.' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectMembershipRequest(slug, id),
    onSuccess: () => {
      refetchRequests();
      toast({ title: 'Solicitação recusada', description: 'A solicitação foi removida.' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'member' | 'moderator' }) =>
      updateMemberRole(slug, id, role),
    onSuccess: () => {
      refetchMembers();
      toast({ title: 'Cargo atualizado', description: 'O cargo do membro foi atualizado.' });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => suspendMember(slug, id),
    onSuccess: () => {
      refetchMembers();
      toast({ title: 'Membro suspenso', description: 'O membro foi banido da comunidade.' });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (name: string) => createTopic(slug, { name }),
    onSuccess: () => {
      refetchTopics();
      setNewTopicName('');
      toast({ title: 'Tópico criado', description: 'O tópico foi adicionado com sucesso.' });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: number) => deleteTopic(slug, id),
    onSuccess: () => {
      refetchTopics();
      toast({ title: 'Tópico removido', description: 'O tópico foi desativado.' });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: { title: string; description: string }) => createRule(slug, rule),
    onSuccess: () => {
      refetchRules();
      setNewRuleTitle('');
      setNewRuleDescription('');
      toast({ title: 'Regra criada', description: 'A regra foi adicionada com sucesso.' });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => deleteRule(slug, id),
    onSuccess: () => {
      refetchRules();
      toast({ title: 'Regra removida', description: 'A regra foi desativada.' });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'resolved' | 'dismissed' }) =>
      resolveContentReport(id, status),
    onSuccess: (_, variables) => {
      refetchReports();
      toast({
        title: variables.status === 'resolved' ? 'Denúncia aceita' : 'Denúncia descartada',
        description: variables.status === 'resolved'
          ? 'O conteúdo denunciado foi removido.'
          : 'A denúncia foi encerrada sem alterações.',
      });
    },
  });

  if (groupLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">Carregando painel de gerenciamento...</p>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-600 font-semibold">Comunidade não encontrada.</p>
        <Link href="/groups" className="text-xs text-blue-600 hover:underline">Voltar para comunidades</Link>
      </div>
    );
  }

  // Permission Guard
  if (!groupLoading && !canModerate) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4 p-5 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-lg font-bold text-slate-800">Acesso Restrito</h1>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          Você não tem permissão de moderação nesta comunidade para acessar as configurações de gerenciamento.
        </p>
        <Link href={`/groups/${slug}`}>
          <Button variant="outline" className="text-xs gap-2 rounded-xl mt-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para o feed
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Breadcrumb Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/groups/${slug}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Gerenciar Comunidade</h1>
              <p className="text-xs text-slate-500 font-medium">{group.name}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <nav className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm md:col-span-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Configurações</p>
            
            <button
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'members'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Membros</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'requests'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Solicitações</span>
              </div>
              {requests && requests.length > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {requests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('topics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'topics'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Tópicos</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'rules'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Regras</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Denúncias</span>
              </div>
              {reports && reports.length > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {reports.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Métricas</span>
            </button>
          </nav>

          {/* Right Main Content Pane */}
          <main className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-3 min-h-[400px]">
            
            {/* TAB: MEMBERS */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Gerenciamento de Membros</h2>
                  <p className="text-xs text-slate-500">Altere cargos de moderação ou aplique suspensões.</p>
                </div>

                {membersLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando membros...</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {members?.map((member) => {
                      const isOwner = member.role === 'owner';
                      const isModerator = member.role === 'moderator';

                      return (
                        <div key={member.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={member.user.name}
                              src={member.user.avatar_url}
                              className="h-9 w-9 border border-slate-200/50"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-950">{member.user.name}</p>
                              <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                                isOwner ? 'bg-amber-100 text-amber-800' :
                                isModerator ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {isOwner ? 'Proprietário' : isModerator ? 'Moderador' : 'Membro'}
                              </span>
                            </div>
                          </div>

                          {!isOwner && (
                            <div className="flex items-center gap-2">
                              {/* Toggle moderator role */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    id: member.id,
                                    role: isModerator ? 'member' : 'moderator',
                                  })
                                }
                                className="text-[10px] font-bold h-8 rounded-lg"
                              >
                                {isModerator ? 'Remover Mod' : 'Promover Mod'}
                              </Button>

                              {/* Ban button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => suspendMutation.mutate(member.id)}
                                className="text-destructive hover:bg-red-50 text-[10px] font-bold h-8 rounded-lg"
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" /> Banir
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Solicitações de Participação</h2>
                  <p className="text-xs text-slate-500">Aprove ou recuse membros que solicitaram entrada.</p>
                </div>

                {requestsLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando solicitações...</p>
                ) : requests && requests.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={request.user.name}
                            src={request.user.avatar_url}
                            className="h-9 w-9 border border-slate-200/50"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-950">{request.user.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Solicitou adesão</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(request.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold h-8 rounded-lg"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(request.id)}
                            className="text-slate-600 border-slate-200 text-[10px] font-bold h-8 rounded-lg"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Recusar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <UserCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Nenhuma solicitação pendente</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TOPICS */}
            {activeTab === 'topics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tópicos de Discussão</h2>
                  <p className="text-xs text-slate-500">Crie ou gerencie categorias de postagem para o grupo.</p>
                </div>

                {/* Add new topic */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newTopicName.trim() === '') return;
                    createTopicMutation.mutate(newTopicName);
                  }}
                  className="flex gap-2 max-w-md"
                >
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Novo tópico (ex: Instalação, Dúvidas...)"
                    className="flex-1 text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 text-white rounded-xl text-xs font-bold gap-1.5 h-9">
                    <Plus className="h-4 w-4" /> Criar
                  </Button>
                </form>

                {topicsLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando tópicos...</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {topics?.map((topic) => (
                      <div key={topic.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                        <div>
                          <p className="text-xs font-bold text-slate-950">{topic.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">/{topic.slug}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTopicMutation.mutate(topic.id)}
                          className="h-8 w-8 text-destructive hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: RULES */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Regras da Comunidade</h2>
                  <p className="text-xs text-slate-500">Mantenha a comunidade saudável e amigável definindo diretrizes claras.</p>
                </div>

                {/* Add new rule */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newRuleTitle.trim() === '') return;
                    createRuleMutation.mutate({ title: newRuleTitle, description: newRuleDescription });
                  }}
                  className="space-y-3 p-4 bg-slate-50 rounded-2xl max-w-lg border border-slate-100"
                >
                  <input
                    type="text"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="Título da regra"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none bg-white"
                  />
                  <textarea
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    placeholder="Descrição detalhada"
                    rows={2}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none bg-white resize-none"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 text-white rounded-xl text-xs font-bold gap-1.5 h-9">
                    <Plus className="h-4 w-4" /> Adicionar Regra
                  </Button>
                </form>

                {rulesLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando regras...</p>
                ) : (
                  <div className="space-y-3">
                    {rules?.map((rule, idx) => (
                      <div key={rule.id} className="flex items-start justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-slate-200 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-950">{idx + 1}. {rule.title}</p>
                          {rule.description && <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          className="h-8 w-8 text-destructive hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Denúncias pendentes</h2>
                  <p className="text-xs text-slate-500">Analise denúncias de posts ou comentários impróprios.</p>
                </div>

                {reportsLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando denúncias...</p>
                ) : reports && reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                            Denúncia de {report.reportable_type === 'GroupPost' ? 'Publicação' : 'Comentário'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{report.created_at}</span>
                        </div>

                        <div className="text-xs text-slate-700 bg-white border border-slate-100 p-3 rounded-xl space-y-1">
                          <p className="font-bold text-slate-500">Motivo: <span className="text-slate-800 font-medium">{report.reason}</span></p>
                          {report.details && <p className="text-slate-500 leading-relaxed">Detalhes: <span className="text-slate-700">{report.details}</span></p>}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => resolveReportMutation.mutate({ id: report.id, status: 'resolved' })}
                            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold h-8 rounded-lg"
                          >
                            Aceitar & Ocultar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveReportMutation.mutate({ id: report.id, status: 'dismissed' })}
                            className="text-slate-600 border-slate-200 text-[10px] font-bold h-8 rounded-lg"
                          >
                            Descartar denúncia
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ShieldAlert className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Tudo limpo por aqui</p>
                    <p className="text-[11px] text-slate-400">Nenhum post ou comentário denunciado no momento.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Métricas da Comunidade</h2>
                    <p className="text-xs text-slate-500">Métricas reais de engajamento e adesão.</p>
                  </div>

                  {/* Period filter */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    {[7, 30, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => setPeriod(days)}
                        className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                          period === days
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {days} Dias
                      </button>
                    ))}
                  </div>
                </div>

                {analyticsLoading ? (
                  <p className="text-xs text-slate-400 py-4 animate-pulse">Carregando métricas...</p>
                ) : analytics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    
                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Membros</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{analytics.total_members}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Novos Membros</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">+{analytics.new_members}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Novos Posts</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{analytics.posts_count}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Comentários</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{analytics.comments_count}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Curtidas</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{analytics.reactions_count}</p>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contribuidores Ativos</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{analytics.active_contributors}</p>
                    </div>

                  </div>
                ) : null}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
