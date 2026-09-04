'use client';

import React from 'react';
import {
  MoreVertical,
  ExternalLink,
  Edit,
  PhoneCall,
  CheckSquare,
  Mail,
  UserCheck,
  ArrowRight,
  Trophy,
  XCircle,
  Tag,
  Archive,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PipelineCardDTO } from './OpportunityCard.types';

interface MenuProps {
  card: PipelineCardDTO;
  onOpenDetails: (card: PipelineCardDTO) => void;
  onAction?: (action: string, card: PipelineCardDTO) => void;
}

export const OpportunityCardMenu: React.FC<MenuProps> = ({ card, onOpenDetails, onAction }) => {
  const handleItemClick = (e: React.MouseEvent, actionKey: string) => {
    e.stopPropagation();
    if (actionKey === 'open') {
      onOpenDetails(card);
    } else {
      onAction?.(actionKey, card);
    }
  };

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label={`Ações para oportunidade ${card.name}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'open')}>
            <ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" />
            <span>Abrir Oportunidade</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'edit')}>
            <Edit className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'call')}>
            <PhoneCall className="mr-2 h-3.5 w-3.5 text-emerald-600" />
            <span>Registrar Ligação</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'task')}>
            <CheckSquare className="mr-2 h-3.5 w-3.5 text-indigo-600" />
            <span>Criar Tarefa</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'email')}>
            <Mail className="mr-2 h-3.5 w-3.5 text-sky-600" />
            <span>Enviar E-mail</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'owner')}>
            <UserCheck className="mr-2 h-3.5 w-3.5 text-amber-600" />
            <span>Alterar Responsável</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'move')}>
            <ArrowRight className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Mover Estágio</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'won')}>
            <Trophy className="mr-2 h-3.5 w-3.5 text-emerald-600" />
            <span>Marcar como Ganho</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'lost')}>
            <XCircle className="mr-2 h-3.5 w-3.5 text-red-600" />
            <span>Marcar como Perdido</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'tags')}>
            <Tag className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Gerenciar Tags</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleItemClick(e, 'archive')}>
            <Archive className="mr-2 h-3.5 w-3.5 text-slate-500" />
            <span>Arquivar</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => handleItemClick(e, 'delete')}
            className="text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
