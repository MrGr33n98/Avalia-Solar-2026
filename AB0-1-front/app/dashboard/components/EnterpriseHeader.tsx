'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  X
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

interface EnterpriseHeaderProps {
  company: any;
  notifications: Notification[];
  onNotificationClick?: (id: string) => void;
  onMenuClick: () => void;
  themeToggle?: React.ReactNode;
}

export default function EnterpriseHeader({ 
  company,
  notifications = [],
  onNotificationClick,
  onMenuClick,
  themeToggle
}: EnterpriseHeaderProps) {
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
      case 'approval': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'review': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'lead': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'warning': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 h-16 bg-card/95 backdrop-blur-xl border-b border-border/50 z-50"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu Button + Company Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0 hover:bg-muted/60"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Company Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 ring-2 ring-border/50 shrink-0">
              <AvatarImage src={company?.logo_url} alt={company?.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-500 text-white text-xs font-semibold">
                {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
              </AvatarFallback>
            </Avatar>
            
            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-foreground truncate">
                  {company?.name || 'Minha Empresa'}
                </h1>
                {company?.verified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {company?.city}, {company?.state}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle */}
          {themeToggle}
          
          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/60"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
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
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} novas
                  </Badge>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
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
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'p-3 border-b border-border/30 cursor-pointer transition-colors',
                          !notif.read && 'bg-blue-500/5 hover:bg-blue-500/10',
                          notif.read && 'hover:bg-muted/40'
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
                              <h4 className="text-xs font-medium text-foreground line-clamp-1">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 mt-1.5">
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
                <div className="p-2 border-t border-border/50 bg-muted/20">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs h-8 hover:bg-muted/60"
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
                className="gap-2 px-2 hover:bg-muted/60"
              >
                <Avatar className="h-7 w-7 ring-2 ring-border/50">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-500 text-white text-xs font-semibold">
                    {(user?.name || user?.email || 'AD').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-foreground">{user?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-muted-foreground">{user?.email || ''}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer text-xs">
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
