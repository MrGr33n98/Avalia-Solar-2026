/**
 * Motor de Catálogo (Produtos e Serviços) - Avalia Solar
 *
 * Gera payloads para os endpoints autenticados do dashboard da empresa:
 *  - POST /api/v1/dashboard/products  (body: { product: {...} })
 *  - POST /api/v1/dashboard/services  (body: { service: {...} })
 * Ambos são escopados em `current_company` (token JWT da empresa), ou seja,
 * todo item nasce atrelado a uma empresa já cadastrada. Este módulo NÃO escreve na API.
 */

const slugify = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const trim = (text, max) => {
  const s = String(text || '').trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…';
};

const FREE_TIER_PRODUCT_IMAGE_LIMIT = 1;

// Kits residenciais padrão (potência em kWp). Preço NUNCA é inventado: sob consulta.
const DEFAULT_KITS_KWP = [3, 5, 8];

const DEFAULT_SERVICES = [
  {
    name: 'Projeto e Instalação de Energia Solar',
    description:
      'Projeto, dimensionamento e instalação completa de sistema fotovoltaico residencial, comercial e rural.'
  },
  {
    name: 'Homologação junto à Concessionária',
    description:
      'Elaboração de projeto e acompanhamento da homologação e do parecer de acesso junto à distribuidora de energia.'
  },
  {
    name: 'Operação e Manutenção (O&M) de Sistemas Solares',
    description:
      'Limpeza de módulos, inspeção elétrica, monitoramento e manutenção preventiva e corretiva do sistema fotovoltaico.'
  }
];

function locationLabel(company) {
  return [company.city, company.state].filter(Boolean).join(' - ');
}

/**
 * Gera produtos (kits) vinculados à empresa. Sempre em `draft` e `on_request`
 * para revisão humana antes de publicar.
 */
function buildProductPayloads(company, options = {}) {
  const kits = options.kitsKwp || DEFAULT_KITS_KWP;
  const panels = company.panelSuppliers || [];
  const inverters = company.inverterSuppliers || [];
  const panelBrand = panels[0];
  const inverterBrand = inverters[0];
  const loc = locationLabel(company);

  return kits.map((kwp) => {
    const brandsText = [panelBrand && `painéis ${panelBrand}`, inverterBrand && `inversor ${inverterBrand}`]
      .filter(Boolean)
      .join(' e ');
    const name = `Kit Solar Residencial ${kwp} kWp`;
    const skuBase = slugify(company.slug || company.name).slice(0, 20).toUpperCase();
    return {
      company_slug: company.slug || slugify(company.name),
      product: {
        name,
        sku: `${skuBase}-KIT-${String(kwp).replace('.', '_')}KWP`,
        short_description: trim(`Kit fotovoltaico de ${kwp} kWp${loc ? ` em ${loc}` : ''}.`, 160),
        description:
          `Kit de energia solar fotovoltaica de ${kwp} kWp para geração própria` +
          (brandsText ? `, com ${brandsText}` : '') +
          `. Valor sob consulta conforme consumo e local de instalação.`,
        price_mode: 'on_request',
        status: 'draft',
        featured: false,
        seo_title: trim(`${name}${loc ? ` em ${loc}` : ''} | ${company.name}`, 60),
        seo_description: trim(
          `${name} da ${company.name}${loc ? ` em ${loc}` : ''}. Solicite orçamento personalizado.`,
          160
        )
      },
      hints: {
        brand_name: panelBrand || inverterBrand || null,
        image_limit: FREE_TIER_PRODUCT_IMAGE_LIMIT,
        note: 'brand_id e category_ids dependem de IDs reais do banco; resolver antes do envio.'
      }
    };
  });
}

/** Gera serviços vinculados à empresa (ativos, sem preço inventado). */
function buildServicePayloads(company, options = {}) {
  const loc = locationLabel(company);
  const coverage = options.coverage || [company.state, company.city].filter(Boolean);
  return DEFAULT_SERVICES.map((svc) => ({
    company_slug: company.slug || slugify(company.name),
    service: {
      name: svc.name,
      slug: slugify(svc.name),
      description: `${svc.description}${loc ? ` Atendimento em ${loc} e região.` : ''}`,
      status: 'active',
      coverage
      // price_from omitido de propósito: não inventamos preço.
    },
    hints: { note: 'category_id depende de ID real; resolver antes do envio.' }
  }));
}

module.exports = { buildProductPayloads, buildServicePayloads, slugify };
