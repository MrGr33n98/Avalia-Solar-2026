import Link from 'next/link';
import { Metadata } from 'next';
import { buildApiUrl } from '@/lib/api-config';
import { SEO_CITIES, SeoCity } from '@/lib/constants/seo-cities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const revalidate = 86400; // 24 horas (muda raramente)

export const metadata: Metadata = {
  title: 'Melhores Empresas de Energia Solar e Mobilidade por Cidade | Avalia Solar',
  description: 'Confira os rankings das melhores empresas e instaladores de energia solar e carregadores de veículos elétricos organizados pelas principais cidades do Brasil.',
  alternates: {
    canonical: '/melhores-empresas'
  }
};

interface CategoryData {
  id: number;
  name: string;
  seo_url: string;
  companies_count: number;
}

// Mapeamento de nomes de estados
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins'
};

async function getActiveCategories(): Promise<CategoryData[]> {
  try {
    const res = await fetch(buildApiUrl('categories?per_page=100'), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || json;
    return (Array.isArray(data) ? data : []).filter((cat: any) => Number(cat.companies_count || 0) > 0);
  } catch (error) {
    console.error('Error fetching categories for index page:', error);
    return [];
  }
}

export default async function MelhoresEmpresasIndexPage() {
  const categories = await getActiveCategories();

  // Agrupar cidades por estado
  const citiesByState = SEO_CITIES.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, SeoCity[]>);

  const sortedStates = Object.keys(citiesByState).sort();
  sortedStates.forEach(state => {
    citiesByState[state].sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header da Página */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-blue-600 font-bold tracking-widest text-xs uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            SEO Local e Cobertura Nacional
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none sm:text-5xl">
            Empresas de Energia Solar por Cidade
          </h1>
          <p className="text-lg text-slate-600">
            Selecione uma categoria e sua cidade para encontrar os instaladores de energia solar e fornecedores de recarga elétrica mais bem avaliados da sua região.
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-16">
            {categories.map((category) => (
              <section key={category.id} className="space-y-6">
                
                {/* Título da Categoria */}
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ranking de {category.name}
                  </h2>
                  <div className="flex-grow h-px bg-slate-200"></div>
                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {category.companies_count} empresas ativas
                  </span>
                </div>

                {/* Grid de Estados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedStates.map((state) => (
                    <Card key={state} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-slate-950 font-bold">
                          {STATE_NAMES[state] || state}
                        </CardTitle>
                        <span className="text-xs font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">
                          {state}
                        </span>
                      </CardHeader>
                      <Separator className="bg-slate-100" />
                      <CardContent className="pt-4">
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {citiesByState[state].map((city) => (
                            <li key={city.slug} className="truncate">
                              <Link
                                href={`/melhores-empresas/${category.seo_url}/${state.toLowerCase()}/${city.slug}`}
                                className="text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                              >
                                {city.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="text-slate-400 mb-4 text-6xl font-bold">🏜️</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma categoria ativa encontrada</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Volte mais tarde ou acesse a nossa home para buscar os parceiros credenciados.
            </p>
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="/">Voltar para a Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
