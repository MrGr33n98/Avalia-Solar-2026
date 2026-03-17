/**
 * DateRangePicker Component
 * 
 * Permite seleção de período para análise de métricas
 * Suporta: 7d, 30d, 90d, custom range
 */

'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRangePreset;
  customRange?: DateRange;
  onChange: (preset: DateRangePreset, customRange?: DateRange) => void;
  className?: string;
}

const PRESET_LABELS = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  'custom': 'Período personalizado',
};

export default function DateRangePicker({
  value,
  customRange,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(customRange);

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsCalendarOpen(true);
    } else {
      onChange(preset);
    }
  };

  const handleCustomRangeApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      onChange('custom', tempDateRange);
      setIsCalendarOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (value === 'custom' && customRange?.from && customRange?.to) {
      return `${format(customRange.from, 'dd/MM/yyyy')} - ${format(customRange.to, 'dd/MM/yyyy')}`;
    }
    return PRESET_LABELS[value];
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[200px]">
          <Calendar className="h-[18px] w-[18px] mr-2" />
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">{PRESET_LABELS['7d']}</SelectItem>
          <SelectItem value="30d">{PRESET_LABELS['30d']}</SelectItem>
          <SelectItem value="90d">{PRESET_LABELS['90d']}</SelectItem>
          <SelectItem value="custom">{PRESET_LABELS['custom']}</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Range Popover */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={value === 'custom' ? '' : 'hidden'}
          >
            <Calendar className="h-[18px] w-[18px]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <CalendarComponent
                mode="single"
                selected={tempDateRange?.from}
                onSelect={(date) =>
                  setTempDateRange((prev) => ({
                    from: date || new Date(),
                    to: prev?.to || new Date(),
                  }))
                }
                locale={ptBR}
                disabled={(date) => date > new Date()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <CalendarComponent
                mode="single"
                selected={tempDateRange?.to}
                onSelect={(date) =>
                  setTempDateRange((prev) => ({
                    from: prev?.from || new Date(),
                    to: date || new Date(),
                  }))
                }
                locale={ptBR}
                disabled={(date) =>
                  date > new Date() || (tempDateRange?.from ? date < tempDateRange.from : false)
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCustomRangeApply}
                disabled={!tempDateRange?.from || !tempDateRange?.to}
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
