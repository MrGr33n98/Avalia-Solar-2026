import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  iconClassName?: string;
  className?: string;
  isDark?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconClassName,
  className,
  isDark = false
}: StatsCardProps) {
  return (
    <Card className={`${isDark ? 'bg-[#002B4D] border-slate-800' : 'bg-[#002B4D]'} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-[#002B4D]' : 'bg-slate-100'} ${iconClassName}`}>
            <Icon className={`h-6 w-6`} />
          </div>
          {trend && (
            <Badge variant={trend.value > 0 ? 'default' : 'secondary'} className="text-xs">
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-white/40'} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
            {value}
          </p>
          {description && (
            <p className={`text-xs mt-3 ${isDark ? 'text-white/40' : 'text-white/40'}`}>
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
