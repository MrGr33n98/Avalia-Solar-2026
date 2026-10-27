'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Check,
  Copy,
  Edit2,
  MoreHorizontal,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PersonHeaderCardProps {
  contactId: number;
  name: string;
  firstName: string;
  lastName?: string | null;
  jobTitle?: string | null;
  decisionRole?: string | null;
  bio?: string;
  ownerName?: string;
  account?: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
  } | null;
  onUpdateBio: (newBio: string) => Promise<void>;
  onUpdateOwner?: (newOwnerName: string) => Promise<void>;
}

export default function PersonHeaderCard({
  contactId: _contactId,
  name,
  firstName,
  lastName,
  jobTitle,
  decisionRole,
  bio = '',
  ownerName = 'Felipe (Você)',
  account,
  onUpdateBio,
}: PersonHeaderCardProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [currentBio, setCurrentBio] = useState(bio);
  const [savingBio, setSavingBio] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const initials = [firstName[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || name.substring(0, 2).toUpperCase();

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await onUpdateBio(currentBio);
      setIsEditingBio(false);
    } catch {
      // keep editing state on error
    } finally {
      setSavingBio(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-white rounded-b-xl border-x border-b border-slate-200 px-5 py-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Avatar (64px) & Identity */}
        <div className="flex items-start gap-4">
          <div className="relative -mt-10 shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-950 text-white font-bold flex items-center justify-center text-lg shadow-md border-4 border-white tracking-wider">
              {initials}
            </div>
            {isStarred && (
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 p-1 rounded-full shadow-xs">
                <Star className="w-3 h-3 fill-amber-950" />
              </span>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {name}
              </h1>

              <button
                type="button"
                onClick={() => setIsStarred((prev) => !prev)}
                className={`p-1 rounded-md transition ${
                  isStarred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'
                }`}
                title={isStarred ? 'Remover favorito' : 'Marcar como favorito'}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>

              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200/80 text-xs font-semibold px-2 py-0.5">
                {decisionRole || 'Decisor Principal'}
              </Badge>
            </div>

            {/* Job Title & Company */}
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 font-medium">
              {jobTitle && <span className="font-semibold text-slate-800">{jobTitle}</span>}
              {account ? (
                <>
                  <span className="text-slate-400">em</span>
                  <Link
                    href={`/dashboard/sales/accounts/${account.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{account.name}</span>
                  </Link>
                </>
              ) : (
                <span className="text-slate-400 italic">Sem empresa vinculada</span>
              )}
            </p>

            {/* Editable Description / Bio */}
            <div className="pt-1">
              {isEditingBio ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={currentBio}
                    onChange={(e) => setCurrentBio(e.target.value)}
                    placeholder="Adicione um resumo ou bio sobre o contato..."
                    className="text-xs px-2.5 py-1.5 rounded-md border border-indigo-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-md text-slate-800"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5"
                  >
                    {savingBio ? <span className="text-[10px]">Salvando...</span> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentBio(bio);
                      setIsEditingBio(false);
                    }}
                    className="h-7 text-xs text-slate-500 hover:bg-slate-100 px-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBio(true)}
                  className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-700 transition-colors text-left"
                >
                  <span className={bio ? 'text-slate-700 italic' : 'text-slate-400 italic'}>
                    {bio || 'Add description...'}
                  </span>
                  <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Assigned Salesperson & Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {/* Assigned Rep Chip */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-md px-2.5 py-1 text-xs text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-400 text-[11px]">Assigned to:</span>
            <span className="font-semibold text-slate-800">{ownerName}</span>
          </div>

          {/* Action Menu (···) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:bg-slate-50">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copiedLink ? 'Link copiado!' : 'Copiar link do contato'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingBio(true)} className="cursor-pointer gap-2">
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar bio do contato</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 text-indigo-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Enriquecer dados com IA</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
