'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Star,
  Target,
  AlertCircle,
  User,
  LogOut,
  Settings,
  Menu,
  MoreHorizontal,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Shield
} from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics/lazy';

interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

import { useCompanyContext } from '@/context/CompanyContext';
import { useRouter } from 'next/navigation';

interface EnterpriseHeaderProps {
  company: any;
  notifications: Notification[];
  onNotificationClick?: (id: string) => void;
  onMenuClick: () => void;
  onTabChange: (tabId: string) => void;
  themeToggle?: React.ReactNode;
}

export default function EnterpriseHeader({ 
  company,
  notifications = [],
  onNotificationClick,
  onMenuClick,
  onTabChange,
  themeToggle
}: EnterpriseHeaderProps) {
  const { user } = useAuth();
  const { companies, selectCompany } = useCompanyContext();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleCompanySwitch = async (targetCompany: any) => {
    if (targetCompany.id === company?.id) return;
    
    try {
      await selectCompany(targetCompany);
      // Refresh the page or the data context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch company', error);
    }
  };

  const handleExportCSV = () => {
    // Track using unified analytics
    track('Report Exported', {
      export_type: 'csv',
      company_id: company?.id,
      user_id: user?.id
    });

    // Basic implementation for demonstration
    // In a real app, this would fetch the full data or use the existing state
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Métrica,Valor\n"
      + `Nome da Empresa,${company?.name || 'N/A'}\n`
      + `Visualizações de Perfil,${company?.stats?.profile_views || 0}\n`
      + `Cliques em CTA,${company?.stats?.cta_clicks || 0}\n`
      + `Leads Recebidos,${company?.stats?.leads_received || 0}\n`
      + `Média de Avaliações,${company?.stats?.average_rating || 0}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_dashboard_${company?.id || 'empresa'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return CheckCircle2;
      case 'review': return Star;
      case 'lead': return Target;
      case 'warning': return AlertCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval': return 'bg-brand-green/10 text-brand-green';
      case 'review': return 'bg-brand-blue/10 text-brand-blue';
      case 'lead': return 'bg-brand-cyan/10 text-brand-cyan';
      case 'warning': return 'bg-brand-yellow/10 text-brand-yellow';
      default: return 'bg-white/10 text-white/60';
    }
  };

  return (
    <header className="sticky top-0 h-[68px] bg-[#002B4D]/80 backdrop-blur-md border-b border-white/[0.08] z-50">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu Button + Company Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger Menu Button (Hidden on desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Abrir menu de navegação"
            className="lg:hidden shrink-0 hover:bg-white/10 text-white/70"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Company Info */}
          <div className="flex items-center gap-3 min-w-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0">
                  <Avatar className="h-9 w-9 ring-1 ring-white/10 shrink-0">
                    <AvatarImage src={company?.logo_url} alt={company?.name} />
                    <AvatarFallback className="bg-brand-blue text-white text-xs font-bold">
                      {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-[200px]">
                        {company?.name || 'Minha Empresa'}
                      </h1>
                      <MoreHorizontal className="h-3.5 w-3.5 text-white/40 shrink-0" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-white/50 truncate">
                      {company?.city}, {company?.state}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-[#002B4D] border-white/10 text-white">
                <DropdownMenuLabel className="text-xs text-white/50">Trocar Empresa</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {companies.map((c) => (
                  <DropdownMenuItem 
                    key={c.id} 
                    className={cn(
                      "cursor-pointer hover:bg-white/10",
                      c.id === company?.id && "bg-brand-blue/20 text-brand-cyan"
                    )}
                    onClick={() => handleCompanySwitch(c)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={c.logo_url ?? undefined} alt={c.name} />
                        <AvatarFallback className="text-[10px] bg-white/10">
                          {c.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{c.name}</span>
                      {c.id === company?.id && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-brand-cyan text-xs"
                  onClick={() => router.push('/select-company')}
                >
                  <Shield className="mr-2 h-3.5 w-3.5" />
                  Ver todas as empresas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center: Global Search (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md">
          <CommandMenu onSelectTab={onTabChange} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative md:hidden hover:bg-white/10 text-white/70"
                aria-label="Mais ações do dashboard"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#002B4D] border-white/10 text-white">
              <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Exportar como CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => {
                track('Report Exported', {
                  export_type: 'pdf',
                  company_id: company?.id,
                  user_id: user?.id
                });
                window.print();
              }}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Imprimir página</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Reports */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <Download className="h-4 w-4" />
                <span>Relatórios</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#002B4D] border-white/10 text-white">
              <DropdownMenuLabel>Exportar Dados</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Exportar como CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => {
                track('Report Exported', {
                  export_type: 'pdf',
                  company_id: company?.id,
                  user_id: user?.id
                });
                window.print();
              }}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Imprimir Página (PDF)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          {themeToggle}

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ajuda e Suporte"
                className="relative hidden md:inline-flex hover:bg-white/10 text-white/70"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#002B4D] border-white/10 text-white">
              <DropdownMenuLabel>Ajuda</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => window.open('https://horizon-ui.com/boilerplate-shadcn#pricing', '_blank')}>
                Planos e Preços
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => window.location.href = 'mailto:suporte@ab01.com'}>
                Suporte Técnico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ver notificações"
                className="relative hover:bg-white/10 text-white/70"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-brand-blue text-white text-[10px] rounded-full flex items-center justify-center font-bold border-[0.5px] border-white/20">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-80 p-0 max-h-[480px] overflow-hidden bg-[#002B4D] border-white/10 text-white"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Notificações</h3>
                  <Badge variant="secondary" className="text-xs bg-brand-blue text-white border-none">
                    {unreadCount} novas
                  </Badge>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-10 w-10 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">
                      Nenhuma notificação
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-3 border-b border-white/5 cursor-pointer transition-colors',
                          !notif.read && 'bg-brand-blue/10 hover:bg-brand-blue/20',
                          notif.read && 'hover:bg-white/5'
                        )}
                        onClick={() => {
                          onNotificationClick?.(notif.id);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'p-1.5 rounded-md shrink-0',
                            getNotificationColor(notif.type)
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="h-1.5 w-1.5 bg-brand-cyan rounded-full shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1.5">
                              {formatTimestamp(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="hidden md:block h-6 bg-white/10" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-2 px-2 hover:bg-white/10 text-white/70"
              >
                <Avatar className="h-7 w-7 ring-1 ring-white/10">
                  <AvatarImage src={user?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-brand-gray text-white text-xs font-bold">
                    {(user?.name || user?.email || 'AD').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-white/50 truncate">{user?.email || ''}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 bg-[#002B4D] border-white/10 text-white">
              <DropdownMenuLabel className="text-xs">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              
              <DropdownMenuItem className="cursor-pointer text-xs hover:bg-white/10">
                <User className="h-3.5 w-3.5 mr-2" />
                Perfil
              </DropdownMenuItem>

              
              <DropdownMenuItem className="cursor-pointer text-xs">
                <Settings className="h-3.5 w-3.5 mr-2" />
                Configurações
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-500/10">
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short'
  });
}
