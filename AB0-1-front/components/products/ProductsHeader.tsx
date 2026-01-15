import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ProductsHeaderProps {
  totalProducts: number
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function ProductsHeader({ totalProducts, searchQuery, onSearchChange }: ProductsHeaderProps) {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Produtos para Energia Solar</h1>
          <p className="text-muted-foreground mt-1">
            Compare produtos de diferentes fornecedores e encontre a melhor opção para seu projeto.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos por nome, marca ou modelo..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <span>Mostrando {totalProducts} produtos</span>
      </div>
    </div>
  )
}