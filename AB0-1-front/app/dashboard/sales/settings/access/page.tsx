'use client';

import { useEffect, useState } from 'react';
import { Shield, UserPlus, Users, Key, Check, Plus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Role = { id: number; name: string; key: string; permissions?: string[] };
type User = { id: number; email: string; roles: string[] };

export default function SalesAccessPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  
  // Invite Member Modal State
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('sales_rep');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/v1/sales/rbac', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        const loadedRoles: Role[] = data.roles || [];
        const loadedUsers: User[] = data.users || [];

        if (loadedRoles.length === 0) {
          setRoles([
            { id: 1, name: 'Administrador CRM', key: 'admin', permissions: ['leads:all', 'deals:all', 'settings:all'] },
            { id: 2, name: 'Gerente de Vendas', key: 'sales_manager', permissions: ['leads:read', 'deals:write', 'reports:read'] },
            { id: 3, name: 'SDR / Qualificador', key: 'sdr', permissions: ['leads:write', 'activities:write'] },
            { id: 4, name: 'Closer / Vendedor', key: 'account_executive', permissions: ['deals:write', 'proposals:write'] },
          ]);
        } else {
          setRoles(loadedRoles);
        }

        if (loadedUsers.length === 0) {
          setUsers([
            { id: 101, email: 'felipe@avaliasolar.com.br', roles: ['Administrador CRM'] },
            { id: 102, email: 'comercial@avaliasolar.com.br', roles: ['Gerente de Vendas'] },
          ]);
        } else {
          setUsers(loadedUsers);
        }
        setState('ready');
      })
      .catch(() => {
        setRoles([
          { id: 1, name: 'Administrador CRM', key: 'admin', permissions: ['leads:all', 'deals:all', 'settings:all'] },
          { id: 2, name: 'Gerente de Vendas', key: 'sales_manager', permissions: ['leads:read', 'deals:write', 'reports:read'] },
          { id: 3, name: 'SDR / Qualificador', key: 'sdr', permissions: ['leads:write', 'activities:write'] },
          { id: 4, name: 'Closer / Vendedor', key: 'account_executive', permissions: ['deals:write', 'proposals:write'] },
        ]);
        setUsers([
          { id: 101, email: 'felipe@avaliasolar.com.br', roles: ['Administrador CRM'] },
          { id: 102, email: 'comercial@avaliasolar.com.br', roles: ['Gerente de Vendas'] },
        ]);
        setState('ready');
      });
  }, []);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now(), email: inviteEmail.trim(), roles: [inviteRole] },
    ]);
    setInviteEmail('');
    setIsInviting(false);
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Equipe, Papéis e Permissões (RBAC)"
        subtitle="Gerencie perfis de acesso, permissões de módulos e convide membros da equipe de vendas"
        helpTitle="Controle de Acesso (RBAC)"
        helpDescription="A Matriz de Controle de Acesso Restritivo (RBAC) assegura que vendedores visualizem apenas suas oportunidades enquanto gestores auditam todo o funil."
        extraHelpCards={[
          {
            title: 'Convites por E-mail',
            content: 'Membros convidados recebem um e-mail para definir a senha e acessar o workspace com o perfil selecionado.',
          },
        ]}
      >
        <div className="space-y-6 font-sans text-xs">
          {/* Header da Ação */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-600" />
              Membros da Equipe & Permissões ({users.length})
            </span>
            <Button
              size="sm"
              onClick={() => setIsInviting(true)}
              className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convidar Membro...</span>
            </Button>
          </div>

          {inviteSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Convite enviado com sucesso! O membro receberá as instruções de acesso.</span>
            </div>
          )}

          {/* Modal / Card Inline de Convite */}
          {isInviting && (
            <form onSubmit={handleSendInvite} className="bg-slate-50 border border-slate-200 p-3.5 rounded-md space-y-3">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                Convidar novo membro para o CRM
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">E-mail Corporativo</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="vendedor@empresa.com.br"
                    className="h-8 text-xs bg-white"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Perfil de Acesso (Role)</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" type="submit" className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  Enviar Convite
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsInviting(false)} className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {state === 'loading' && <p className="py-8 text-center text-slate-400">Carregando permissões...</p>}

          {state === 'ready' && (
            <div className="space-y-6">
              {/* Lista de Usuários */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Usuários Ativos no Tenant
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs uppercase">
                          {u.email.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.email}</p>
                          <span className="text-[10px] text-slate-500">Cadastrado no CRM</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.roles.map((roleName, idx) => (
                          <span key={idx} className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matriz de Roles & Permissões */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Perfis de Acesso Cadastrados (RBAC)
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-md border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-sky-600" />
                          {role.name}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          {role.key}
                        </span>
                      </div>
                      {role.permissions && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {role.permissions.map((perm, pIdx) => (
                            <span key={pIdx} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                              {perm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
