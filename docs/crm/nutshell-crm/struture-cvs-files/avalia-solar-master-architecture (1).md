# ARQUITETURA MASTER DE SISTEMAS: CRM AVALIA SOLAR
## Nível: Principal Software Architect / Lead Systems Engineer
## Status: Aprovado para Implementação (Production-Ready Blueprint)

Este documento consolidado serve como a **Especificação de Arquitetura de Referência do CRM Avalia Solar**. Ele unifica o modelo de dados relacional (PostgreSQL), os contratos de API RESTful, as estruturas de frontend (React + Tailwind CSS), as rotas de sistema, os dicionários de dados canônicos, as lógicas de negócios (como o algoritmo de dimensionamento solar) e as diretrizes de implantação.

---

## 1. VISÃO GERAL DO DOMÍNIO E REQUISITOS DE NEGÓCIO

O **Avalia Solar** é um CRM (Customer Relationship Management) especializado para o mercado de energia solar fotovoltaica B2C e B2B. Ele foi projetado por engenharia reversa das interfaces de controle de leads e comunicação corporativa, estendendo as lógicas tradicionais de vendas de CRM com lógicas de engenharia fotovoltaica e RevOps.

### Principais Entidades de Domínio
1. **User (Usuários)**: Representa os agentes de vendas, gerentes e analistas que usam o CRM.
2. **Account (Contas/Organizações)**: Empresas ou clientes corporativos (B2B), estruturadas com dados geográficos e classificação industrial.
3. **Contact (Contatos/Pessoas)**: Pessoas físicas associadas ou não a Contas, registrando e-mails, telefones, cargos e links sociais.
4. **Lead (Oportunidades de Vendas)**: A entidade central que une Contatos, Contas, valores monetários, metas e o **Projeto Solar associado**.
5. **Solar Project (Projeto Solar/Extensão Técnica)**: Entidade acoplada 1:1 com o Lead que gerencia o consumo elétrico mensal (kWh), valor da fatura (R$), tipo de telhado e calcula a potência do gerador (kWp).
6. **Activity (Atividades/Eventos)**: Reuniões, telefonemas e tarefas com status de execução e participantes vinculados.
7. **Email (Mensagens de E-mail)**: Registro histórico de e-mails recebidos e enviados com suporte a templates e monitoramento de leitura.
8. **Note (Notas de Timeline)**: Comentários livres na timeline de qualquer entidade, suportando rich text e `@menções` a usuários do sistema.

---

## 2. ARQUITETURA DE BANCO DE DADOS (DB SCHEMA & DDL)

O banco de dados do **Avalia Solar** utiliza o dialeto **PostgreSQL (v15+)** devido ao suporte nativo a tipos JSONB, GIN indexes (para buscas de tags e menções textuais) e integridade referencial robusta.

