"use client";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

type Props = {
  count: number;
  sort: string;
  onSortChange: (value: string) => void;
  verified: boolean;
  onToggleVerified: (value: boolean) => void;
  onClearAll: () => void;
  onOpenFilters?: () => void;
  compact?: boolean;
};

export default function CompaniesResultsBar({
  count,
  sort,
  onSortChange,
  verified,
  onToggleVerified,
  onClearAll,
  onOpenFilters,
  compact,
}: Props) {
  return (
    <div className={compact ? "relative z-30 flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2" : "relative z-30 flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3"}>
      <div className="flex items-center gap-3">
        <span className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>{count} empresas encontradas</span>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-600">Somente verificadas</span>
          <Switch checked={verified} onCheckedChange={onToggleVerified} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onOpenFilters && (
          <Button variant="outline" size={compact ? "sm" : "default"} onClick={onOpenFilters} aria-label="Filtrar">
            <Filter className={compact ? "mr-2 h-4 w-4" : "mr-2 h-5 w-5"} />
            Filtrar
          </Button>
        )}
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className={compact ? "h-9 w-40" : "h-10 w-48"} aria-label="Ordenar">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Nome A–Z</SelectItem>
            <SelectItem value="name_desc">Nome Z–A</SelectItem>
            <SelectItem value="rating_desc">Melhor avaliadas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={onClearAll}>Limpar filtros</Button>
      </div>
    </div>
  );
}