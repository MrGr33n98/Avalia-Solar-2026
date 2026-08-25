import React from 'react';
import { MessageSquare } from 'lucide-react';

export function GroupCommentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
      <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
      <p className="text-xs font-semibold text-slate-500">Nenhum comentário ainda</p>
      <p className="text-[11px] text-slate-400 mt-0.5">Seja o primeiro a iniciar a conversa!</p>
    </div>
  );
}