```sql
-- Habilita extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELA DE USUÁRIOS (users)
-- ==========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep', -- admin, manager, sales_rep
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TABELA DE CONTAS / EMPRESAS (accounts)
-- ==========================================
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legacy_id VARCHAR(100),
    phone_phones VARCHAR(50),
    email VARCHAR(255),
    url TEXT,
    industry VARCHAR(100),
    account_type VARCHAR(100) DEFAULT 'Standard Account',
    territory VARCHAR(100),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. TABELA DE CONTATOS (contacts)
-- ==========================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legacy_id VARCHAR(100),
    phone_phones VARCHAR(50),
    home_phones VARCHAR(50),
    mobile_phones VARCHAR(50),
    work_phones VARCHAR(50),
    fax_phones VARCHAR(50),
    other_phones VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    url TEXT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    territory VARCHAR(100),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    job_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. TABELA DE PIPELINES & ETAPAS (pipelines, stages)
-- ==========================================
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE, -- qualify, pitch, close
    display_order INTEGER NOT NULL,
    probability_percent INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. TABELA DE OPORTUNIDADES (leads)
-- ==========================================
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    lead_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Open', -- Open, Won, Lost, Archived
    confidence VARCHAR(10) DEFAULT '50%',
    outcome VARCHAR(100),
    stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL,
    percent_complete INTEGER DEFAULT 0,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    market VARCHAR(100),
    value NUMERIC(12, 2) DEFAULT 0.00,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    products TEXT[],
    competitors TEXT[],
    sources TEXT[],
    tags TEXT[],
    expected_closed_date TIMESTAMP WITH TIME ZONE,
    date_closed TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. EXTENSÃO SOLAR DO PROJETO (solar_projects)
-- ==========================================
CREATE TABLE solar_projects (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    monthly_consumption_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monthly_bill_brl NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    roof_type VARCHAR(100) NOT NULL, -- metalico, fibrocimento, laje, ceramico, solo
    radiation_index_hsp NUMERIC(4, 2) DEFAULT 4.5,
    calculated_system_kwp NUMERIC(8, 2) DEFAULT 0.00,
    calculated_panels_count INTEGER DEFAULT 0,
    estimated_generation_kwh NUMERIC(10, 2) DEFAULT 0.00,
    estimated_savings_annual NUMERIC(12, 2) DEFAULT 0.00,
    payback_years NUMERIC(4, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. TABELA DE ATIVIDADES / TAREFAS (activities)
-- ==========================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Phone Call, Meeting, Task, Email, System
    status VARCHAR(100) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Logged, Postponed, Cancelled
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_all_day BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_timed BOOLEAN DEFAULT TRUE,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    follow_up_activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relacionamento M:M de Contatos e Atividades para Participantes
CREATE TABLE activity_participants (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    UNIQUE(activity_id, contact_id)
);

-- ==========================================
-- 8. TABELA DE EMAILS (emails)
-- ==========================================
CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    headers TEXT,
    body TEXT NOT NULL,
    sent_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    zendesk_ticket_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Tabelas de relacionamento de e-mails para feeds unificados
CREATE TABLE email_leads (
    email_id INTEGER REFERENCES emails(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    PRIMARY KEY(email_id, lead_id)
);

CREATE TABLE email_contacts (
    email_id INTEGER REFERENCES emails(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
    PRIMARY KEY(email_id, contact_id)
);

-- ==========================================
-- 9. TABELA DE NOTAS (notes)
-- ==========================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- Leads, Contacts, Accounts, Activities
    entity_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDICES DE PERFORMANCE PARA REVOPS & BUSCA
-- ==========================================
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_notes_polymorphic ON notes(entity_type, entity_id);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_solar_projects_lead ON solar_projects(lead_id);

-- Índices GIN do PostgreSQL para buscas eficientes de texto e tags
CREATE INDEX idx_accounts_tags ON accounts USING gin(tags);
CREATE INDEX idx_contacts_tags ON contacts USING gin(tags);
CREATE INDEX idx_leads_tags ON leads USING gin(tags);
```

---

## 3. ESPECIFICAÇÃO DE APIS E CONTRATOS (RESTFUL API)

Toda a comunicação entre o Frontend (React SPA) e o Backend ocorre através de uma API estruturada baseada em padrões REST corporativos sob o prefixo `/api/v1`.

### Endpoint 1: Criar Oportunidade / Lead com Projeto Solar Integrado
* **Método**: `POST`
* **Caminho**: `/api/v1/leads`
* **Autenticação**: Bearer JWT (Cabeçalho `Authorization: Bearer <token>`)

