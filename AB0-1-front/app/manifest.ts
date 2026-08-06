import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'avalia-solar-dashboard',
    name: 'Avalia Solar — Dashboard Empresarial',
    short_name: 'Avalia Solar',
    description: 'Painel empresarial do Avalia Solar: avaliações, leads, ranking e performance.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b1b36',
    theme_color: '#0b1b36',
    categories: ['business', 'productivity', 'utilities'],
    lang: 'pt-BR',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/avalia-solar-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/avalia-solar-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      // TODO(PWA): adicionar ícone maskable 512x512 com safe-zone quando o asset for entregue.
      // {
      //   src: '/icons/avalia-solar-maskable-512x512.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      //   purpose: 'maskable',
      // },
    ],
    shortcuts: [
      {
        name: 'Início',
        short_name: 'Início',
        description: 'Visão geral do dashboard',
        url: '/dashboard?tab=overview',
        icons: [{ src: '/icons/avalia-solar-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Avaliações',
        short_name: 'Avaliações',
        description: 'Gerencie as avaliações da empresa',
        url: '/dashboard?tab=reviews',
        icons: [{ src: '/icons/avalia-solar-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Coletar avaliações',
        short_name: 'Coletar',
        description: 'Formulários e QR Code de coleta',
        url: '/dashboard?tab=review-forms',
        icons: [{ src: '/icons/avalia-solar-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Oportunidades',
        short_name: 'Leads',
        description: 'Oportunidades de negócio',
        url: '/dashboard?tab=leads',
        icons: [{ src: '/icons/avalia-solar-192x192.png', sizes: '192x192' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
