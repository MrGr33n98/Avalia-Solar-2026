'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Sobre a Avalia Solar</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Nossa Missão</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Conectar consumidores a empresas confiáveis no setor de energia solar, promovendo transparência e sustentabilidade.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nossa Visão</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Ser a principal plataforma de avaliação e conexão no mercado de energia solar do Brasil.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nossos Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Transparência</li>
              <li>Sustentabilidade</li>
              <li>Inovação</li>
              <li>Confiabilidade</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-semibold mb-6">Nossa História</h2>
        <p className="text-lg leading-relaxed">
          A Avalia Solar nasceu da necessidade de criar um ambiente confiável para consumidores
          interessados em energia solar. Nossa plataforma reúne avaliações autênticas e informações
          detalhadas sobre empresas do setor, ajudando brasileiros a fazerem escolhas conscientes
          em sua jornada para a energia limpa.
        </p>
      </div>
    </div>
  );
}