#### Request Body Schema (JSON)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 3 },
    "description": { "type": "string" },
    "value": { "type": "number", "minimum": 0 },
    "contact_id": { "type": "integer" },
    "account_id": { "type": "integer" },
    "stage_id": { "type": "integer" },
    "solar_project_attributes": {
      "type": "object",
      "properties": {
        "monthly_consumption_kwh": { "type": "number", "minimum": 0 },
        "monthly_bill_brl": { "type": "number", "minimum": 0 },
        "roof_type": { "type": "string", "enum": ["metalico", "fibrocimento", "laje", "ceramico", "solo"] },
        "radiation_index_hsp": { "type": "number", "minimum": 0 }
      },
      "required": ["monthly_consumption_kwh", "roof_type"]
    }
  },
  "required": ["name", "contact_id", "solar_project_attributes"]
}
```

#### Response Body (JSON - Status 201 Created)
```json
{
  "id": 42,
  "lead_number": 1004,
  "name": "Residencial Morgan Taylor",
  "status": "Open",
  "value": 14000.00,
  "stage_id": 1,
  "solar_project": {
    "id": 8,
    "monthly_consumption_kwh": 350.00,
    "monthly_bill_brl": 315.00,
    "roof_type": "ceramico",
    "calculated_system_kwp": 3.24,
    "calculated_panels_count": 6,
    "estimated_generation_kwh": 350.00,
    "estimated_savings_annual": 3591.00,
    "payback_years": 3.90,
    "inverter_specification": "Microinversor Dual APsystems"
  },
  "created_at": "2026-09-02T16:11:00Z"
}
```

### Endpoint 2: Mover Lead no Kanban (Drag and Drop)
* **Método**: `PATCH`
* **Caminho**: `/api/v1/leads/:id/stage`
* **Autenticação**: Bearer JWT

#### Request Body Schema (JSON)
```json
{
  "stage_slug": "pitch"
}
```

#### Response Body (JSON - Status 200 OK)
```json
{
  "id": 42,
  "stage_id": 2,
  "stage_slug": "pitch",
  "percent_complete": 50,
  "updated_at": "2026-09-02T16:11:30Z"
}
```

### Endpoint 3: Publicar Nota na Timeline com @Menções de Equipe
* **Método**: `POST`
* **Caminho**: `/api/v1/notes`
* **Autenticação**: Bearer JWT

#### Request Body Schema (JSON)
```json
{
  "entity_type": "Leads",
  "entity_id": 42,
  "note": "Apresentação comercial enviada. Roping in @Felipe para avaliar viabilidade técnica no telhado de laje."
}
```

#### Response Body (JSON - Status 201 Created)
```json
{
  "id": 105,
  "entity_type": "Leads",
  "entity_id": 42,
  "note": "Apresentação comercial enviada. Roping in @Felipe para avaliar viabilidade técnica no telhado de laje.",
  "mentions": [
    { "user_id": 12, "name": "Felipe", "email": "felipe@avaliasolar.com.br" }
  ],
  "created_at": "2026-09-02T16:11:45Z"
}
```

---

## 4. ARQUITETURA DE FRONTEND (REACT COMPONENTS & STATE)

A interface de usuário é baseada em componentes funcionais React modularizados e isolados, usando as classes utilitárias de baixa especificação do **Tailwind CSS**. A navegação e controle visual obedecem aos padrões estritos definidos no Design System do Avalia Solar (Navy escuro de fundo de barras, Laranja Solar como ponto de atração focal, cantos arredondados de 12px `rounded-xl`).

### Hierarquia de Componentes Frontend

```
App (Raiz)
 └── AppShell (Controle de Layout e Autenticação)
      ├── Sidebar (Menu de Navegação, Fundo Navy Escuro, Indicador Laranja)
      ├── TopBar (Barra Superior de Busca, Métricas Rápidas, Gatilho de Novo Lead)
      └── MainContentArea (Painel Central de Exibição de Rotas)
           ├── DashboardView (Gráficos, Listagem e Atividades Pendentes)
           ├── PipelineKanban (Visualização por Etapas, Colunas Arrastáveis)
           │    └── KanbanColumn (Listagem de Oportunidades, Cálculo Financeiro Somado)
           │         └── LeadCard (Card com ID, Proprietário, Valor e Mini-Projeto Solar)
           └── Lead360View (Tela Lateral/Drawers de Detalhe Completo do Lead)
                ├── LeadHeader (Ações Rápidas de Won/Lost e Controle Financeiro)
                ├── TechSolarSection (Métricas e Gráficos do Projeto Fotovoltaico)
                ├── TimelineComposer (Abas para Nota, E-mail e Log de Reuniões)
                └── TimelineFeed (Linha do Tempo Cronológica com Ícones Customizados)
