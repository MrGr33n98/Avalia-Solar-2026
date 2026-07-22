'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IcpNumericInputProps {
  label: string;
  value: number | null;
  onChange: (val: number | null) => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function IcpNumericInput({
  label,
  value,
  onChange,
  placeholder = '0',
  unit,
  min = 0,
  max,
  disabled = false,
}: IcpNumericInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      onChange(null);
      return;
    }
    const val = Number(raw);
    if (!isNaN(val)) {
      let finalVal = val;
      if (min !== undefined) finalVal = Math.max(min, finalVal);
      if (max !== undefined) finalVal = Math.min(max, finalVal);
      onChange(finalVal);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A]">{label}</Label>
      <div className="relative flex items-center">
        <Input
          type="text"
          value={value ?? ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 pr-12 text-xs font-bold rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] focus:ring-1 focus:ring-[#1F5EFF] focus:border-[#1F5EFF] disabled:opacity-50"
          aria-label={label}
        />
        {unit && (
          <span className="absolute right-3 text-[10px] font-bold text-[#526071] uppercase select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
