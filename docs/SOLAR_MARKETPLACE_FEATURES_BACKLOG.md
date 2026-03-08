# 🌞 AVALIA SOLAR - Feature Backlog Completo
## Baseado em Best Practices de G2 Marketplace
**Data**: 08 de Março de 2026  
**Versão**: 1.0

---

## 📋 ÍNDICE

1. [Features P0 - Critical (Q1 2026)](#p0-critical)
2. [Features P1 - High Priority (Q2 2026)](#p1-high-priority)
3. [Features P2 - Medium Priority (Q3 2026)](#p2-medium-priority)
4. [Features P3 - Low Priority (Q4 2026)](#p3-low-priority)
5. [Matriz de Priorização](#matriz-de-priorizacao)
6. [Roadmap Visual](#roadmap-visual)

---

## 🔴 P0 - CRITICAL {#p0-critical}

### US-001: Calculadora de ROI Solar em Tempo Real

**Epic**: Lead Generation & Qualification  
**Prioridade**: P0 - CRÍTICO  
**Esforço**: 1 Sprint (2 semanas)  
**Impact**: 🔥🔥🔥 - Aumento de conversão +40%

#### 📝 User Story
```
Como um VISITANTE interessado em energia solar
Quero calcular quanto vou economizar com um sistema solar
Para decidir se vale a pena investir e qual empresa contratar
```

#### 🎯 Acceptance Criteria

**Inputs do Usuário:**
- [ ] Conta de luz mensal média (R$)
- [ ] CEP / Cidade (para irradiação solar)
- [ ] Tipo de propriedade (residencial, comercial, industrial, rural)
- [ ] Área disponível para painéis (m² ou "não sei")
- [ ] Tipo de telhado (cerâmica, metálico, laje, solo, não sei)

**Cálculos Automáticos:**
- [ ] Consumo médio mensal (kWh)
- [ ] Potência recomendada do sistema (kWp)
- [ ] Custo estimado de instalação (faixa)
- [ ] Economia mensal projetada (R$ e %)
- [ ] Payback time (meses)
- [ ] Economia em 25 anos (total)
- [ ] CO₂ evitado em 25 anos (toneladas)
- [ ] Equivalente em árvores plantadas

**Outputs Visuais:**
- [ ] Gráfico de economia acumulada ao longo de 25 anos
- [ ] Comparação: com solar vs sem solar
- [ ] Indicador de payback com linha do tempo
- [ ] Badge visual: "Economia de X% na conta de luz"

**Lead Capture:**
- [ ] Botão "Receber Orçamentos" salva calculadora + usuário
- [ ] Lead score automático baseado em orçamento e consumo
- [ ] Email automático: "Suas 3 melhores opções de empresas"

**Analytics Tracking:**
- [ ] GTM event: `calculator_started`
- [ ] GTM event: `calculator_completed` (with params)
- [ ] GTM event: `quote_request_from_calculator`
- [ ] Mixpanel funnel: calculator → quote request → conversion

#### 🛠️ Technical Implementation

**Frontend** (`AB0-1-front`)
```typescript
// File: app/calculadora-solar/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { track } from '@/lib/analytics/lazy';

const calculatorSchema = z.object({
  monthlyBill: z.number().min(50, 'Mínimo R$50').max(100000, 'Máximo R$100.000'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'rural']),
  availableArea: z.number().optional(),
  roofType: z.enum(['ceramic', 'metal', 'slab', 'ground', 'unknown']).optional(),
});

type CalculatorForm = z.infer<typeof calculatorSchema>;

export default function SolarCalculatorPage() {
  const [result, setResult] = useState<SolarCalculatorResult | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
  });

  const onSubmit = async (data: CalculatorForm) => {
    track('calculator_started', { propertyType: data.propertyType });
    
    const response = await fetch('/api/v1/solar-calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const calculatorResult = await response.json();
    setResult(calculatorResult);
    
    track('calculator_completed', {
      monthlyBill: data.monthlyBill,
      estimatedSystemSize: calculatorResult.recommendedPowerKwp,
      paybackMonths: calculatorResult.paybackMonths,
      totalSavings25Years: calculatorResult.totalSavings25Years,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">
        Calculadora de Economia Solar ☀️
      </h1>
      
      {!result ? (
        <CalculatorForm onSubmit={handleSubmit(onSubmit)} register={register} errors={errors} />
      ) : (
        <CalculatorResults result={result} />
      )}
    </div>
  );
}
```

**Backend API** (`AB0-1-back`)
```ruby
# File: app/controllers/api/v1/solar_calculator_controller.rb
module Api
  module V1
    class SolarCalculatorController < ApplicationController
      skip_before_action :authenticate_user!, only: [:calculate]
      
      def calculate
        calculator = SolarCalculator.new(calculator_params)
        result = calculator.calculate
        
        # Log para analytics
        Rails.logger.info("[SolarCalculator] Calculation completed: #{result.to_json}")
        
        # Salvar lead se houver interesse
        if params[:request_quotes]
          lead = Lead.create!(
            email: params[:email],
            phone: params[:phone],
            calculator_data: result,
            lead_score: calculator.lead_score,
            source: 'solar_calculator'
          )
          
          # Job assíncrono: match com empresas e envio de emails
          MatchCompaniesJob.perform_later(lead.id)
        end
        
        render json: result, status: :ok
      rescue => e
        Sentry.capture_exception(e)
        render json: { error: 'Erro ao calcular' }, status: :unprocessable_entity
      end
      
      private
      
      def calculator_params
        params.require(:calculator).permit(
          :monthly_bill, :zip_code, :property_type, 
          :available_area, :roof_type
        )
      end
    end
  end
end
```

**Service Object**
```ruby
# File: app/services/solar_calculator.rb
class SolarCalculator
  include ActiveModel::Model
  
  attr_accessor :monthly_bill, :zip_code, :property_type, :available_area, :roof_type
  
  validates :monthly_bill, presence: true, numericality: { greater_than: 0 }
  validates :zip_code, presence: true, format: { with: /\A\d{5}-?\d{3}\z/ }
  validates :property_type, inclusion: { in: %w[residential commercial industrial rural] }
  
  def calculate
    {
      # Inputs
      monthly_bill: monthly_bill,
      property_type: property_type,
      
      # Consumption
      average_monthly_kwh: calculate_monthly_kwh,
      
      # System sizing
      recommended_power_kwp: calculate_recommended_power,
      estimated_panels: calculate_panel_count,
      required_area_m2: calculate_required_area,
      
      # Costs
      estimated_investment_min: calculate_investment(:min),
      estimated_investment_max: calculate_investment(:max),
      
      # Savings
      monthly_savings_reais: calculate_monthly_savings,
      monthly_savings_percent: calculate_savings_percent,
      payback_months: calculate_payback,
      
      # Long term
      total_savings_25_years: calculate_total_savings(25),
      co2_avoided_tons: calculate_co2_avoided,
      trees_equivalent: calculate_trees_equivalent,
      
      # Location data
      solar_irradiation_kwh_m2_day: get_solar_irradiation,
      city: get_city_from_zip,
      state: get_state_from_zip,
    }
  end
  
  def lead_score
    score = 0
    
    # Orçamento (0-40 pontos)
    score += case monthly_bill.to_f
    when 0..200 then 10
    when 201..500 then 20
    when 501..1000 then 30
    else 40
    end
    
    # Tipo de propriedade (0-30 pontos)
    score += case property_type
    when 'residential' then 20
    when 'commercial' then 30
    when 'industrial' then 30
    when 'rural' then 15
    end
    
    # Área disponível conhecida (0-15 pontos)
    score += 15 if available_area.present?
    
    # Tipo de telhado conhecido (0-15 pontos)
    score += 15 if roof_type.present? && roof_type != 'unknown'
    
    score # 0-100
  end
  
  private
  
  def calculate_monthly_kwh
    # Tarifa média Brasil: R$0,80/kWh (ajustar por região)
    tariff = get_regional_tariff
    (monthly_bill.to_f / tariff).round(2)
  end
  
  def calculate_recommended_power
    # Regra: gerar 100% do consumo médio
    # Horas de sol útil: ~5h/dia (média Brasil)
    monthly_kwh = calculate_monthly_kwh
    daily_kwh = monthly_kwh / 30
    hours_useful_sun = 5.0
    
    (daily_kwh / hours_useful_sun * 1.25).round(2) # +25% margem
  end
  
  def calculate_panel_count
    kwp = calculate_recommended_power
    panel_power = 0.55 # 550W por painel (padrão atual)
    (kwp / panel_power).ceil
  end
  
  def calculate_required_area
    # Painel 550W: ~2.5m² cada
    panel_count = calculate_panel_count
    (panel_count * 2.5 * 1.3).round(2) # +30% espaçamento
  end
  
  def calculate_investment(range)
    kwp = calculate_recommended_power
    
    # Preço médio por kWp (varia por região e porte)
    price_per_kwp = case property_type
    when 'residential'
      range == :min ? 4500 : 6000
    when 'commercial'
      range == :min ? 4000 : 5500
    when 'industrial'
      range == :min ? 3800 : 5200
    when 'rural'
      range == :min ? 4200 : 5800
    end
    
    (kwp * price_per_kwp).round(2)
  end
  
  def calculate_monthly_savings
    monthly_kwh = calculate_monthly_kwh
    kwp = calculate_recommended_power
    
    # Geração mensal esperada (kWh)
    hours_sun_month = 150 # 5h/dia * 30 dias
    generation_month = kwp * hours_sun_month * 0.8 # 80% eficiência
    
    # Economia = mínimo entre consumo e geração
    saved_kwh = [monthly_kwh, generation_month].min
    tariff = get_regional_tariff
    
    (saved_kwh * tariff).round(2)
  end
  
  def calculate_savings_percent
    savings = calculate_monthly_savings
    ((savings / monthly_bill.to_f) * 100).round(1)
  end
  
  def calculate_payback
    investment = calculate_investment(:average)
    monthly_savings = calculate_monthly_savings
    
    return 0 if monthly_savings <= 0
    
    (investment / monthly_savings).ceil
  end
  
  def calculate_total_savings(years)
    monthly_savings = calculate_monthly_savings
    investment = calculate_investment(:average)
    
    # Considerar: inflação energética 5%/ano, degradação painéis 0.5%/ano
    total = 0
    (1..years * 12).each do |month|
      year = (month / 12.0).ceil
      adjusted_savings = monthly_savings * (1.05 ** year) * (0.995 ** year)
      total += adjusted_savings
    end
    
    (total - investment).round(2)
  end
  
  def calculate_co2_avoided
    monthly_kwh = calculate_monthly_kwh
    # Brasil: ~0.075 kg CO₂/kWh (matriz limpa)
    co2_kg_per_kwh = 0.075
    years = 25
    
    (monthly_kwh * 12 * years * co2_kg_per_kwh / 1000).round(2) # toneladas
  end
  
  def calculate_trees_equivalent
    co2_tons = calculate_co2_avoided
    # 1 árvore absorve ~20kg CO₂/ano ao longo de 20 anos = 400kg total
    (co2_tons * 1000 / 400).round(0)
  end
  
  def get_solar_irradiation
    # Integração futura com API do CRESESB
    # Por enquanto: média Brasil por região
    state = get_state_from_zip
    
    SOLAR_IRRADIATION_BY_STATE[state] || 5.0 # kWh/m²/dia
  end
  
  def get_regional_tariff
    state = get_state_from_zip
    ENERGY_TARIFF_BY_STATE[state] || 0.80 # R$/kWh
  end
  
  def get_city_from_zip
    # Via API ViaCEP ou cache local
    ViaCepService.fetch(zip_code)[:city]
  end
  
  def get_state_from_zip
    ViaCepService.fetch(zip_code)[:state]
  end
  
  SOLAR_IRRADIATION_BY_STATE = {
    'SP' => 5.0, 'MG' => 5.5, 'RJ' => 4.8, 'BA' => 6.0, 
    'RS' => 4.5, 'PR' => 4.7, 'SC' => 4.3, # ...
  }.freeze
  
  ENERGY_TARIFF_BY_STATE = {
    'SP' => 0.82, 'MG' => 0.78, 'RJ' => 0.95, 'BA' => 0.70,
    'RS' => 0.75, 'PR' => 0.80, 'SC' => 0.77, # ...
  }.freeze
end
```

#### 📊 Success Metrics

**KPIs Principais:**
- Completion Rate: meta 60% (iniciaram → completaram)
- Quote Request Rate: meta 25% (completaram → solicitaram orçamento)
- Lead Quality Score: média 70+ pontos
- Time to Complete: meta <2 minutos

**Tracking:**
```javascript
// GTM DataLayer
dataLayer.push({
  event: 'calculator_completed',
  calculator_type: 'solar_roi',
  monthly_bill: 350,
  system_size_kwp: 4.5,
  payback_months: 54,
  total_savings_25y: 125000,
  lead_score: 75,
});
```

#### 🔄 Dependencies
- [ ] ViaCEP integration (já existe?)
- [ ] CRESESB API integration (opcional - usar fallback)
- [ ] Lead model + scoring system
- [ ] Email templates for quote requests
- [ ] Company matching algorithm

#### 📝 Technical Notes
- Cache de CEP: Redis com TTL 7 dias
- Rate limiting: 10 cálculos/IP/hora
- Progressive enhancement: funciona sem JS (SSR)
- Mobile-first: 80% dos usuários mobile

---

### US-002: Dashboard de Performance para Empresas

**Epic**: Analytics & Insights  
**Prioridade**: P0 - CRITICAL (já existe - melhorar)  
**Esforço**: 1 Sprint (2 semanas)  
**Impact**: 🔥🔥🔥 - Retenção de clientes +35%

#### 📝 User Story
```
Como EMPRESA instaladora cadastrada
Quero ver métricas detalhadas de performance do meu perfil
Para entender o ROI da minha presença no marketplace e otimizar resultados
```

#### 🎯 Acceptance Criteria

**Dashboard Principal (Overview):**
- [ ] Card: Visualizações de perfil (hoje, 7d, 30d, 90d)
- [ ] Card: Leads recebidos (total, novos hoje, taxa de conversão)
- [ ] Card: Cliques em CTAs (total, email, telefone, site, WhatsApp)
- [ ] Card: Posição no ranking (categoria, região, geral)
- [ ] Gráfico de linha: evolução de visualizações (30 dias)
- [ ] Gráfico de barras: CTAs por tipo (30 dias)

**Seção de Leads:**
- [ ] Tabela de leads recebidos (últimos 50)
- [ ] Filtros: status, data, origem, lead score
- [ ] Detalhes do lead: nome, email, telefone, mensagem, score
- [ ] Badge de qualidade: "Lead Quente 🔥" (score >70)
- [ ] Ações: marcar como contactado, converter, descartar
- [ ] Lead pipeline: novo → contactado → proposta → fechado → perdido

**Seção de Reviews:**
- [ ] Listagem de reviews recebidas (todas)
- [ ] Rating médio destacado (ex: 4.7 ⭐)
- [ ] Responder review (inline)
- [ ] Filtro: rating, data, verificadas
- [ ] Badge "Nova review" (últimas 7 dias)

**Seção de Comparação:**
- [ ] Benchmark com concorrentes na mesma região
- [ ] Métricas: rating médio, número de reviews, visualizações
- [ ] Ranking de categoria (ex: "5º lugar em SP")
- [ ] Insights: "Você tem 30% menos reviews que a média"

**Seção de Otimização (Dicas):**
- [ ] Checklist: completude do perfil (0-100%)
- [ ] Sugestões automáticas: "Adicione 3 fotos de instalações"
- [ ] Alert: "Responda 2 reviews pendentes"
- [ ] Tips: "Empresas com vídeo recebem 40% mais leads"

**Filtros de Período:**
- [ ] Dropdown: Hoje, 7 dias, 30 dias, 90 dias, Custom range
- [ ] Date picker para range customizado
- [ ] Comparar com período anterior (ex: vs. 30 dias anteriores)

**Exports:**
- [ ] Botão: Exportar relatório (PDF)
- [ ] Botão: Exportar dados (CSV)
- [ ] Email agendado: relatório semanal automático

#### 🛠️ Technical Implementation

**Enhancements no Dashboard Existente:**
```typescript
// File: AB0-1-front/app/dashboard/components/PerformanceMetrics.tsx
// (Já existe - adicionar features faltantes)

// 1. Lead Pipeline Visualization
<LeadPipelineChart 
  data={companyAnalytics.leadPipeline}
  period={selectedPeriod}
/>

// 2. Competitive Benchmark Card
<BenchmarkCard
  companyMetrics={companyAnalytics.metrics}
  categoryAverage={companyAnalytics.categoryBenchmark}
  regionAverage={companyAnalytics.regionBenchmark}
/>

// 3. Profile Completeness Widget
<ProfileCompletenessWidget
  score={companyAnalytics.profileCompleteness}
  suggestions={companyAnalytics.suggestions}
/>
```

**Backend - New Endpoints:**
```ruby
# File: app/controllers/api/v1/company_analytics_controller.rb
module Api
  module V1
    class CompanyAnalyticsController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_company_access
      
      # GET /api/v1/companies/:id/analytics/overview
      def overview
        analytics = CompanyAnalyticsService.new(@company, period_params)
        
        render json: {
          overview: analytics.overview,
          charts: analytics.charts_data,
          benchmark: analytics.benchmark,
          suggestions: analytics.optimization_suggestions,
        }
      end
      
      # GET /api/v1/companies/:id/analytics/leads
      def leads
        leads = @company.leads
          .includes(:lead_actions)
          .where(created_at: period_range)
          .order(created_at: :desc)
          .page(params[:page])
        
        render json: {
          leads: LeadSerializer.new(leads).serializable_hash,
          pipeline: calculate_pipeline_stats(leads),
          conversion_rate: calculate_conversion_rate(leads),
        }
      end
      
      # GET /api/v1/companies/:id/analytics/benchmark
      def benchmark
        render json: CompanyBenchmarkService.new(@company).calculate
      end
      
      # POST /api/v1/companies/:id/analytics/export
      def export
        format = params[:format] # 'pdf' or 'csv'
        
        job = ExportAnalyticsJob.perform_later(
          company_id: @company.id,
          period: period_params,
          format: format,
          user_email: current_user.email
        )
        
        render json: { job_id: job.job_id, status: 'processing' }
      end
      
      private
      
      def period_params
        {
          start_date: params[:start_date] || 30.days.ago,
          end_date: params[:end_date] || Date.today,
        }
      end
      
      def period_range
        period_params[:start_date]..period_params[:end_date]
      end
      
      def authorize_company_access
        @company = Company.find(params[:company_id])
        
        unless current_user.can_manage?(@company)
          render json: { error: 'Unauthorized' }, status: :forbidden
        end
      end
    end
  end
end
```

**Service: Company Benchmark**
```ruby
# File: app/services/company_benchmark_service.rb
class CompanyBenchmarkService
  def initialize(company)
    @company = company
  end
  
  def calculate
    {
      company_metrics: company_metrics,
      category_average: category_average,
      region_average: region_average,
      ranking: calculate_rankings,
      insights: generate_insights,
    }
  end
  
  private
  
  def company_metrics
    {
      rating: @company.average_rating,
      reviews_count: @company.reviews.count,
      profile_views_30d: @company.profile_views_last_30_days,
      leads_30d: @company.leads_last_30_days,
      response_rate: @company.review_response_rate,
      profile_completeness: @company.profile_completeness_score,
    }
  end
  
  def category_average
    category_companies = Company.where(category_id: @company.category_id)
    
    {
      avg_rating: category_companies.average(:average_rating),
      avg_reviews: category_companies.average('reviews_count'),
      avg_views_30d: category_companies.average('profile_views_30d'),
      avg_leads_30d: category_companies.average('leads_30d'),
    }
  end
  
  def region_average
    # Similar to category_average but filtered by state
    state_companies = Company.where(state: @company.state)
    
    {
      avg_rating: state_companies.average(:average_rating),
      avg_reviews: state_companies.average('reviews_count'),
      # ...
    }
  end
  
  def calculate_rankings
    {
      category_rank: calculate_category_rank,
      region_rank: calculate_region_rank,
      overall_rank: calculate_overall_rank,
      total_competitors_category: Company.where(category_id: @company.category_id).count,
      total_competitors_region: Company.where(state: @company.state).count,
    }
  end
  
  def calculate_category_rank
    # Rank based on: rating * reviews_count * leads_conversion_rate
    Company
      .where(category_id: @company.category_id)
      .where('(average_rating * reviews_count * leads_conversion_rate) > ?', @company.rank_score)
      .count + 1
  end
  
  def generate_insights
    insights = []
    
    cm = company_metrics
    ca = category_average
    
    # Reviews insight
    if cm[:reviews_count] < ca[:avg_reviews] * 0.7
      insights << {
        type: 'warning',
        category: 'reviews',
        message: "Você tem #{((1 - cm[:reviews_count]/ca[:avg_reviews]) * 100).round}% menos reviews que a média da categoria",
        action: 'Incentive clientes satisfeitos a deixarem reviews',
        impact: 'high',
      }
    end
    
    # Profile completeness
    if cm[:profile_completeness] < 80
      insights << {
        type: 'tip',
        category: 'profile',
        message: 'Seu perfil está apenas #{cm[:profile_completeness]}% completo',
        action: 'Complete seu perfil para receber mais leads',
        impact: 'high',
      }
    end
    
    # Response rate
    if cm[:response_rate] < 70
      insights << {
        type: 'warning',
        category: 'engagement',
        message: 'Sua taxa de resposta a reviews está abaixo da média',
        action: 'Responda todas as reviews para aumentar confiança',
        impact: 'medium',
      }
    end
    
    # Positive insight
    if cm[:rating] > ca[:avg_rating]
      insights << {
        type: 'success',
        category: 'rating',
        message: "Parabéns! Seu rating está #{((cm[:rating] / ca[:avg_rating] - 1) * 100).round}% acima da média",
        action: 'Continue o ótimo trabalho!',
        impact: 'positive',
      }
    end
    
    insights
  end
end
```

#### 📊 Success Metrics

**Adoção:**
- DAU (Daily Active Users - empresas): meta 40%
- WAU (Weekly): meta 70%
- Feature usage: meta 80% usam lead tracking

**Engagement:**
- Tempo médio na dashboard: meta 5+ minutos
- Exportações/mês: meta 30% das empresas
- Respostas a reviews via dashboard: meta 60%

**Business Impact:**
- Retenção de empresas MoM: +35%
- Upgrade para planos premium: +20%
- Churn rate: <5%/mês

---

### US-003: Sistema de Badges e Reconhecimento

**Epic**: Trust & Social Proof  
**Prioridade**: P0 - CRITICAL  
**Esforço**: 1 Sprint (2 semanas)  
**Impact**: 🔥🔥🔥 - Confiança +60%, CTR +25%

#### 📝 User Story
```
Como VISITANTE procurando empresa de energia solar
Quero ver badges e certificações das empresas
Para escolher uma empresa confiável e qualificada
```

#### 🎯 Acceptance Criteria

**Tipos de Badges:**

**1. Badges de Verificação:**
- [ ] ✓ Instalação Verificada (reviews com proof)
- [ ] ✓ CNPJ Verificado
- [ ] ✓ Empresa Ativa (SINTEGRA)
- [ ] ✓ Documentação Completa

**2. Badges de Certificação:**
- [ ] 🏆 Integrador Autorizado (por fabricante)
- [ ] 🏆 Certificação INMETRO
- [ ] 🏆 Membro ABGD (Associação Brasileira de Geração Distribuída)
- [ ] 🏆 Certificação Fabricante (BYD, Canadian Solar, Growatt, etc)

**3. Badges de Performance:**
- [ ] ⭐ Top Rated 2026 (rating >4.5, 20+ reviews)
- [ ] ⭐ Líder de Categoria [Estado]
- [ ] ⭐ Top 10 Instaladores [Região]
- [ ] ⭐ Crescimento Rápido (+100% YoY)

**4. Badges de Experiência:**
- [ ] 📅 5+ Anos no Mercado
- [ ] 📅 10+ Anos no Mercado
- [ ] 📊 100+ Instalações Realizadas
- [ ] 📊 500+ Instalações Realizadas
- [ ] 📊 1000+ Instalações Realizadas

**5. Badges de Confiança:**
- [ ] 💬 Alta Taxa de Resposta (>80%)
- [ ] 💬 Responde em <24h
- [ ] ⚡ Instalação Rápida (<30 dias)
- [ ] 🛡️ Garantia Estendida (>10 anos)

**Exibição dos Badges:**
- [ ] Card de empresa: mostrar até 3 badges principais
- [ ] Profile page: mostrar todos badges ganhos
- [ ] Tooltip com explicação ao hover
- [ ] Filtro de busca: "Mostrar apenas empresas com badge X"
- [ ] Badge highlight: animação sutil ao carregar

**Admin - Gerenciamento de Badges:**
- [ ] CRUD de badges (criar, editar, desativar)
- [ ] Critérios automáticos (script que atribui badges)
- [ ] Aprovação manual (para certificações)
- [ ] Upload de documentos comprobatórios
- [ ] Histórico de badges conquistados/removidos

**Gamification:**
- [ ] Notificação: "Parabéns! Você ganhou o badge [nome]"
- [ ] Email: explicação do badge e impacto esperado
- [ ] Progress bar: "Faltam 5 instalações para o próximo badge"

#### 🛠️ Technical Implementation

**Database Migration:**
```ruby
# File: db/migrate/20260310000000_create_badges_system.rb
class CreateBadgesSystem < ActiveRecord::Migration[7.0]
  def change
    create_table :badges do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :category, null: false # verification, certification, performance, experience, trust
      t.text :description
      t.string :icon_url
      t.string :color # hex color
      t.integer :priority, default: 0 # for sorting
      t.boolean :active, default: true
      t.json :criteria # automatic criteria
      t.boolean :requires_manual_approval, default: false
      
      t.timestamps
      
      t.index :slug, unique: true
      t.index :category
      t.index [:active, :priority]
    end
    
    create_table :company_badges do |t|
      t.references :company, null: false, foreign_key: true
      t.references :badge, null: false, foreign_key: true
      t.date :awarded_at, null: false
      t.date :expires_at # optional
      t.string :proof_url # link to certificate/document
      t.string :awarded_by # 'system' or admin user_id
      t.text :notes
      
      t.timestamps
      
      t.index [:company_id, :badge_id], unique: true
      t.index :awarded_at
    end
  end
end
```

**Badge Model:**
```ruby
# File: app/models/badge.rb
class Badge < ApplicationRecord
  has_many :company_badges, dependent: :destroy
  has_many :companies, through: :company_badges
  
  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :category, inclusion: { 
    in: %w[verification certification performance experience trust] 
  }
  
  CATEGORIES = {
    'verification' => 'Verificação',
    'certification' => 'Certificação',
    'performance' => 'Performance',
    'experience' => 'Experiência',
    'trust' => 'Confiança',
  }.freeze
  
  scope :active, -> { where(active: true) }
  scope :by_priority, -> { order(priority: :desc) }
  scope :by_category, ->(category) { where(category: category) }
  
  def self.automatic_badges
    where(requires_manual_approval: false)
  end
  
  def self.manual_badges
    where(requires_manual_approval: true)
  end
  
  # Check if company qualifies for this badge
  def company_qualifies?(company)
    return false unless active?
    return false if criteria.blank?
    
    # Example criteria structure:
    # {
    #   "min_rating": 4.5,
    #   "min_reviews": 20,
    #   "min_installations": 100,
    #   "years_in_business": 5
    # }
    
    criteria.all? do |criterion, value|
      case criterion
      when 'min_rating'
        company.average_rating >= value
      when 'min_reviews'
        company.reviews.count >= value
      when 'min_installations'
        company.installations_count >= value
      when 'years_in_business'
        company.years_in_business >= value
      when 'response_rate'
        company.review_response_rate >= value
      else
        true
      end
    end
  end
end
```

**Service: Badge Awarding**
```ruby
# File: app/services/badge_awarding_service.rb
class BadgeAwardingService
  def self.evaluate_company(company)
    new(company).evaluate
  end
  
  def self.evaluate_all_companies
    Company.find_each do |company|
      evaluate_company(company)
    end
  end
  
  def initialize(company)
    @company = company
  end
  
  def evaluate
    automatic_badges = Badge.automatic_badges.active
    
    automatic_badges.each do |badge|
      if badge.company_qualifies?(@company)
        award_badge(badge) unless @company.has_badge?(badge)
      else
        remove_badge(badge) if @company.has_badge?(badge)
      end
    end
  end
  
  private
  
  def award_badge(badge)
    CompanyBadge.create!(
      company: @company,
      badge: badge,
      awarded_at: Date.today,
      awarded_by: 'system'
    )
    
    # Notify company
    BadgeAwardedNotification.with(badge: badge).deliver(@company.users)
    
    Rails.logger.info("[Badge] Awarded '#{badge.name}' to Company ##{@company.id}")
  end
  
  def remove_badge(badge)
    @company.company_badges.find_by(badge: badge)&.destroy
    Rails.logger.info("[Badge] Removed '#{badge.name}' from Company ##{@company.id}")
  end
end
```

**Cron Job (Sidekiq):**
```ruby
# File: app/jobs/evaluate_badges_job.rb
class EvaluateBadgesJob < ApplicationJob
  queue_as :default
  
  def perform
    BadgeAwardingService.evaluate_all_companies
  end
end

# File: config/sidekiq.yml
# Schedule: daily at 2 AM
:schedule:
  evaluate_badges:
    cron: '0 2 * * *'
    class: EvaluateBadgesJob
```

**Frontend - Badge Display:**
```typescript
// File: AB0-1-front/components/BadgeDisplay.tsx
import { Badge } from '@/types';

interface BadgeDisplayProps {
  badges: Badge[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({ badges, maxVisible = 3, size = 'md' }: BadgeDisplayProps) {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;
  
  return (
    <div className="flex items-center gap-2">
      {visibleBadges.map((badge) => (
        <TooltipProvider key={badge.id}>
          <Tooltip>
            <TooltipTrigger>
              <div 
                className={cn(
                  'badge flex items-center gap-1 rounded-full px-2 py-1',
                  badgeSizeClasses[size]
                )}
                style={{ backgroundColor: badge.color }}
              >
                {badge.iconUrl && (
                  <img src={badge.iconUrl} alt="" className="w-4 h-4" />
                )}
                <span className="text-white font-medium">{badge.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{badge.name}</p>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <span className="text-sm text-muted-foreground">
          +{remainingCount} mais
        </span>
      )}
    </div>
  );
}
```

#### 📊 Success Metrics

**Badge Impact:**
- CTR (Click Through Rate): empresas com badges +25%
- Lead conversion: empresas com badges +30%
- Trust score: companies with verification badges +60%

**Badge Distribution:**
- 80% das empresas: pelo menos 1 badge
- 40% das empresas: 3+ badges
- 10% das empresas: 5+ badges (elite)

**Engagement:**
- Badge page views: 40% dos visitantes
- Filter by badge usage: 15% das buscas

---

## 🟠 P1 - HIGH PRIORITY {#p1-high-priority}

### US-004: Comparação Lado a Lado de Empresas

**Epic**: Discovery & Decision Making  
**Prioridade**: P1 - Alta  
**Esforço**: 2 Sprints (4 semanas)  
**Impact**: 🔥🔥🔥 - Conversão +35%

#### 📝 User Story
```
Como VISITANTE comparando empresas
Quero ver uma comparação lado a lado de 2-3 empresas
Para tomar uma decisão informada sobre qual contratar
```

#### 🎯 Acceptance Criteria

**Seleção de Empresas para Comparar:**
- [ ] Checkbox "Comparar" em cada card de empresa
- [ ] Limite: máximo 3 empresas selecionadas
- [ ] Floating button: "Comparar (2)" com contador
- [ ] Persistir seleção na sessão (localStorage)

**Modal/Page de Comparação:**
- [ ] Layout: tabela com 3 colunas (1 por empresa)
- [ ] Sticky header com logos das empresas
- [ ] Scroll horizontal em mobile

**Categorias de Comparação:**

**1. Informações Básicas:**
- [ ] Logo e nome da empresa
- [ ] Rating médio (⭐ X.X)
- [ ] Número de reviews
- [ ] Badges principais
- [ ] Anos no mercado
- [ ] Número de instalações

**2. Serviços e Especialidades:**
- [ ] Tipos atendidos (residencial, comercial, industrial, rural)
- [ ] Marcas de painéis trabalhadas
- [ ] Marcas de inversores
- [ ] Serviços extras (manutenção, monitoramento, limpeza)

**3. Preços e Condições:**
- [ ] Faixa de preço por kWp (R$ X - R$ Y)
- [ ] Formas de pagamento
- [ ] Parceria com bancos/financeiras
- [ ] Desconto à vista (se houver)

**4. Garantias:**
- [ ] Garantia de equipamentos (anos)
- [ ] Garantia de instalação (anos)
- [ ] Garantia de geração (%)

**5. Tempo e Prazo:**
- [ ] Prazo médio de instalação (dias)
- [ ] Disponibilidade para visita técnica

**6. Localização:**
- [ ] Cidade/Estado
- [ ] Regiões de atendimento
- [ ] Mapa interativo (opcional)

**7. Reviews Destacadas:**
- [ ] 1 review mais relevante de cada empresa
- [ ] Link: "Ver todas as X reviews"

**Ações no Modal:**
- [ ] Botão: "Solicitar Orçamento" (individual por empresa)
- [ ] Botão: "Solicitar Orçamento das 3" (multi-lead)
- [ ] Botão: "Remover da comparação"
- [ ] Botão: "Adicionar outra empresa"
- [ ] Botão: "Compartilhar comparação" (link único)

**Diferenciação Visual:**
- [ ] Highlight em verde: melhor valor em cada métrica
- [ ] "Melhor custo-benefício" badge automático
- [ ] "Mais rápido" se prazo <20 dias
- [ ] "Melhor avaliado" se rating >4.5

**Analytics:**
- [ ] Track: empresas adicionadas à comparação
- [ ] Track: comparação visualizada
- [ ] Track: lead gerado via comparação
- [ ] Track: métrica mais vista

#### 🛠️ Technical Implementation

**Frontend State Management:**
```typescript
// File: AB0-1-front/contexts/ComparisonContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '@/types';

interface ComparisonContextType {
  companies: Company[];
  addCompany: (company: Company) => void;
  removeCompany: (companyId: number) => void;
  clearComparison: () => void;
  isComparing: (companyId: number) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPANIES = 3;
const STORAGE_KEY = 'solar_comparison';

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCompanies(JSON.parse(stored));
    }
  }, []);
  
  // Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  }, [companies]);
  
  const addCompany = (company: Company) => {
    if (companies.length >= MAX_COMPANIES) {
      toast.error(`Máximo de ${MAX_COMPANIES} empresas`);
      return;
    }
    
    if (companies.some(c => c.id === company.id)) {
      toast.error('Empresa já adicionada');
      return;
    }
    
    setCompanies([...companies, company]);
    track('comparison_company_added', { companyId: company.id });
  };
  
  const removeCompany = (companyId: number) => {
    setCompanies(companies.filter(c => c.id !== companyId));
    track('comparison_company_removed', { companyId });
  };
  
  const clearComparison = () => {
    setCompanies([]);
    localStorage.removeItem(STORAGE_KEY);
    track('comparison_cleared');
  };
  
  const isComparing = (companyId: number) => {
    return companies.some(c => c.id === companyId);
  };
  
  const canAddMore = companies.length < MAX_COMPANIES;
  
  return (
    <ComparisonContext.Provider value={{
      companies,
      addCompany,
      removeCompany,
      clearComparison,
      isComparing,
      canAddMore,
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
}
```

**Comparison Modal:**
```typescript
// File: AB0-1-front/components/ComparisonModal.tsx
'use client';

import { useComparison } from '@/contexts/ComparisonContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Star, Award, MapPin, Clock, Shield } from 'lucide-react';

export function ComparisonModal({ open, onClose }: ComparisonModalProps) {
  const { companies, removeCompany } = useComparison();
  
  if (companies.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 pb-4 border-b">
          <h2 className="text-2xl font-bold">Comparação de Empresas</h2>
        </div>
        
        {/* Companies Header */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {companies.map((company) => (
            <div key={company.id} className="text-center relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
                onClick={() => removeCompany(company.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <img 
                src={company.logo_url} 
                alt={company.name}
                className="h-16 w-16 mx-auto rounded-full object-cover mb-2"
              />
              <h3 className="font-semibold">{company.name}</h3>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{company.average_rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({company.reviews_count})
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comparison Table */}
        <div className="space-y-6">
          <ComparisonSection title="Experiência" icon={Award}>
            <ComparisonRow label="Anos no mercado">
              {companies.map(c => (
                <ComparisonCell key={c.id} value={`${c.years_in_business} anos`} />
              ))}
            </ComparisonRow>
            <ComparisonRow label="Instalações realizadas">
              {companies.map(c => (
                <ComparisonCell 
                  key={c.id} 
                  value={`${c.installations_count}+`}
                  highlight={c.installations_count === Math.max(...companies.map(x => x.installations_count))}
                />
              ))}
            </ComparisonRow>
          </ComparisonSection>
          
          <ComparisonSection title="Preços e Condições" icon={DollarSign}>
            <ComparisonRow label="Preço por kWp">
              {companies.map(c => (
                <ComparisonCell 
                  key={c.id} 
                  value={`R$ ${c.price_per_kwp_min} - ${c.price_per_kwp_max}`}
                  highlight={c.price_per_kwp_min === Math.min(...companies.map(x => x.price_per_kwp_min))}
                />
              ))}
            </ComparisonRow>
            <ComparisonRow label="Financiamento">
              {companies.map(c => (
                <ComparisonCell 
                  key={c.id} 
                  value={c.offers_financing ? '✓ Sim' : '✗ Não'}
                />
              ))}
            </ComparisonRow>
          </ComparisonSection>
          
          <ComparisonSection title="Garantias" icon={Shield}>
            <ComparisonRow label="Garantia de instalação">
              {companies.map(c => (
                <ComparisonCell 
                  key={c.id} 
                  value={`${c.installation_warranty_years} anos`}
                  highlight={c.installation_warranty_years === Math.max(...companies.map(x => x.installation_warranty_years))}
                />
              ))}
            </ComparisonRow>
          </ComparisonSection>
          
          <ComparisonSection title="Tempo de Instalação" icon={Clock}>
            <ComparisonRow label="Prazo médio">
              {companies.map(c => (
                <ComparisonCell 
                  key={c.id} 
                  value={`${c.average_installation_days} dias`}
                  highlight={c.average_installation_days === Math.min(...companies.map(x => x.average_installation_days))}
                />
              ))}
            </ComparisonRow>
          </ComparisonSection>
          
          <ComparisonSection title="Localização" icon={MapPin}>
            <ComparisonRow label="Cidade">
              {companies.map(c => (
                <ComparisonCell key={c.id} value={`${c.city}, ${c.state}`} />
              ))}
            </ComparisonRow>
          </ComparisonSection>
        </div>
        
        {/* CTAs */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t">
          {companies.map((company) => (
            <Button key={company.id} size="lg" className="w-full">
              Solicitar Orçamento
            </Button>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full mt-2"
          onClick={() => handleBulkQuote(companies)}
        >
          Solicitar Orçamento das {companies.length} Empresas
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ComparisonSection({ title, icon: Icon, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-lg mb-3">
        <Icon className="h-5 w-5" />
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function ComparisonRow({ label, children }) {
  return (
    <div className="grid grid-cols-4 gap-4 py-2 border-b">
      <div className="font-medium text-sm text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ComparisonCell({ value, highlight = false }) {
  return (
    <div className={cn(
      'text-sm',
      highlight && 'font-semibold text-green-600'
    )}>
      {value}
    </div>
  );
}
```

#### 📊 Success Metrics

**Usage:**
- 30% dos visitantes usam comparação
- Média de 2.3 empresas comparadas
- 50% geram lead após comparar

**Conversion Impact:**
- Lead gen rate: sem comparação 8% → com comparação 15%
- Multi-quote rate: 20% solicitam orçamento de 2+ empresas

---

### US-005: Lead Scoring & Qualificação Automática

*(Continua... próximas 25 User Stories)*

---

**Quer que eu continue detalhando as outras User Stories? Posso gerar:**
- US-005 a US-030 (restantes 25 features)
- Roadmap visual em formato Gantt
- Matriz de priorização com scoring
- Dependencies map entre features

Continuo?
