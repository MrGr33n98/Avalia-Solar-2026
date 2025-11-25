'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  CheckCircle2,
  Star,
  Target,
  AlertCircle,
  User,
  LogOut,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
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

interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface DashboardHeaderProps {
  company: any;
  notifications: Notification[];
  onNotificationClick?: (id: string) => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
  sidebarCollapsed?: boolean;
}

export default function DashboardHeader({ 
  company,
  notifications = [],
  onNotificationClick,
  onToggleTheme,
  isDark = false,
  sidebarCollapsed = false
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

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
      case 'approval': return 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400';
      case 'review': return 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400';
      case 'lead': return 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400';
      default: return 'bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        paddingLeft: sidebarCollapsed ? '96px' : '296px'
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 left-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Company Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={company?.logo_url} alt={company?.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
              {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                {company?.name || 'Minha Empresa'}
              </h1>
              {company?.verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {company?.city}, {company?.state}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="relative group"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          )}

          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative group"
              >
                <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-80 p-0 max-h-[480px] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} novas
                  </Badge>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificação
                    </p>
                  </div>
                ) : (
                  notifications.map((notif, index) => {
                    const Icon = getNotificationIcon(notif.type);
                    
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'p-4 border-b border-border cursor-pointer transition-colors',
                          !notif.read && 'bg-primary/5 hover:bg-primary/10',
                          notif.read && 'hover:bg-muted/50'
                        )}
                        onClick={() => {
                          onNotificationClick?.(notif.id);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'p-2 rounded-lg shrink-0',
                            getNotificationColor(notif.type)
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-foreground line-clamp-1">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimestamp(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setShowNotifications(false)}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-2 px-2 group"
              >
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(user?.name || user?.email || 'AD').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
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
