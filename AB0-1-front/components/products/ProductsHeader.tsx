import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ShoppingBag } from "lucide-react"

interface ProductsHeaderProps {
  totalProducts: number
  searchQuery: string
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  selectedCategory?: string
}

export function ProductsHeader({ 
  totalProducts, 
  searchQuery, 
  onSearchChange,
  onClearFilters,
  selectedCategory = "Energia Solar"
}: ProductsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Sync local search state with prop when prop changes
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = () => {
    onSearchChange(localSearch)
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Commercial Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-3 max-w-2xl text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Produtos para Energia Solar
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Compare equipamentos, inversores, módulos, baterias e soluções para encontrar a melhor opção para seu projeto.
          </p>
        </div>
        
        {/* Right side illustration / visual panel */}
        <div className="hidden lg:flex items-center justify-center w-64 h-32 relative bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 p-4 shadow-inner">
          <div className="flex gap-3 items-end">
            <div className="w-12 h-20 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-lg shadow-md flex items-center justify-center text-white font-bold text-xs">INV</div>
            <div className="w-20 h-16 bg-slate-800 rounded-md shadow-md flex flex-wrap gap-1 p-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[8px] h-[6px] bg-blue-400/80 rounded-[1px]"></div>
              ))}
            </div>
            <div className="w-8 h-12 bg-emerald-500 rounded-md shadow-md flex items-center justify-center text-white font-bold text-[10px]">BAT</div>
          </div>
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar produto, marca ou modelo..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="pl-10 h-12 border-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400 text-base shadow-none bg-transparent"
          />
        </div>

        {/* Action Button */}
        <Button onClick={handleSearchSubmit} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm">
          Buscar
        </Button>

        {/* Divider */}
        <div className="hidden md:block w-[1px] h-8 bg-slate-200"></div>

        {/* Results Counter / Info */}
        <div className="flex items-center justify-between md:justify-start gap-4 px-3 py-1">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                {totalProducts} {totalProducts === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                Categoria: {selectedCategory === "all" ? "Energia Solar" : selectedCategory}
              </span>
            </div>
          </div>
          
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={onClearFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  )
}