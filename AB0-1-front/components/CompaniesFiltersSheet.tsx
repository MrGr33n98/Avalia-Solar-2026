"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type FiltersProps = {
  state: string | null;
  city: string | null;
  rating: number | null;
  verified: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FiltersProps;
  locationsData: Record<string, Set<string>>;
  sort: string;
  onSortChange: (value: string) => void;
  onFilterChange: (filterType: string, value: any) => void;
  activeCount: number;
  onClearAll: () => void;
};

export default function CompaniesFiltersSheet({ open, onOpenChange, filters, locationsData, sort, onSortChange, onFilterChange, activeCount, onClearAll }: Props) {
  const states = Object.keys(locationsData).sort();
  const cities = filters.state ? Array.from((locationsData[filters.state] as Set<string>) || []).sort() : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filtros ({activeCount})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="sort">
              <AccordionTrigger>Ordenar</AccordionTrigger>
              <AccordionContent>
                <Select value={sort} onValueChange={onSortChange}>
                  <SelectTrigger aria-label="Ordenar">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Nome A–Z</SelectItem>
                    <SelectItem value="name_desc">Nome Z–A</SelectItem>
                    <SelectItem value="rating_desc">Melhor avaliadas</SelectItem>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rating">
              <AccordionTrigger>Avaliações</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {[5,4,3].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onFilterChange('rating', filters.rating === r ? null : r)}
                      className={filters.rating === r ? 'rounded-full border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white' : 'rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700'}
                    >
                      {r}+ estrelas
                    </button>
                  ))}
                  <Button variant="ghost" onClick={() => onFilterChange('rating', null)}>Limpar</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="location">
              <AccordionTrigger>Localização</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Select value={filters.state || ''} onValueChange={(v) => onFilterChange('state', v || null)}>
                    <SelectTrigger aria-label="Estado">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.city || ''} onValueChange={(v) => onFilterChange('city', v || null)} disabled={!filters.state}>
                    <SelectTrigger aria-label="Cidade">
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="trust">
              <AccordionTrigger>Confiança</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Somente verificadas</span>
                  <Switch checked={filters.verified} onCheckedChange={(v) => onFilterChange('verified', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClearAll}>Limpar tudo</Button>
          <Button onClick={() => onOpenChange(false)}>Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}