"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: "proposal" | "client" | "company" | "report";
}

const statusColors = {
  proposal: "bg-primary/10 text-primary",
  client: "bg-accent/10 text-accent",
  company: "bg-secondary/10 text-secondary",
  report: "bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]",
};

interface RecentActivityProps {
  activities?: Activity[];
  className?: string;
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    user: { name: "João Silva", initials: "JS" },
    action: "criou proposta para",
    target: "Empresa Solar Ltda",
    timestamp: "Há 5 minutos",
    type: "proposal",
  },
  {
    id: "2",
    user: { name: "Maria Santos", initials: "MS" },
    action: "atualizou cliente",
    target: "Pedro Oliveira",
    timestamp: "Há 15 minutos",
    type: "client",
  },
  {
    id: "3",
    user: { name: "Carlos Lima", initials: "CL" },
    action: "adicionou empresa",
    target: "EcoEnergy Brasil",
    timestamp: "Há 1 hora",
    type: "company",
  },
  {
    id: "4",
    user: { name: "Ana Costa", initials: "AC" },
    action: "gerou relatório",
    target: "Vendas Mensais",
    timestamp: "Há 2 horas",
    type: "report",
  },
];

export default function RecentActivity({ 
  activities = defaultActivities,
  className 
}: RecentActivityProps) {
  return (
    <div className={cn("clay-card p-6 space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Atividade Recente</h3>
        <Badge variant="outline" className="clay-chip">
          Últimas 24h
        </Badge>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-[hsl(var(--clay-surface-raised))] transition-colors"
          >
            <Avatar className="h-10 w-10">
              {activity.user.avatar && (
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>

            <div
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium",
                statusColors[activity.type]
              )}
            >
              {activity.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
