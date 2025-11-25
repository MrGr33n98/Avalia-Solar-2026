'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CareersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Carreiras na Avalia Solar</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg text-center mb-8">
          Junte-se à nossa missão de transformar o setor de energia solar no Brasil.
          Estamos sempre em busca de talentos apaixonados por sustentabilidade e inovação.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por que trabalhar conosco?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✨ Ambiente de trabalho flexível e dinâmico</li>
              <li>🌱 Impacto direto no setor de energia limpa</li>
              <li>📚 Desenvolvimento profissional contínuo</li>
              <li>🤝 Cultura colaborativa e inclusiva</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>🏥 Plano de saúde</li>
              <li>🦷 Plano odontológico</li>
              <li>🎓 Auxílio educação</li>
              <li>💪 Gympass</li>
              <li>🏠 Home office flexível</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-semibold mb-6 text-center">Vagas Abertas</h2>
        <p className="text-center text-lg">
          No momento não temos vagas abertas, mas você pode enviar seu currículo para:
          <br />
          <a href="mailto:carreiras@avaliasolar.com.br" className="text-blue-600 hover:text-blue-800">
            carreiras@avaliasolar.com.br
          </a>
        </p>
      </div>
    </div>
  );
}