```

### Controle de Estado Global e Redux/Context Pattern
Para manter os componentes em sincronia ao mover leads ou inserir novos dados, a arquitetura utiliza o **React Context API** ou **Zustand** para o estado do CRM.

```typescript
import React, { createContext, useContext, useState, useMemo } from 'react';

interface CRMState {
  leads: Lead[];
  currentLead: Lead | null;
  sidebarOpen: boolean;
  filterQuery: string;
}

interface CRMContextType {
  state: CRMState;
  createLead: (lead: Omit<Lead, 'id' | 'lead_number'>) => Promise<void>;
  updateLeadStage: (leadId: number, nextStageSlug: string) => Promise<void>;
  setCurrentLead: (lead: Lead | null) => void;
  setFilterQuery: (query: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CRMState>({
    leads: [],
    currentLead: null,
    sidebarOpen: true,
    filterQuery: ''
  });

  // Ações de Estado assíncronas encapsulando chamadas de API REST
  const createLead = async (newLeadData: any) => {
    const res = await fetch('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLeadData)
    });
    const created = await res.json();
    setState(prev => ({ ...prev, leads: [created, ...prev.leads] }));
  };

  const updateLeadStage = async (leadId: number, nextStageSlug: string) => {
    // Atualização otimista na UI (Optimistic UI Update)
    const originalLeads = [...state.leads];
    setState(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === leadId ? { ...l, stage_slug: nextStageSlug } : l)
    }));

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_slug: nextStageSlug })
      });
      if (!res.ok) throw new Error('API Error');
    } catch (err) {
      // Reverte se a chamada ao servidor falhar (Rollback)
      setState(prev => ({ ...prev, leads: originalLeads }));
    }
  };

  const value = useMemo(() => ({
    state,
    createLead,
    updateLeadStage,
    setCurrentLead: (currentLead: Lead | null) => setState(prev => ({ ...prev, currentLead })),
    setFilterQuery: (filterQuery: string) => setState(prev => ({ ...prev, filterQuery }))
  }), [state]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within CRMProvider');
  return context;
};
```

---

## 5. VARIÁVEIS DE AMBIENTE E ARQUIVO DE CONFIGURAÇÃO

Para rodar a aplicação em ambientes locais, de homologação e produção, utilize a estrutura do arquivo `.env.example` abaixo.

```bash
# ==============================================================================
# CONFIGURAÇÕES DE AMBIENTE - CRM AVALIA SOLAR
# ==============================================================================

# Node / runtime
NODE_ENV=production
PORT=8080

# Banco de Dados PostgreSQL Relacional
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/avalia_solar?pool=20&ssl=true

# Autenticação & Segurança de Sessão
JWT_SECRET=b643a6d713ee3587e600ef7c9ff79199f365d95b774b12aa0d1df6e1084ef7cd
JWT_EXPIRATION_DAYS=7
API_KEY_SALT=f98af074d2ebf0cf

# Integração de E-mail (Sync de Leads via SMTP/IMAP)
EMAIL_SYNC_BCC_BOX=bcc@avaliasolar.com.br
SMTP_HOST=smtp.avaliasolar.com.br
SMTP_PORT=587
SMTP_USER=leads-comunicacao@avaliasolar.com.br
SMTP_PASSWORD=secret_email_password_integration
IMAP_HOST=imap.avaliasolar.com.br
IMAP_PORT=993

# Chaves de APIs Externas & Rastreamento de Leads
TRACKING_DOMAIN=https://leadtrack.avaliasolar.com.br
REVENUE_METRICS_API_KEY=av_live_9481adbcff010a39

