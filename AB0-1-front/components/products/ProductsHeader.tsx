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
  const categoryLabel =
    selectedCategory && selectedCategory !== "Todas as categorias"
      ? selectedCategory
      : null

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f6fc] via-[#f5f9fd] to-[#f8fafc] border-b border-slate-100 py-12 md:py-16">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-[40%] h-full opacity-35 pointer-events-none">
        <div className="absolute right-[-10%] top-[-20%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 z-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_1fr_0.8fr]">
          
          {/* Lado Esquerdo: Textos e Selos */}
          <div className="space-y-5 text-left">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
              Encontre com Confiança
            </span>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-[1.1]">
              Produtos solares <br/>
              <span className="text-blue-600">avaliados por especialistas</span>
            </h1>
            
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 font-medium">
              Compare, avalie e escolha os melhores produtos para sua instalação solar com base em testes reais e opiniões de quem entende do assunto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center gap-2 text-slate-700 bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Testes aprofundados por especialistas</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                <Star className="w-5 h-5 text-blue-500 fill-blue-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Avaliações reais de instaladores</span>
              </div>
            </div>
          </div>

          {/* Centro: Imagem de Equipamentos */}
          <div className="relative flex items-center justify-center min-h-[220px]">
            <div className="relative w-full max-w-[340px] aspect-[4/3]">
              <Image
                src="/images/banner-avalia-solar-product-page.png"
                alt="Equipamentos Solares Avaliados"
                fill
                priority
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Lado Direito: Card de Estatísticas (Avaliação) */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100/80 border border-slate-100/70 flex flex-col w-full max-w-[300px] mx-auto lg:ml-auto">
            <div className="text-center">
              <span className="text-5xl font-black text-slate-900 leading-none">4.8</span>
              <div className="flex justify-center text-amber-400 mt-2.5 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                Avaliação geral dos <br/> produtos testados
              </p>
            </div>

            {/* Barras de distribuição */}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="w-3">5</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "68%" }} />
                </div>
                <span className="w-7 text-right">68%</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="w-3">4</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "21%" }} />
                </div>
                <span className="w-7 text-right">21%</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="w-3">3</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "7%" }} />
                </div>
                <span className="w-7 text-right">7%</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="w-3">2</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "3%" }} />
                </div>
                <span className="w-7 text-right">3%</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="w-3">1</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "1%" }} />
                </div>
                <span className="w-7 text-right">1%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
