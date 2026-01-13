"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type FiltersProps = {
  state: string | null;
  city: string | null;
  rating: number | null;
  verified: boolean;
};

type Props = {
  filters: FiltersProps;
  locationsData: Record<string, Set<string>>;
  categories?: any[];
  onFilterChange: (filterType: string, value: any) => void;
  sort: string;
  onSortChange: (value: string) => void;
};

export default function CompaniesSidebarFilters({ filters, locationsData, onFilterChange, sort, onSortChange }: Props) {
  const states = Object.keys(locationsData).sort();
  const cities = filters.state ? Array.from((locationsData[filters.state] as Set<string>) || []).sort() : [];

  return (
    <div className="lg:w-[320px] flex-shrink-0 relative z-10">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
        <Card className="rounded-xl overflow-visible">
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sort">
                <AccordionTrigger>Ordenar</AccordionTrigger>
                <AccordionContent>
                  <Select value={sort} onValueChange={onSortChange}>
                    <SelectTrigger aria-label="Ordenar">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent className="z-50 w-[240px]">
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
                      <SelectContent className="z-50 w-[240px]">
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
                      <SelectContent className="z-50 w-[240px]">
                        <SelectItem value="">Todas</SelectItem>
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {filters.state && <span>Estado: {filters.state}</span>}
                      {filters.city && <span>Cidade: {filters.city}</span>}
                      {(filters.state || filters.city) && (
                        <Button variant="ghost" size="sm" onClick={() => onFilterChange('state', null)}>Limpar</Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trust">
                <AccordionTrigger>Confiança</AccordionTrigger>
                <AccordionContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Somente verificadas</span>
                      <Switch checked={filters.verified} onCheckedChange={(v) => onFilterChange('verified', v)} />
                    </div>
                    <Button variant="outline" onClick={() => onFilterChange('clearAll', null)}>Limpar tudo</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}