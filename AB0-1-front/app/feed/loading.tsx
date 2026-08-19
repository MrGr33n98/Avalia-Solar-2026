import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FeedLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm font-medium">Carregando Avalia Solar Network...</span>
    </div>
  );
}
