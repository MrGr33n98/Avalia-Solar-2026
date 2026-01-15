import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FilterState {
  category: string
  company: string
  priceRange: [number, number]
  sort: string
}

interface ProductsFiltersProps {
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  categories: string[]
  companies: string[]
  maxPrice: number
  onClearFilters: () => void
}

export function ProductsFilters({
  filters,
  onFilterChange,
  categories,
  companies,
  maxPrice,
  onClearFilters
}: ProductsFiltersProps) {
  
  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.company !== 'all' || 
    filters.priceRange[0] > 0 || 
    (maxPrice > 0 && filters.priceRange[1] < maxPrice);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
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
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => onFilterChange('category', 'all')}>
                    {filters.category} <X className="w-3 h-3 hover:text-red-500" />
                </Badge>
            )}
            {filters.company !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => onFilterChange('company', 'all')}>
                    {filters.company} <X className="w-3 h-3 hover:text-red-500" />
                </Badge>
            )}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => onFilterChange('priceRange', [0, maxPrice])}>
                    R$ {filters.priceRange[0]} - {filters.priceRange[1]} <X className="w-3 h-3 hover:text-red-500" />
                </Badge>
            )}
        </div>
      )}
      
      <Separator />

      {/* Ordenação */}
      <div className="space-y-2">
        <Label>Ordenar por</Label>
        <Select value={filters.sort} onValueChange={(val) => onFilterChange('sort', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categoria */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={filters.category} onValueChange={(val) => onFilterChange('category', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Fornecedor */}
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Select value={filters.company} onValueChange={(val) => onFilterChange('company', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os fornecedores" />
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

      {/* Preço */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Label>Faixa de Preço</Label>
            <span className="text-xs text-muted-foreground">
                R$ {filters.priceRange[0].toFixed(0)} - R$ {filters.priceRange[1].toFixed(0)}
            </span>
        </div>
        <Slider
          defaultValue={[0, maxPrice]}
          value={[filters.priceRange[0], filters.priceRange[1]]}
          max={maxPrice}
          step={10}
          minStepsBetweenThumbs={1}
          onValueChange={(val) => onFilterChange('priceRange', val as [number, number])}
        />
      </div>
    </div>
  )
}