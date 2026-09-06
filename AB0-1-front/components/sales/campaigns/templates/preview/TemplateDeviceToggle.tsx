'use client';

import { Monitor, Smartphone } from 'lucide-react';

interface TemplateDeviceToggleProps {
  device: 'desktop' | 'mobile';
  onChange: (device: 'desktop' | 'mobile') => void;
}

export function TemplateDeviceToggle({ device, onChange }: TemplateDeviceToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-muted p-1 text-xs">
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
          device === 'desktop' ? 'bg-background font-semibold shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Monitor className="h-3.5 w-3.5" />
        Desktop
      </button>

      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
          device === 'mobile' ? 'bg-background font-semibold shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Smartphone className="h-3.5 w-3.5" />
        Mobile
      </button>
    </div>
  );
}