# Configurações de Performance de Caching
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_MINUTES=15
```

---

## 6. FUNÇÕES UTILIÁRIAS E ALGORITMOS DE CÁLCULO (UTILITIES)

As funções utilitárias em TypeScript representam o núcleo lógico da inteligência de negócios do CRM, garantindo exatidão no cálculo fotovoltaico e na conversão monetária.

### Algoritmo Técnico Solar de Geração e Payback (Dimensionamento Científico)
Este utilitário é compartilhado entre o frontend React (para cálculo dinâmico em formulários) e o backend (para validação final e gravação no banco PostgreSQL).

```typescript
export interface SolarDimensioningInput {
  monthlyConsumptionKwh: number;      // Consumo elétrico médio mensal do cliente
  monthlyBillBrl: number;             // Valor pago atualmente na conta de luz (R$)
  roofType: 'metalico' | 'fibrocimento' | 'laje' | 'ceramico' | 'solo';
  radiationIndexHsp?: number;         // HSP (Horas de Sol Pleno diárias). Default: 4.5
  panelPowerW?: number;               // Potência nominal de cada módulo solar. Default: 550W
  costPerKwp?: number;                // Custo médio por kWp instalado. Default: R$ 4.500,00
}

export interface SolarDimensioningResult {
  estimatedSystemKwp: number;         // Potência de pico do gerador fotovoltaico (kWp)
  panelQuantity: number;              // Quantidade física de painéis solares necessários
  estimatedGenerationKwh: number;     // Geração estável de energia estimada por mês (kWh)
  estimatedAnnualSavings: number;     // Economia financeira estimada no ano (R$)
  estimatedInvestment: number;        // Investimento estimado do projeto (R$)
  estimatedPaybackYears: number;      // Tempo estimado de retorno do investimento (Anos)
  inverterSpecification: string;      // Sugestão de infraestrutura do inversor elétrico
}

/**
 * Calcula o dimensionamento fotovoltaico técnico com base no consumo de energia.
 */
export const calculateSolarSystem = (input: SolarDimensioningInput): SolarDimensioningResult => {
  const hsp = input.radiationIndexHsp || 4.5; // HSP médio regional
  const panelPower = input.panelPowerW || 550; // Placas solares padrão de 550 Watts
  const costKwp = input.costPerKwp || 4500; // Investimento de R$ 4.500,00 por kWp instalado
  const efficiencyLossFactor = 0.80; // Coeficiente de perdas elétricas/térmicas (80% eficiência)

  // Potência do Sistema (kWp) = Consumo Mensal / (30 dias * HSP * Coeficiente de Perda)
  const estimatedSystemKwp = input.monthlyConsumptionKwh / (30 * hsp * efficiencyLossFactor);
  
  // Quantidade de placas (arredondada para cima para número par para simetria do inversor)
  let panelQuantity = Math.ceil((estimatedSystemKwp * 1000) / panelPower);
  if (panelQuantity % 2 !== 0) {
    panelQuantity += 1;
  }

  // Potência real instalada com base na quantidade exata de placas solares
  const actualSystemKwp = (panelQuantity * panelPower) / 1000;
  
  // Geração real média mensal calculada em kWh
  const estimatedGenerationKwh = actualSystemKwp * 30 * hsp * efficiencyLossFactor;

  // Tarifa estimada de energia por kWh (Média nacional brasileira com encargos)
  const energyTariff = 0.95; 
  const estimatedAnnualSavings = (estimatedGenerationKwh * energyTariff) * 12;

  // Custos financeiros de implantação
  const estimatedInvestment = actualSystemKwp * costKwp;
  const estimatedPaybackYears = estimatedInvestment / estimatedAnnualSavings;

  // Critério de especificação técnica de segurança do inversor
  const inverterSpecification = panelQuantity > 8 
    ? 'Inversor Central Grid-Tie Growatt/Solis (Injeção de Alta Potência)' 
    : 'Microinversor Dual APsystems (Modular com Isolamento Rápido)';

  return {
    estimatedSystemKwp: parseFloat(actualSystemKwp.toFixed(2)),
    panelQuantity,
    estimatedGenerationKwh: parseFloat(estimatedGenerationKwh.toFixed(1)),
    estimatedAnnualSavings: parseFloat(estimatedAnnualSavings.toFixed(2)),
    estimatedInvestment: parseFloat(estimatedInvestment.toFixed(2)),
    estimatedPaybackYears: parseFloat(estimatedPaybackYears.toFixed(2)),
    inverterSpecification
  };
};
```

### Algoritmo de Lead Scoring Inteligente (RevOps Priority Engine)
Este utilitário pontua as oportunidades de forma automatizada de `0` a `100` para priorizar a fila de atendimento dos vendedores com base em dados de comportamento, dados técnicos de engenharia e regras de engajamento do CRM.

```typescript
export interface LeadScoreInput {
  leadValue: number;
  confidencePercent: number;
  daysInCurrentStage: number;
  totalActivitiesLogged: number;
  hasSolarDetails: boolean;
  notesCount: number;
}

