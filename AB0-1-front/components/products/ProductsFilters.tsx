import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FilterState {
  category: string
  company: string
  priceRange: [number, number]
  sort: string
  specs?: Record<string, any>
}

interface ProductsFiltersProps {
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  onSpecFilterChange?: (key: string, value: any) => void
  categories: string[]
  companies: string[]
  maxPrice: number
  specFiltersMeta?: any[]
  activeSpecFilters?: Record<string, any>
  onClearFilters: () => void
}

export function ProductsFilters({
  filters,
  onFilterChange,
  onSpecFilterChange,
  categories,
  companies,
  maxPrice,
  specFiltersMeta = [],
  activeSpecFilters = {},
  onClearFilters
}: ProductsFiltersProps) {
  const [techOpen, setTechOpen] = useState(false)
  
  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.company !== 'all' || 
    filters.priceRange[0] > 0 || 
    (maxPrice > 0 && filters.priceRange[1] < maxPrice) ||
    Object.values(activeSpecFilters || {}).some(v => v !== undefined && v !== null && v !== '' && v !== 'all');

  // Static options lists based on mockup
  const aplicacoes = [
    { label: "Residencial", value: "Residencial" },
    { label: "Comercial", value: "Comercial" },
    { label: "Industrial", value: "Industrial" },
    { label: "Rural", value: "Rural" },
    { label: "Usina de solo", value: "Usina de solo" },
    { label: "Off-grid", value: "Off-grid" }
  ]

  const caracteristicas = [
    { label: "Wi-Fi", specKey: "wifi" },
    { label: "App mobile", specKey: "app_mobile" },
    { label: "Garantia estendida", specKey: "garantia_estendida" },
    { label: "Certificado Inmetro", specKey: "inmetro" },
    { label: "Produto premium", specKey: "premium" },
    { label: "Mais vendido", specKey: "mais_vendido" }
  ]

  const handleCategoryCheckbox = (cat: string, checked: boolean) => {
    onFilterChange('category', checked ? cat : 'all')
  }

  const handleSpecCheckbox = (key: string, value: any) => {
    if (onSpecFilterChange) {
      onSpecFilterChange(key, value)
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-slate-900">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200" onClick={() => onFilterChange('category', 'all')}>
              {filters.category} <X className="w-3 h-3 hover:text-red-500" />
            </Badge>
          )}
          {filters.company !== 'all' && (
            <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200" onClick={() => onFilterChange('company', 'all')}>
              {filters.company} <X className="w-3 h-3 hover:text-red-500" />
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200" onClick={() => onFilterChange('priceRange', [0, maxPrice])}>
              R$ {filters.priceRange[0]} - {filters.priceRange[1]} <X className="w-3 h-3 hover:text-red-500" />
            </Badge>
          )}
          {Object.entries(activeSpecFilters || {}).map(([key, value]) => (
            value !== undefined && value !== null && value !== '' && value !== 'all' ? (
              <Badge key={key} variant="secondary" className="gap-1 pr-1 cursor-pointer bg-slate-100 text-slate-800 hover:bg-slate-200" onClick={() => onSpecFilterChange && onSpecFilterChange(key, null)}>
                {key}: {Array.isArray(value) ? `${value[0]} - ${value[1]}` : String(value)} <X className="w-3 h-3 hover:text-red-500" />
              </Badge>
            ) : null
          ))}
        </div>
      )}
      
      <Separator />

      {/* Ordenação */}
      <div className="space-y-2">
        <Label className="font-semibold text-slate-700">Ordenar por</Label>
        <Select value={filters.sort} onValueChange={(val) => onFilterChange('sort', val)}>
          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Mais relevantes</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Fornecedor */}
      <div className="space-y-2">
        <Label className="font-semibold text-slate-700">Fornecedor / Marca</Label>
        <Select value={filters.company} onValueChange={(val) => onFilterChange('company', val)}>
          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200">
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os fornecedores</SelectItem>
            {companies.map((comp) => (
              <SelectItem key={comp} value={comp}>{comp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Preço Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-slate-700">Faixa de preço</Label>
          <span className="text-xs font-medium text-slate-500">
            R$ {filters.priceRange[0]} — R$ {filters.priceRange[1]}
          </span>
        </div>
        <Slider
          defaultValue={[0, maxPrice]}
          value={[filters.priceRange[0], filters.priceRange[1]]}
          max={maxPrice}
          step={100}
          minStepsBetweenThumbs={1}
          onValueChange={(val) => onFilterChange('priceRange', val as [number, number])}
          className="py-1"
        />
      </div>

      <Separator />

      {/* Tipo de produto Checkboxes */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-700 block">Tipo de produto</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isChecked = filters.category === cat;
            return (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox
                  id={`check-cat-${cat}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCategoryCheckbox(cat, !!checked)}
                />
                <Label htmlFor={`check-cat-${cat}`} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-normal">
                  {cat}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Aplicação Checkboxes */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-700 block">Aplicação</Label>
        <div className="space-y-2">
          {aplicacoes.map((app) => {
            const isChecked = activeSpecFilters['aplicacao'] === app.value || activeSpecFilters['aplicação'] === app.value;
            return (
              <div key={app.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`check-app-${app.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    handleSpecCheckbox('aplicacao', checked ? app.value : null);
                    // Clear the portuguese key just in case
                    handleSpecCheckbox('aplicação', null);
                  }}
                />
                <Label htmlFor={`check-app-${app.value}`} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-normal">
                  {app.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Características Checkboxes */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-700 block">Características</Label>
        <div className="space-y-2">
          {caracteristicas.map((carac) => {
            const isChecked = activeSpecFilters[carac.specKey] === true;
            return (
              <div key={carac.specKey} className="flex items-center space-x-2">
                <Checkbox
                  id={`check-carac-${carac.specKey}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleSpecCheckbox(carac.specKey, checked ? true : null)}
                />
                <Label htmlFor={`check-carac-${carac.specKey}`} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-normal">
                  {carac.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Filtros técnicos avançados (Collapsible Section) */}
      <div className="space-y-3">
        <button
          onClick={() => setTechOpen(!techOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <span>{techOpen ? "[-] Filtros técnicos avançados" : "[+] Filtros técnicos avançados"}</span>
          {techOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {techOpen && (
          <div className="space-y-5 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            {specFiltersMeta.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">Nenhum atributo avançado carregado.</div>
            ) : (
              specFiltersMeta
                // Filter out the ones already displayed in main section to avoid repetition
                .filter(spec => !['aplicacao', 'aplicação', 'wifi', 'app_mobile', 'garantia_estendida', 'inmetro', 'premium', 'mais_vendido'].includes(spec.key))
                .map((spec) => {
                  const current = activeSpecFilters[spec.key];
                  const label = spec.label || spec.key;

                  if (spec.type === 'boolean') {
                    const isActive = current === true;
                    return (
                      <div key={spec.key} className="flex items-center justify-between gap-2">
                        <Label className="text-sm text-slate-600 font-normal leading-tight">{label}</Label>
                        <Button
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSpecCheckbox(spec.key, isActive ? null : true)}
                          className="h-8 px-2 text-xs"
                        >
                          {isActive ? 'Sim' : 'Ativar'}
                          <Check className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    );
                  }

                  if (spec.type === 'enum' || spec.type === 'string') {
                    return (
                      <div key={spec.key} className="space-y-1.5">
                        <Label className="text-sm text-slate-700 font-medium">{label}</Label>
                        <Select
                          value={current || 'all'}
                          onValueChange={(val) => handleSpecCheckbox(spec.key, val === 'all' ? null : val)}
                        >
                          <SelectTrigger className="h-9 text-xs border-slate-200">
                            <SelectValue placeholder="Qualquer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Qualquer</SelectItem>
                            {(spec.options || []).map((opt: any) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  if (spec.type === 'decimal' || spec.type === 'integer') {
                    const min = spec.options?.min ?? 0;
                    const max = spec.options?.max ?? 100;
                    const currentRange = Array.isArray(current) ? current : [min, max];

                    return (
                      <div key={spec.key} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <Label className="text-slate-700 font-medium">{label}{spec.unit ? ` (${spec.unit})` : ''}</Label>
                          <span className="font-semibold text-slate-500">
                            {currentRange[0]} - {currentRange[1]}
                          </span>
                        </div>
                        <Slider
                          value={currentRange as [number, number]}
                          min={min}
                          max={max}
                          step={1}
                          minStepsBetweenThumbs={1}
                          onValueChange={(val) => handleSpecCheckbox(spec.key, val as [number, number])}
                          className="py-1"
                        />
                      </div>
                    );
                  }

                  return null;
                })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
