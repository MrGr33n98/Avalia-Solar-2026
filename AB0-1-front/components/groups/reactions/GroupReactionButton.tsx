'use client';

import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toggleReaction } from '@/lib/api/feed';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GroupReactionButtonProps {
  postId: number;
  initialReacted: boolean;
  initialReactionsCount: number;
  onReactToggle?: (newReacted: boolean, newCount: number) => void;
}

export function GroupReactionButton({
  postId,
  initialReacted,
  initialReactionsCount,
  onReactToggle,
}: GroupReactionButtonProps) {
  const { toast } = useToast();
  const [reacted, setReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialReactionsCount);
  const [isMutating, setIsMutating] = useState(false);

  const handleToggle = async () => {
    if (isMutating) return;

    // Save previous state for rollback
    const prevReacted = reacted;
    const prevCount = count;

    // Optimistic Update
    const nextReacted = !prevReacted;
    const nextCount = nextReacted ? prevCount + 1 : Math.max(0, prevCount - 1);

    setReacted(nextReacted);
    setCount(nextCount);
    setIsMutating(true);

    if (onReactToggle) {
      onReactToggle(nextReacted, nextCount);
    }

    try {
      // API call: toggleReaction expects: reactableType, reactableId, currentActiveState
      // Note: toggleReaction takes (reactableType, reactableId, active)
      // active parameter in toggleReaction is the CURRENT active state before clicking,
      // so if prevReacted is true, it calls DELETE. If prevReacted is false, it calls POST.
      await toggleReaction('GroupPost', postId, prevReacted);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Rollback on error
      setReacted(prevReacted);
      setCount(prevCount);
      if (onReactToggle) {
        onReactToggle(prevReacted, prevCount);
      }

      toast({
        title: 'Não foi possível registrar curtida',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all select-none min-h-[44px] min-w-[100px]",
        reacted
          ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100/70"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      )}
      aria-label={reacted ? "Descurtir publicação" : "Curtir publicação"}
    >
      <ThumbsUp className={cn("h-4 w-4 shrink-0 transition-transform active:scale-125", reacted && "fill-blue-600")} />
      <span>{reacted ? 'Curtido' : 'Curtir'}</span>
    </button>
  );
}
