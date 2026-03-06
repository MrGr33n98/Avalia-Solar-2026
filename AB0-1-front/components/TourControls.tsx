'use client';

import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { useTour } from '@/providers/TourProvider';

export function TourControls() {
  const { isCompleted, startTour, resetTour } = useTour();

  if (!isCompleted) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={startTour}
        className="gap-2"
      >
        <Play className="h-4 w-4" />
        Iniciar Tour
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={resetTour}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reiniciar
      </Button>
    </div>
  );
}
