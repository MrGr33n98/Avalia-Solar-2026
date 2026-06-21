import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search, X } from "lucide-react"

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
  selectedCategory = "Todas as categorias"
}: ProductsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [locationQuery, setLocationQuery] = useState("")

  // Sync local search state with prop when prop changes
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = () => {
    onSearchChange(localSearch.trim())
  }

  const handleClearSearch = () => {
    setLocalSearch("")
    onSearchChange("")
  }

  const resultTerm = localSearch.trim() || searchQuery.trim()
  const resultLabel = totalProducts === 1 ? "resultado" : "resultados"
  const categoryLabel =
    selectedCategory && selectedCategory !== "Todas as categorias"
      ? selectedCategory
      : null

  return (
    <section className="relative isolate overflow-hidden border-b border-[#08284a] bg-[#061b33] text-white">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(135deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -left-20 top-8 h-56 w-56 rotate-45 border border-white/10" />
      <div className="absolute right-10 top-10 h-44 w-44 rotate-45 border border-white/10" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Encontre a empresa certa para você.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg">
          Busque instaladores, produtos ou avaliações na maior plataforma solar do Brasil.
        </p>

        <div className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-lg border border-white/15 bg-white text-left shadow-[0_22px_55px_rgba(0,16,40,0.34)] md:grid-cols-[minmax(0,1fr)_280px_128px]">
          <div className="relative flex h-14 items-center border-b border-slate-200 px-4 md:border-b-0 md:border-r">
            <Search className="h-5 w-5 flex-shrink-0 text-slate-500" />
            <Input
              aria-label="Buscar produto, marca ou modelo"
              placeholder="Buscar produto, marca ou modelo..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="h-full border-none bg-transparent pl-3 pr-9 text-base text-slate-900 shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative flex h-14 items-center border-b border-slate-200 px-4 md:border-b-0 md:border-r">
            <MapPin className="h-5 w-5 flex-shrink-0 text-slate-500" />
            <Input
              aria-label="Buscar por localização"
              placeholder="CEP ou Cidade..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="h-full border-none bg-transparent pl-3 text-base text-slate-900 shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Button
            onClick={handleSearchSubmit}
            className="h-14 rounded-none bg-[#ffbd2e] px-8 text-sm font-semibold text-[#061b33] shadow-none hover:bg-[#ffc84d]"
          >
            Buscar
          </Button>
        </div>

        <p className="mt-7 text-sm text-slate-200">
          {totalProducts} {resultLabel}
          {resultTerm ? (
            <>
              {" "}para <span className="font-semibold text-[#ffbd2e]">&quot;{resultTerm}&quot;</span>
            </>
          ) : categoryLabel ? (
            <>
              {" "}em <span className="font-semibold text-[#ffbd2e]">{categoryLabel}</span>
            </>
          ) : (
            " encontrados"
          )}
        </p>
      </div>
    </section>
  )
}
