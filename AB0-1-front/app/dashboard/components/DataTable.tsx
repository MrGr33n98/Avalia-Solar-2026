"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataItem {
  id: string;
  company: string;
  value: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

const statusConfig = {
  pending: { label: "Pendente", class: "bg-brand-yellow/10 text-yellow-600" },
  approved: { label: "Aprovado", class: "bg-accent/10 text-accent" },
  rejected: { label: "Rejeitado", class: "bg-destructive/10 text-destructive" },
};

interface DataTableProps {
  data?: DataItem[];
  className?: string;
}

const defaultData: DataItem[] = [
  {
    id: "1",
    company: "Empresa Solar Ltda",
    value: "R$ 45.000,00",
    status: "approved",
    date: "10/03/2026",
  },
  {
    id: "2",
    company: "EcoEnergy Brasil",
    value: "R$ 32.500,00",
    status: "pending",
    date: "09/03/2026",
  },
  {
    id: "3",
    company: "Green Power SA",
    value: "R$ 58.200,00",
    status: "approved",
    date: "08/03/2026",
  },
  {
    id: "4",
    company: "Solar Tech",
    value: "R$ 21.000,00",
    status: "rejected",
    date: "07/03/2026",
  },
];

export default function DataTable({ 
  data = defaultData,
  className 
}: DataTableProps) {
  return (
    <div className={cn("clay-card", className)}>
      <div className="p-6 border-b border-[hsl(var(--clay-shadow-light))]">
        <h3 className="text-lg font-semibold">Propostas Recentes</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.company}</TableCell>
              <TableCell>{item.value}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "clay-chip",
                    statusConfig[item.status].class
                  )}
                >
                  {statusConfig[item.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.date}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="clay-card">
                    <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