/**
 * Calcula a prioridade comercial (Lead Score) da oportunidade para o agente de vendas.
 */
export const calculateLeadScore = (lead: LeadScoreInput): number => {
  let score = 30; // Pontuação base padrão

  // 1. Relevância por Valor do Projeto Solar (Até +30 pontos)
  if (lead.leadValue >= 50000) {
    score += 30;
  } else if (lead.leadValue >= 20000) {
    score += 20;
  } else if (lead.leadValue >= 10000) {
    score += 10;
  }

  // 2. Confiança Comercial Estimada (Até +20 pontos)
  score += Math.round(lead.confidencePercent * 0.2);

  // 3. Completude Técnica de Dados do Projeto Solar (Até +15 pontos)
  if (lead.hasSolarDetails) {
    score += 15;
  }

  // 4. Nível de Engajamento por Atividades e Anotações (Até +15 pontos)
  const interactionPoints = (lead.totalActivitiesLogged * 3) + (lead.notesCount * 2);
  score += Math.min(interactionPoints, 15);

  // 5. Penalização por Estagnação no Pipeline (Gargalo de RevOps) (Até -30 pontos)
  if (lead.daysInCurrentStage > 30) {
    score -= 30;
  } else if (lead.daysInCurrentStage > 15) {
    score -= 15;
  } else if (lead.daysInCurrentStage > 7) {
    score -= 5;
  }

  // Garante limite de corte matemático entre 0 e 100
  return Math.max(0, Math.min(100, score));
};
```

---

## 7. DIRETRIZES DE SEGURANÇA, LGPD & IMPLEMENTAÇÃO

### Tratamento de PII (Personally Identifiable Information) e LGPD
Sendo o **Avalia Solar** um sistema de captação de leads para clientes finais (pessoas físicas), ele armazena dados protegidos pela Lei Geral de Proteção de Dados (LGPD).
1. **Dados Criptografados**: Telefones (`phone_phones`, `mobile_phones`) e e-mails de contatos devem ser criptografados em repouso no banco usando algoritmos robustos como **AES-256-GCM**.
2. **Histórico de Consentimento (Opt-In)**: Todo lead que entra via landing pages ou chaves de API externa de captação de tracking registra a data de aceitação dos termos de privacidade e política de uso de dados comerciais.
3. **Anonimização com Soft Delete**: Quando um contato solicita a exclusão total de seus dados, o sistema realiza uma anonimização de suas colunas sensíveis na tabela de contatos (e-mail, endereço, nome), mantendo os valores de conversão nas tabelas financeiras de leads para consistência histórica de relatórios sem vazamento de dados pessoais.

---

### Conclusão e Próximos Passos
Toda a base técnica do ecossistema do **CRM Avalia Solar** está consolidada e pronta para o desenvolvimento de produção. As tabelas SQL, os layouts, as estruturas lógicas do TypeScript e os modais que gerenciam o fluxo comercial do início ao fechamento de propostas solares podem ser exportados individualmente do seu painel lateral.
