import { useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X, Check, ChevronDown, ChevronUp, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  ProductBrandFilter,
  ProductCategoryFilter,
  ProductCompanyFilter,
  ProductSpecFilterMeta,
  ProductSpecFilterValue,
} from "@/hooks/useProducts"

interface FilterState {
  category: string
  company: string
  brand: string
  priceRange: [number, number]
  sort: string
  specs?: Record<string, ProductSpecFilterValue>
  minRating?: string
  onlyVerified?: boolean
  onlyTested?: boolean
}

interface ProductsFiltersProps {
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  onSpecFilterChange?: (key: string, value: ProductSpecFilterValue) => void
  categories: ProductCategoryFilter[]
  companies: ProductCompanyFilter[]
  brands: ProductBrandFilter[]
  maxPrice: number
  specFiltersMeta?: ProductSpecFilterMeta[]
  activeSpecFilters?: Record<string, ProductSpecFilterValue>
  onClearFilters: () => void
  showSort?: boolean
  totalProducts?: number
  companiesCount?: number
}

const formatCurrencyCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0)

export function ProductsFilters({
  filters,
  onFilterChange,
  onSpecFilterChange,
  categories,
  companies,
  brands,
  maxPrice,
  specFiltersMeta = [],
  activeSpecFilters = {},
  onClearFilters,
  showSort = true,
  totalProducts = 0,
  companiesCount = 0
}: ProductsFiltersProps) {
  const [techOpen, setTechOpen] = useState(false)
  const [brandSearch, setBrandSearch] = useState("")
  const [showAllBrands, setShowAllBrands] = useState(false)

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category])),
    [categories]
  )
  const companyById = useMemo(
    () => new Map(companies.map((company) => [String(company.id), company])),
    [companies]
  )
  const brandById = useMemo(
    () => new Map(brands.map((brand) => [String(brand.id), brand])),
    [brands]
  )
  const specByKey = useMemo(
    () => new Map(specFiltersMeta.map((spec) => [spec.key, spec])),
    [specFiltersMeta]
  )
  
  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.company !== 'all' || 
    filters.brand !== 'all' ||
    filters.priceRange[0] > 0 || 
    (maxPrice > 0 && filters.priceRange[1] < maxPrice) ||
    filters.minRating !== undefined && filters.minRating !== 'all' ||
    filters.onlyVerified === true ||
    filters.onlyTested === true ||
    Object.values(activeSpecFilters || {}).some(v => v !== undefined && v !== null && v !== '' && v !== 'all')

  const handleSpecCheckbox = (key: string, value: ProductSpecFilterValue) => {
    onSpecFilterChange?.(key, value)
  }

  // Filtragem de marcas client-side com base no input de busca
  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
  }, [brands, brandSearch])

  // Limite visual de marcas
  const visibleBrands = useMemo(() => {
    if (showAllBrands || brandSearch) return filteredBrands;
    return filteredBrands.slice(0, 5);
  }, [filteredBrands, showAllBrands, brandSearch])

  const renderSpecFilter = (spec: ProductSpecFilterMeta) => {
    const current = activeSpecFilters[spec.key]
    const label = spec.label || spec.key

    if (spec.type === 'boolean') {
      const isActive = current === true
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
      )
    }

    if (spec.type === 'enum' || spec.type === 'string') {
      return (
        <div key={spec.key} className="space-y-1.5">
          <Label className="text-sm text-slate-700 font-medium">{label}</Label>
          <Select
            value={typeof current === 'string' ? current : 'all'}
            onValueChange={(val) => handleSpecCheckbox(spec.key, val === 'all' ? null : val)}
          >
            <SelectTrigger className="h-9 text-xs border-slate-200">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
              {Array.isArray(spec.options) && spec.options.map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (spec.type === 'decimal' || spec.type === 'integer') {
      const numericOptions = !Array.isArray(spec.options) && typeof spec.options === 'object' ? spec.options : null
      const min = Number(numericOptions?.min ?? 0)
      const max = Number(numericOptions?.max ?? 100)
      const currentRange = Array.isArray(current) ? current : [min, max]

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
      )
    }

    return null
  }

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('category', 'all')}>
              {categoryById.get(filters.category)?.name || 'Categoria'} <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.company !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('company', 'all')}>
              {companyById.get(filters.company)?.name || 'Fornecedor'} <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.brand !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('brand', 'all')}>
              {brandById.get(filters.brand)?.name || 'Marca'} <X className="h-3 w-3" />
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || (maxPrice > 0 && filters.priceRange[1] < maxPrice)) && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('priceRange', [0, maxPrice])}>
              {formatCurrencyCompact(filters.priceRange[0])} - {formatCurrencyCompact(filters.priceRange[1])} <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.minRating !== undefined && filters.minRating !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('minRating', 'all')}>
              {filters.minRating}★+ <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.onlyVerified && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('onlyVerified', false)}>
              Verificados <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.onlyTested && (
            <Badge variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onFilterChange('onlyTested', false)}>
              Testados <X className="h-3 w-3" />
            </Badge>
          )}
          {Object.entries(activeSpecFilters || {}).map(([key, value]) => (
            value !== undefined && value !== null && value !== '' && value !== 'all' ? (
              <Badge key={key} variant="secondary" className="cursor-pointer gap-1 rounded-md bg-slate-100 pr-1 text-slate-700 hover:bg-slate-200" onClick={() => onSpecFilterChange?.(key, null)}>
                {specByKey.get(key)?.label || key}: {Array.isArray(value) ? `${value[0]} - ${value[1]}` : String(value)} <X className="h-3 w-3" />
              </Badge>
            ) : null
          ))}
        </div>
      )}

      {showSort && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="font-bold text-slate-800 text-xs uppercase tracking-wider">Ordenar por</Label>
            <Select value={filters.sort} onValueChange={(val) => onFilterChange('sort', val)}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Mais relevantes</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />

      {/* Tipo de Produto / Categorias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="block text-sm font-extrabold text-slate-900">Tipo de produto</Label>
          <ChevronUp className="h-4 w-4 text-slate-400" />
        </div>
        {categories.length === 0 ? (
          <div className="py-2 text-xs text-slate-400">Nenhuma categoria de produto ativa.</div>
        ) : (
          <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
            {categories.map((category) => {
              const value = String(category.id)
              const isChecked = filters.category === value
              return (
                <div key={category.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Checkbox
                      id={`check-cat-${category.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => onFilterChange('category', checked ? value : 'all')}
                    />
                    <Label htmlFor={`check-cat-${category.id}`} className="cursor-pointer truncate text-sm font-semibold text-slate-500 hover:text-slate-900">
                      {category.name}
                    </Label>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">({category.products_count})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Marca / Brand com busca */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="block text-sm font-extrabold text-slate-900">Marca</Label>
          <ChevronUp className="h-4 w-4 text-slate-400" />
        </div>
        
        {brands.length === 0 ? (
          <div className="py-2 text-xs text-slate-400">Nenhuma marca de produto ativa.</div>
        ) : (
          <div className="space-y-2.5">
            {/* Input de busca de marcas */}
            <Input
              type="text"
              placeholder="Buscar marca..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="h-9 text-xs border-slate-200/80 rounded-lg placeholder-slate-400 focus-visible:ring-blue-500/20"
            />

            <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
              {visibleBrands.map((brand) => {
                const value = String(brand.id)
                const isChecked = filters.brand === value
                return (
                  <div key={brand.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Checkbox
                        id={`check-brand-${brand.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => onFilterChange('brand', checked ? value : 'all')}
                      />
                      <Label htmlFor={`check-brand-${brand.id}`} className="cursor-pointer truncate text-sm font-semibold text-slate-500 hover:text-slate-900">
                        {brand.name}
                      </Label>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">({brand.products_count})</span>
                  </div>
                )
              })}
            </div>

            {filteredBrands.length > 5 && !brandSearch && (
              <button
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showAllBrands ? "Ver menos" : "Ver todos"}
              </button>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Faixa de Preço */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="block text-sm font-extrabold text-slate-900">Faixa de preço</Label>
          <ChevronUp className="h-4 w-4 text-slate-400" />
        </div>
        <div className="pt-2 px-1">
          <Slider
            value={[filters.priceRange[0], filters.priceRange[1]]}
            max={Math.max(maxPrice, 25000)}
            step={100}
            minStepsBetweenThumbs={1}
            onValueChange={(val) => onFilterChange('priceRange', val as [number, number])}
            className="[&_.relative]:bg-blue-600 [&_[role=slider]]:border-blue-600 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-sm"
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
          <span>R$ 0</span>
          <span>R$ 25.000+</span>
        </div>
      </div>

      <Separator />

      {/* Avaliação Mínima */}
      <div className="space-y-3">
        <Label className="block text-sm font-extrabold text-slate-900">Avaliação mínima</Label>
        <div className="grid grid-cols-2 gap-2">
          {["5", "4", "3", "2"].map((val) => {
            const num = Number(val);
            const isSelected = filters.minRating === val;
            
            return (
              <button
                key={val}
                type="button"
                onClick={() => onFilterChange('minRating', isSelected ? 'all' : val)}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-10 border rounded-xl transition-all",
                  isSelected
                    ? "border-blue-600 bg-blue-50/20 text-blue-600 ring-1 ring-blue-600"
                    : "border-slate-200/70 hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < num ? "fill-current" : "text-slate-200 fill-transparent"
                      )}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Toggles inferiores */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label htmlFor="toggle-verified" className="cursor-pointer text-sm font-bold text-slate-800">
              Mostrar apenas verificados
            </Label>
          </div>
          <Switch
            id="toggle-verified"
            checked={!!filters.onlyVerified}
            onCheckedChange={(checked) => onFilterChange('onlyVerified', checked)}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label htmlFor="toggle-tested" className="cursor-pointer text-sm font-bold text-slate-800">
              Produtos testados por especialistas
            </Label>
          </div>
          <Switch
            id="toggle-tested"
            checked={!!filters.onlyTested}
            onCheckedChange={(checked) => onFilterChange('onlyTested', checked)}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <button
          onClick={() => setTechOpen(!techOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-950 transition-colors hover:text-blue-700"
        >
          <span>{techOpen ? "Ocultar filtros técnicos" : "Mostrar filtros técnicos"}</span>
          {techOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {techOpen && (
          <div className="space-y-5 border-t border-slate-100 pt-2 animate-in fade-in duration-200">
            {specFiltersMeta.length === 0 ? (
              <div className="py-2 text-xs text-slate-400">Nenhum atributo técnico carregado.</div>
            ) : (
              specFiltersMeta.map(renderSpecFilter)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

