import { Star, CheckCircle } from "lucide-react"
import Image from "next/image"

interface ProductsHeaderProps {
  totalProducts: number
  selectedCategory?: string
  searchQuery?: string
  onSearchChange?: (value: string) => void
  onClearFilters?: () => void
}

export function ProductsHeader({ 
  totalProducts, 
  selectedCategory = "Todas as categorias"
}: ProductsHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f6fc] via-[#f5f9fd] to-[#f8fafc] border-b border-slate-100 py-10 md:py-12">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-[40%] h-full opacity-35 pointer-events-none">
        <div className="absolute right-[-10%] top-[-20%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 z-10">
        <div className="flex flex-col gap-8">
          
          {/* Lado Esquerdo / Topo: Textos e Selos */}
          <div className="space-y-4 text-left max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
              Encontre com Confiança
            </span>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-[1.15]">
              Produtos solares <span className="text-[#2563eb]">avaliados por especialistas</span>
            </h1>
            
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500 font-semibold">
              Compare, avalie e escolha os melhores produtos para sua instalação solar com base em testes reais e opiniões de quem entende do assunto.
            </p>

            <div className="flex flex-wrap gap-4 pt-1">
              <div className="flex items-center gap-2 text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-sm">
                <CheckCircle className="w-4.5 h-4.5 text-[#2563eb] shrink-0" />
                <span className="text-xs font-bold text-slate-800">Testes aprofundados por especialistas</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-sm">
                <Star className="w-4.5 h-4.5 text-[#2563eb] fill-[#2563eb] shrink-0" />
                <span className="text-xs font-bold text-slate-800">Avaliações reais de instaladores</span>
              </div>
            </div>
          </div>

          {/* Banner centralizado em largura total */}
          <div className="w-full flex justify-center mt-2">
            <div className="w-full max-w-5xl rounded-2xl overflow-hidden bg-white border border-slate-200/50 shadow-sm">
              <img
                src="/images/banner-avalia-solar-product-page.png"
                alt="Banner Avalia Solar"
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

