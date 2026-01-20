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
    <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} ${iconClassName}`}>
            <Icon className={`h-6 w-6`} />
          </div>
          {trend && (
            <Badge variant={trend.value > 0 ? 'default' : 'secondary'} className="text-xs">
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
            {value}
          </p>
          {description && (
            <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
