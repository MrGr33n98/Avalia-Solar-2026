# BLUEPRINT TÉCNICO COMPLETO: CRM AVALIA SOLAR
## Especificação Integradora de Produção: Banco de Dados, APIs, Domínio, Rotas, Modais e Utilitários
**Autor:** Gemini Notebook (Arquitetura de Sistemas & Engenharia de Software)
**Versão:** 1.0 (Produção)
**Data de Referência:** Setembro de 2026

Este documento constitui o blueprint de engenharia completo e integrado para o desenvolvimento do sistema **Avalia Solar**, realizado por meio de engenharia reversa das fontes de dados estruturadas (CSVs) e mapeamento visual de interfaces. Ele une a lógica relacional do banco de dados, os contratos de comunicação de APIs, a arquitetura de rotas (frontend e backend), as regras de domínio e a implementação física de modais e algoritmos utilitários.

---

## 1. CAMADA DE DADOS: SCHEMA RELACIONAL DETALHADO (PostgreSQL)

O banco de dados foi modelado em dialeto PostgreSQL, garantindo integridade referencial, indexação inteligente para consultas analíticas de RevOps e a extensão especializada em dimensionamento fotovoltaico.

```sql
-- Habilitar extensões recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =========================================================================
-- TABELA: users
-- =========================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'sales_rep' NOT NULL, -- 'admin', 'manager', 'sales_rep'
    api_key_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices de busca e unicidade
CREATE INDEX idx_users_email ON users(email);

-- =========================================================================
-- TABELA: accounts (Empresas/Organizações)
-- =========================================================================
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    legacy_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    phone_phones VARCHAR(50),
    home_phones VARCHAR(50),
    mobile_phones VARCHAR(50),
    work_phones VARCHAR(50),
    fax_phones VARCHAR(50),
    other_phones VARCHAR(50),
    email VARCHAR(255),
    url VARCHAR(255),
    industry VARCHAR(150),
    account_type VARCHAR(100) DEFAULT 'Standard Account' NOT NULL, -- 'Customer', 'Partner', 'Standard Account'
    territory VARCHAR(150),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(30),
    country VARCHAR(100) DEFAULT 'US' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_owner ON accounts(owner_id);
CREATE INDEX idx_accounts_industry ON accounts(industry);

-- =========================================================================
-- TABELA: contacts (Pessoas Físicas)
-- =========================================================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    legacy_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    phone_phones VARCHAR(50),
    home_phones VARCHAR(50),
    mobile_phones VARCHAR(50),
    work_phones VARCHAR(50),
    fax_phones VARCHAR(50),
    other_phones VARCHAR(50),
    email VARCHAR(255),
    url VARCHAR(255),
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    territory VARCHAR(150),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(30),
    country VARCHAR(100) DEFAULT 'US' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);

-- =========================================================================
-- TABELAS DE PIPELINE: pipelines e stages
-- =========================================================================
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Qualify', 'Pitch', 'Close', etc.
    sort_order INTEGER NOT NULL,
    probability INTEGER DEFAULT 0 NOT NULL, -- Probabilidade padrão de fechamento da etapa (%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (pipeline_id, sort_order)
);

CREATE INDEX idx_stages_pipeline ON stages(pipeline_id);

-- =========================================================================
-- TABELA: leads (Oportunidades Comerciais)
-- =========================================================================
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    lead_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open' NOT NULL, -- 'Open', 'Won', 'Lost', 'Archived'
    confidence INTEGER DEFAULT 0 NOT NULL, -- Porcentagem de 0 a 100
    outcome VARCHAR(50), -- 'Won', 'Lost' ou NULL
    stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL,
    percent_complete INTEGER DEFAULT 0 NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    value DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    market VARCHAR(100),
    expected_closed_date DATE,
    date_closed TIMESTAMP WITH TIME ZONE,
    last_contacted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_value ON leads(value);

-- =========================================================================
-- TABELAS DE RELACIONAMENTO MUITOS-PARA-MUITOS (Leads -> Contatos/Empresas)
-- =========================================================================
CREATE TABLE lead_accounts (
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, account_id)
);

CREATE TABLE lead_contacts (
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, contact_id)
);

-- =========================================================================
-- TABELA: tags e lead_tags (Taxonomia)
-- =========================================================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280' NOT NULL, -- Hexadecimal padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE lead_tags (
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

-- =========================================================================
-- TABELA: activities (Atividades e Tarefas Agendadas)
-- =========================================================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Phone Call', 'Meeting', 'Email', 'Site Survey', 'Technical Presentation'
    status VARCHAR(50) DEFAULT 'Scheduled' NOT NULL, -- 'Scheduled', 'Logged', 'Cancelled'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    is_timed BOOLEAN DEFAULT TRUE NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    follow_up_activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE activity_leads (
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, lead_id)
);

CREATE TABLE activity_participants (
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, contact_id)
);

-- =========================================================================
-- TABELA: emails (Comunicações por E-mail Integradas)
-- =========================================================================
CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    headers TEXT,
    body TEXT NOT NULL,
    sent_time TIMESTAMP WITH TIME ZONE,
    zendesk_ticket_id VARCHAR(100),
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE email_leads (
    email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    PRIMARY KEY (email_id, lead_id)
);

CREATE TABLE email_contacts (
    email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (email_id, contact_id)
);

-- =========================================================================
-- TABELA: notes (Anotações e Comentários da Timeline)
-- =========================================================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    associated_type VARCHAR(100) NOT NULL, -- 'Contacts', 'Accounts', 'Leads', 'Activities'
    associated_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notes_polymorphic ON notes(associated_type, associated_id);

-- =========================================================================
-- TABELA: solar_projects (Extensão Técnica Especializada do Avalia Solar)
-- =========================================================================
CREATE TABLE solar_projects (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    monthly_consumption_kwh DECIMAL(10, 2) NOT NULL,
    monthly_bill_value DECIMAL(10, 2) NOT NULL,
    roof_type VARCHAR(100) NOT NULL, -- 'Metálico', 'Cerâmico', 'Fibrocimento', 'Laje', 'Solo'
    solar_radiation_index DECIMAL(5, 2) DEFAULT 4.5 NOT NULL, -- HSP (Horas de Sol Pleno diárias)
    estimated_system_kwp DECIMAL(10, 2) NOT NULL,
    panel_quantity INTEGER NOT NULL,
    panel_power_w INTEGER DEFAULT 550 NOT NULL,
    inverter_specification VARCHAR(255),
    estimated_generation_kwh DECIMAL(10, 2) NOT NULL,
    estimated_annual_savings DECIMAL(12, 2) NOT NULL,
    estimated_payback_years DECIMAL(4, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_solar_projects_lead ON solar_projects(lead_id);
```

---

## 2. CAMADA DE DOMÍNIO: MODELOS E VALIDAÇÕES (ActiveRecord / Rails / Node.js)

Os modelos de domínio expressam a lógica de negócios da plataforma, relacionamentos e validações de integridade que devem ser mantidas tanto no backend quanto no frontend.

### Lead (Oportunidade Comercial & Projeto Solar)
*   **Relacionamentos**:
    *   `belongs_to :creator, class_name: 'User'`
    *   `belongs_to :owner, class_name: 'User'`
    *   `belongs_to :stage, optional: true`
    *   `has_one :solar_project, dependent: :destroy`
    *   `has_and_belongs_to_many :accounts`
    *   `has_and_belongs_to_many :contacts`
    *   `has_and_belongs_to_many :tags`
    *   `has_and_belongs_to_many :activities`
    *   `has_and_belongs_to_many :emails`
*   **Validações**:
    *   `lead_number` é obrigatório, deve ser inteiro e único.
    *   `name` é obrigatório e deve ter no mínimo 3 caracteres.
    *   `status` deve estar contido em `['Open', 'Won', 'Lost', 'Archived']`.
    *   `confidence` deve ser um número inteiro entre 0 e 100.
    *   `value` deve ser maior ou igual a zero.

### SolarProject (Dados Técnicos de Engenharia Fotovoltaica)
*   **Relacionamentos**:
    *   `belongs_to :lead`
*   **Validações**:
    *   `monthly_consumption_kwh` deve ser maior do que 0.
    *   `monthly_bill_value` deve ser maior do que 0.
    *   `roof_type` deve estar contido em `['Metálico', 'Cerâmico', 'Fibrocimento', 'Laje', 'Solo']`.
    *   `panel_quantity` deve ser um inteiro maior do que 0.
    *   `estimated_system_kwp` deve ser maior do que 0.

### Contact (Contato Comercial / Person)
*   **Relacionamentos**:
    *   `belongs_to :account, optional: true`
    *   `belongs_to :owner, class_name: 'User', optional: true`
    *   `has_and_belongs_to_many :leads`
    *   `has_and_belongs_to_many :emails`
    *   `has_many :notes, as: :associated`
*   **Validações**:
    *   `name` é obrigatório.
    *   `email` deve possuir formato válido de e-mail se presente.

---

## 3. ARQUITETURA DE ROTAS: FRONTEND E BACKEND (API RESTful)

### A. Rotas do Frontend (React Router v6)

| Rota Frontend | Componente de Página | Parâmetros | Descrição |
| :--- | :--- | :--- | :--- |
| `/` | `DashboardPage` | Nenhum | Painel de controle de vendas, KPIs e agenda. |
| `/leads` | `LeadsPipelinePage` | Query Params (`status, owner, pipeline_id`) | Visualização Kanban interativa do Funil Comercial. |
| `/leads/:id` | `LeadDetailsPage` | `id` (Integer) | Visualização 360° do Lead, Timeline e Dados Técnicos. |
| `/contacts` | `ContactsListPage` | Query Params (`search, page, tag`) | Listagem com filtros de Contatos (Pessoas Físicas). |
| `/contacts/:id` | `ContactDetailsPage` | `id` (Integer) | Histórico completo de comunicações da pessoa física. |
| `/accounts` | `AccountsListPage` | Query Params (`search, page, industry`) | Listagem de Empresas (Contas B2B). |
| `/accounts/:id` | `AccountDetailsPage` | `id` (Integer) | Cadastro da Empresa e lista de contatos vinculados. |
| `/reports` | `ReportsOverviewPage` | Nenhum | Hub de relatórios (Funil, Volume de Leads, Conversão). |
| `/settings` | `SettingsPage` | Nenhum | Configurações de API, Integração de Rastreamento e Campos Personalizados. |

---

### B. Rotas do Backend (Endpoints da API RESTful)

```
NÍVEL DA API: /api/v1
```

#### 1. Módulo de Leads & Engenharia Solar
*   `GET /leads` - Retorna listagem filtrada de leads (para Kanban ou Tabela).
*   `POST /leads` - Criação rápida de lead (executa o dimensionamento solar em segundo plano).
*   `GET /leads/:id` - Detalhamento completo 360° de um lead.
*   `PUT /leads/:id` - Atualização cadastral do lead.
*   `PATCH /leads/:id/stage` - Mover lead de etapa (Chamado no Drop do Kanban).
*   `PATCH /leads/:id/status` - Marcar lead como Won (Ganho) ou Lost (Perdido).
*   `GET /leads/:id/solar-project` - Retorna a extensão técnica fotovoltaica.
*   `PUT /leads/:id/solar-project` - Atualiza dados do gerador, reprocessando os KPIs de Payback.

#### 2. Módulo de Pessoas e Empresas
*   `GET /contacts` | `POST /contacts` - Listagem e criação de contatos.
*   `GET /contacts/:id` | `PUT /contacts/:id` - Detalhe e edição de contato.
*   `GET /accounts` | `POST /accounts` - Listagem e criação de empresas.
*   `GET /accounts/:id` | `PUT /accounts/:id` - Detalhe e edição de empresa.

#### 3. Módulo de Comunicações & Timeline
*   `GET /leads/:id/timeline` - Timeline corrida de Atividades, Notas e E-mails daquela oportunidade.
*   `POST /notes` - Salva uma anotação na timeline (detecta @menções de usuários e dispara notificações).
*   `POST /emails/send` - Dispara e-mail via SMTP integrado e anexa à timeline do lead/contato.
*   `POST /activities` - Agenda reuniões, telefonemas ou vistorias técnicas (Site Survey).
*   `PATCH /activities/:id/log` - Marca tarefa/atividade como realizada (Logged).

---

## 4. CONTRATOS DE INTEGRAÇÃO DA API (JSON Schemas)

### A. Criação de Novo Lead + Dimensionamento Fotovoltaico (`POST /api/v1/leads`)

#### Request Payload
```json
{
  "name": "Residência Cláudio Silva - Solar 10kWp",
  "value": 45000.00,
  "confidence": 40,
  "stage_id": 1,
  "owner_id": 2,
  "accounts": [3],
  "contacts": [4],
  "tags": ["Hot Lead", "Residencial"],
  "solar_project_attributes": {
    "monthly_consumption_kwh": 850.00,
    "monthly_bill_value": 950.00,
    "roof_type": "Cerâmico",
    "solar_radiation_index": 4.85
  }
}
```

#### Response Payload (201 Created)
```json
{
  "id": 105,
  "lead_number": 1004,
  "name": "Residência Cláudio Silva - Solar 10kWp",
  "status": "Open",
  "confidence": 40,
  "value": 45000.00,
  "stage": {
    "id": 1,
    "name": "Qualify"
  },
  "solar_project": {
    "id": 12,
    "monthly_consumption_kwh": 850.00,
    "monthly_bill_value": 950.00,
    "roof_type": "Cerâmico",
    "estimated_system_kwp": 6.83,
    "panel_quantity": 13,
    "panel_power_w": 550,
    "estimated_generation_kwh": 834.50,
    "estimated_annual_savings": 9850.00,
    "estimated_payback_years": 4.56
  },
  "created_at": "2026-09-02T16:04:00Z"
}
```

---

### B. Movimentação de Estágio no Kanban (`PATCH /api/v1/leads/:id/stage`)

#### Request Payload
```json
{
  "stage_id": 2,
  "percent_complete": 50
}
```

#### Response Payload (200 OK)
```json
{
  "id": 105,
  "lead_number": 1004,
  "stage_id": 2,
  "stage_name": "Pitch",
  "percent_complete": 50,
  "last_modified": "2026-09-02T16:05:12Z"
}
```

---

### C. Registro de Nota na Timeline com @Menção (`POST /api/v1/notes`)

#### Request Payload
```json
{
  "associated_type": "Leads",
  "associated_id": 105,
  "note": "Reunião de alinhamento excelente. @Quincy Herrold ficou de aprovar a potência final do gerador técnico."
}
```

#### Response Payload (201 Created)
```json
{
  "id": 43,
  "associated_type": "Leads",
  "associated_id": 105,
  "creator": {
    "id": 1,
    "name": "Felipe"
  },
  "note": "Reunião de alinhamento excelente. @Quincy Herrold ficou de aprovar a potência final do gerador técnico.",
  "mentioned_user_ids": [1],
  "created_at": "2026-09-02T16:06:00Z"
}
```

---

## 5. VARIÁVEIS DE AMBIENTE, CONSTANTES E ENUMS

### A. Configuração do Sistema (`.env`)
```bash
# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://db_user:secure_pwd@localhost:5432/avalia_solar_prod?pool=10

# Autenticação e Criptografia
JWT_SECRET=super_secret_session_token_key_generation_2026
API_KEY_SALT=avalia_solar_system_salt_value

# Integração de E-mail (SMTP/IMAP)
SMTP_HOST=smtp.avaliasolar.com.br
SMTP_PORT=587
SMTP_USER=leads@avaliasolar.com.br
SMTP_PASS=avalia_leads_secure_pass_2026
IMAP_HOST=imap.avaliasolar.com.br
IMAP_PORT=993

# IA Engine (Análise de faturas e resumos de notas)
OPENAI_API_KEY=sk-proj-avaliasolar-ai-processing-key-2026
NUTSHELL_AI_COMPATIBLE=true

# Configuração de Domínio e Rastreamento
TRACKING_DOMAIN=https://leads.avaliasolar.com.br
```

### B. Enums & Constantes do Sistema
*   **RoofTypes**: `['Metálico', 'Cerâmico', 'Fibrocimento', 'Laje', 'Solo']`
*   **LeadStatus**: `['Open', 'Won', 'Lost', 'Archived']`
*   **ActivityTypes**: `['Phone Call', 'Meeting', 'Email', 'Site Survey', 'Technical Presentation']`
*   **ActivityStatus**: `['Scheduled', 'Logged', 'Cancelled']`
*   **AccountTypes**: `['Customer', 'Partner', 'Standard Account']`

---

## 6. CATÁLOGO DE COMPONENTES DE MODAIS (React & Tailwind CSS)

Abaixo estão as especificações completas de UI e comportamento para os cinco principais modais do sistema Avalia Solar.

### 1. Modal de Criação de Leads (`NewLeadModal`)
*   **Propósito**: Cadastrar novas oportunidades vinculando contatos e disparando o dimensionamento técnico instantaneamente.
*   **Código React & Tailwind**:

```tsx
import React, { useState } from 'react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  accounts: Array<{ id: number, name: string }>;
  contacts: Array<{ id: number, name: string }>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSave, accounts, contacts }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [consumption, setConsumption] = useState('');
  const [billValue, setBillValue] = useState('');
  const [roofType, setRoofType] = useState('Cerâmico');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  if (!isOpen) return null;

  // Cálculo de engenharia solar inline para feedback visual rápido ao vendedor
  const kwpCalculated = consumption ? (parseFloat(consumption) / 125).toFixed(2) : '0.00';
  const panelsCount = consumption ? Math.ceil((parseFloat(consumption) / 125) * 1000 / 550) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      value: parseFloat(value) || 0,
      solar_project_attributes: {
        monthly_consumption_kwh: parseFloat(consumption),
        monthly_bill_value: parseFloat(billValue),
        roof_type: roofType,
        estimated_system_kwp: parseFloat(kwpCalculated),
        panel_quantity: panelsCount
      },
      contacts: selectedContact ? [parseInt(selectedContact)] : [],
      accounts: selectedAccount ? [parseInt(selectedAccount)] : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Novo Lead Comercial</h2>
            <p className="text-xs text-slate-500 mt-1">Insira os dados cadastrais e as necessidades de energia do cliente.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nome da Oportunidade *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Residência Cláudio Silva - Solar 10kWp" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Valor Estimado do Projeto (R$)</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contato do Cliente</label>
              <select value={selectedContact} onChange={e => setSelectedContact(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white">
                <option value="">Selecione um Contato...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Dados Técnicos Fotovoltaicos */}
          <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 space-y-4">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              ⚡ Dimensionamento Técnico Solar Rápido
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1.5">Consumo Médio (kWh)</label>
                <input required type="number" value={consumption} onChange={e => setConsumption(e.target.value)} placeholder="Ex: 850" className="w-full px-3 py-2.5 rounded-lg border border-amber-200 bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1.5">Valor da Fatura (R$)</label>
                <input required type="number" value={billValue} onChange={e => setBillValue(e.target.value)} placeholder="Ex: 950" className="w-full px-3 py-2.5 rounded-lg border border-amber-200 bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1.5">Tipo de Telhado</label>
                <select value={roofType} onChange={e => setRoofType(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-amber-200 bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
                  <option value="Cerâmico">Cerâmico</option>
                  <option value="Metálico">Metálico</option>
                  <option value="Fibrocimento">Fibrocimento</option>
                  <option value="Laje">Laje</option>
                  <option value="Solo">Solo</option>
                </select>
              </div>
            </div>

            {consumption && (
              <div className="bg-white rounded-lg p-3 border border-amber-200/50 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Estimativa:</span>{' '}
                  <strong className="text-amber-900">{kwpCalculated} kWp</strong>
                </div>
                <div>
                  <span className="text-slate-500">Painéis (550W):</span>{' '}
                  <strong className="text-amber-900">{panelsCount} unidades</strong>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/10 transition-all transform hover:-translate-y-0.5">
            Gerar Lead e Dimensionamento
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 2. Modal de Registro de Nota/Anotações (`NoteModal`)
*   **Propósito**: Permitir que os usuários escrevam notas rápidas na timeline do lead com menção direta a outros membros do time de vendas.

```tsx
import React, { useState } from 'react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteText: string) => void;
  usersList: Array<{ id: number, name: string }>;
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, usersList }) => {
  const [note, setNote] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNote(text);

    // Detecção básica de caractere @ para abrir sugestões
    const lastWord = text.split(/\s/).pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const words = note.split(/\s/);
    words.pop(); // Remove o '@' parcial
    setNote([...words, `@${username} `].join(' '));
    setShowMentions(false);
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col relative">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Adicionar Anotação</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <textarea value={note} onChange={handleTextChange} rows={5} placeholder="Digite observações importantes sobre a conversa... Use '@' para mencionar colegas de equipe." className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" />
            
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10 p-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">Mencionar Integrante</span>
                {filteredUsers.map(user => (
                  <button key={user.id} onClick={() => insertMention(user.name)} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </span>
                    {user.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50">
            Descartar
          </button>
          <button onClick={() => { onSave(note); onClose(); }} disabled={!note.trim()} className="px-5 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors">
            Registrar Nota
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 3. Modal de Envio e Composição de E-mail (`EmailComposerModal`)
*   **Propósito**: Permitir aos vendedores a composição ágil de e-mails, aplicando modelos dinâmicos de faturas solares ou boas-vindas.

```tsx
import React, { useState } from 'react';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
}

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; body: string }) => void;
  recipientEmail: string;
  templates: EmailTemplate[];
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ isOpen, onClose, onSend, recipientEmail, templates }) => {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: EmailTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend({ to, subject, body });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 flex flex-row h-[75vh] overflow-hidden">
        
        {/* Editor de Mensagem */}
        <div className="flex-1 flex flex-col h-full border-r border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Novo E-mail Comercial</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 lg:hidden">✕</button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Destinatário</label>
              <input type="email" value={to} onChange={e => setTo(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assunto</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Conteúdo da Mensagem</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} required className="w-full flex-1 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors">
                Enviar Mensagem
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar de Templates de E-mail */}
        <div className="w-80 bg-slate-50 h-full hidden lg:flex flex-col">
          <div className="p-5 border-b border-slate-200 bg-white">
            <h3 className="font-bold text-sm text-slate-800">Modelos Disponíveis</h3>
            <p className="text-[11px] text-slate-500 mt-1">Clique para carregar o escopo no editor.</p>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {templates.map(tpl => (
              <button key={tpl.id} onClick={() => handleApplyTemplate(tpl)} className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm">
                <span className="block font-bold text-xs text-slate-800 mb-1">{tpl.name}</span>
                <span className="block text-[10px] text-slate-400 truncate">{tpl.subject}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
```

---

### 4. Modal de Sumário de Pessoas/Contatos (`PeopleSummaryModal`)
*   **Propósito**: Visualizar detalhes rápidos de contatos, histórico e notas associadas ao passar o mouse ou clicar em um avatar de contato no Kanban.

```tsx
import React from 'react';

interface ContactSummary {
  name: string;
  job_title?: string;
  email?: string;
  mobile_phones?: string;
  address_city_state?: string;
  associated_account_name?: string;
  last_activity_time?: string;
}

interface PeopleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: ContactSummary | null;
}

export const PeopleSummaryModal: React.FC<PeopleSummaryModalProps> = ({ isOpen, onClose, contact }) => {
  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-5 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">✕</button>
        
        {/* Perfil Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white font-black text-xl flex items-center justify-center">
            {contact.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{contact.name}</h3>
            {contact.job_title && <p className="text-xs font-semibold text-indigo-600 mt-0.5">{contact.job_title}</p>}
            {contact.associated_account_name && <p className="text-xs text-slate-500">{contact.associated_account_name}</p>}
          </div>
        </div>

        {/* Detalhes de Contato */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          {contact.email && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">E-mail:</span>
              <a href={`mailto:${contact.email}`} className="font-semibold text-slate-800 hover:underline">{contact.email}</a>
            </div>
          )}
          {contact.mobile_phones && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Telefone Celular:</span>
              <span className="font-semibold text-slate-800">{contact.mobile_phones}</span>
            </div>
          )}
          {contact.address_city_state && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Localização:</span>
              <span className="font-semibold text-slate-800">{contact.address_city_state}</span>
            </div>
          )}
          {contact.last_activity_time && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Última Atividade:</span>
              <span className="font-semibold text-slate-800 bg-slate-100 py-1 px-2.5 rounded-full text-[10px]">{contact.last_activity_time}</span>
            </div>
          )}
        </div>

        {/* Links de Ação Rápida */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <a href={`mailto:${contact.email}`} className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-bold text-slate-700 hover:text-indigo-700 rounded-xl transition-all">
            Enviar E-mail
          </a>
          <button onClick={onClose} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-md transition-colors">
            Ver Perfil 360°
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 5. Configuração de Rastreamento & API Setup (`ApiTrackingSetupModal`)
*   **Propósito**: Configurar a chave de integração API e visualizar o script de tracking para o website institucional da Avalia Solar.

```tsx
import React, { useState } from 'react';

interface ApiTrackingSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  trackingDomain: string;
}

export const ApiTrackingSetupModal: React.FC<ApiTrackingSetupModalProps> = ({ isOpen, onClose, apiKey, trackingDomain }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const trackingScript = `<!-- Script de Rastreamento Avalia Solar Leads -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['AvaliaLeadsObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},
    w[o].l=1*new Date();js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.async=1;js.src=f;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','avaliaLeads','https://leads.avaliasolar.com.br/tracking.js'));
  avaliaLeads('init', '${apiKey}');
  avaliaLeads('track', 'PageView');
</script>`;

  const copyToClipboard = (text: string, isScript: boolean) => {
    navigator.clipboard.writeText(text);
    if (isScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Integrações & Rastreamento Web</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Sessão Chave de API */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800">Chave de API do Sistema</h3>
            <p className="text-xs text-slate-500">Utilize esta chave para fazer requisições de servidores externos ao banco relacional.</p>
            <div className="flex gap-2">
              <input readOnly type="text" value={apiKey} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-xs outline-none" />
              <button onClick={() => copyToClipboard(apiKey, false)} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors">
                {copiedKey ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Script de Rastreamento de Leads */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800">Script de Rastreamento de Leads (Landing Pages)</h3>
            <p className="text-xs text-slate-500">Cole este script na seção <code className="bg-slate-100 py-0.5 px-1 rounded">&lt;head&gt;</code> do seu website para registrar novos acessos e capturar leads automaticamente.</p>
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48">
                {trackingScript}
              </pre>
              <button onClick={() => copyToClipboard(trackingScript, true)} className="absolute right-3 top-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all backdrop-blur-sm">
                {copiedScript ? 'Copiado!' : 'Copiar Script'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors">
            Fechar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 7. FUNÇÕES UTILITÁRIAS DO ECOSSISTEMA (`utilities.ts`)

Estas funções embutem as lógicas matemáticas de dimensionamento, tratamento financeiro e parsing de dados, garantindo consistência técnica em toda a plataforma.

```typescript
// =========================================================================
// 1. Formatação de Moeda Brasileira (R$)
// =========================================================================
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

// =========================================================================
// 2. Algoritmo de Dimensionamento Técnico Solar (Fórmula Integrada)
// =========================================================================
interface SolarDimensioningInput {
  monthlyConsumptionKwh: number;
  monthlyBillValue: number;
  roofType: string;
  solarRadiationIndex?: number; // HSP (Horas de Sol Pleno diárias)
  panelPowerW?: number; // Potência individual de cada placa solar
  costPerKwp?: number; // Custo de mercado por kWp instalado
}

interface SolarDimensioningResult {
  estimatedSystemKwp: number;    // Potência de pico do gerador (kWp)
  panelQuantity: number;         // Número de placas solares necessárias
  estimatedGenerationKwh: number; // Produção média mensal estimada de energia (kWh)
  estimatedAnnualSavings: number;// Economia média ao ano (R$)
  estimatedPaybackYears: number; // Tempo de retorno do investimento (Anos)
  inverterSpecification: string; // Tipo de inversor técnico ideal
}

export const calculateSolarSystem = (input: SolarDimensioningInput): SolarDimensioningResult => {
  const hsp = input.solarRadiationIndex || 4.5; // Média nacional conservadora
  const panelPower = input.panelPowerW || 550; // Placas solares topo de linha de 550W
  const costKwp = input.costPerKwp || 4500; // Custo de investimento de R$ 4.500,00 por kWp

  // Eficiência global do sistema fotovoltaico (considerando perdas térmicas e cabos de 20%)
  const efficiencyLossFactor = 0.80; 

  // 1. Potência do Sistema (kWp) necessária para suprir o consumo mensal
  // Fórmula: kWp = Consumo / (30 dias * HSP * Eficiência)
  const estimatedSystemKwp = input.monthlyConsumptionKwh / (30 * hsp * efficiencyLossFactor);

  // 2. Quantidade de Painéis Solares
  // Quantidade = (Potência kWp * 1000) / Potência Placa
  const panelQuantity = Math.ceil((estimatedSystemKwp * 1000) / panelPower);

  // 3. Geração Mensal Real Estável (kWh) baseada na quantidade física de painéis
  const actualSystemKwp = (panelQuantity * panelPower) / 1000;
  const estimatedGenerationKwh = actualSystemKwp * 30 * hsp * efficiencyLossFactor;

  // 4. Economia Anual Calculada
  // Economia Mensal = Geração Mensal * Custo da Tarifa média (Tarifa aproximada de R$ 0,95 por kWh)
  const estimatedMonthlySavings = estimatedGenerationKwh * 0.95;
  const estimatedAnnualSavings = estimatedMonthlySavings * 12;

  // 5. Payback
  // Investimento Total Estimado = kWp real * custo por kWp de mercado
  const estimatedInvestment = actualSystemKwp * costKwp;
  const estimatedPaybackYears = estimatedInvestment / estimatedAnnualSavings;

  // 6. Especificação Recomendada do Inversor
  let inverterSpecification = 'Microinversor Dual APsystems';
  if (panelQuantity > 8) {
    inverterSpecification = 'Inversor Central Grid-Tie Growatt/Solis';
  }

  return {
    estimatedSystemKwp: parseFloat(actualSystemKwp.toFixed(2)),
    panelQuantity,
    estimatedGenerationKwh: parseFloat(estimatedGenerationKwh.toFixed(1)),
    estimatedAnnualSavings: parseFloat(estimatedAnnualSavings.toFixed(2)),
    estimatedPaybackYears: parseFloat(estimatedPaybackYears.toFixed(2)),
    inverterSpecification
  };
};

// =========================================================================
// 3. Parser de Importação de Arquivos CSV (Ex: Leads.csv, Accounts.csv)
// =========================================================================
export const parseCsvImport = (csvContent: string): Array<Record<string, string>> => {
  const lines = csvContent.split('\n');
  if (lines.length === 0) return [];

  // Capturar cabeçalho removendo caracteres de BOM
  const headers = lines[0].replace(/^\uFEFF/, '').split(',');
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (!currentLine) continue;

    const values: string[] = [];
    let insideQuotes = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < currentLine.length; charIndex++) {
      const char = currentLine[charIndex];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header.trim()] = values[index];
      });
      results.push(rowObj);
    }
  }

  return results;
};

// =========================================================================
// 4. Calculadora de Engajamento de Leads (Lead Scoring Inteligente)
// =========================================================================
interface LeadScoringInput {
  confidence: number;            // Confiança cadastrada de 0 a 100
  value: number;                 // Valor financeiro do projeto
  daysInPipeline: number;        // Dias desde a criação do lead
  timelineActivitiesCount: number; // Atividades finalizadas
  hasSolarProject: boolean;      // Possui especificação técnica solar detalhada?
}

export const calculateLeadScore = (input: LeadScoringInput): number => {
  let score = 0;

  // 1. Pontuação por valor financeiro (Mais valioso = Maior pontuação, teto de 30 pts)
  score += Math.min((input.value / 10000) * 5, 30);

  // 2. Pontuação por Confiança do Vendedor (Teto de 20 pts)
  score += (input.confidence / 100) * 20;

  // 3. Pontuação de Qualificação Técnica (Lead com projeto solar estruturado = +25 pts)
  if (input.hasSolarProject) {
    score += 25;
  }

  // 4. Pontuação por Volume de Interações na Timeline (Teto de 15 pts)
  score += Math.min(input.timelineActivitiesCount * 3, 15);

  // 5. Penalidade por Estagnação no Pipeline
  if (input.daysInPipeline > 45) {
    score -= 10; // Estagnado por mais de 45 dias perde relevância
  }

  return Math.max(0, Math.min(Math.round(score), 100));
};
```

---

## 8. MATRIZ DE RASTREABILIDADE TÉCNICA (Traceability Blueprint)

Este mapeamento garante que cada elemento do banco relacional, rotas de API e modais de UI estejam perfeitamente conectados.

| Entidade de Origem (CSV) | Tabela Banco (PostgreSQL) | Rota Backend correspondente | Modal de Interface (UI) | Função Utilitária Aplicada |
| :--- | :--- | :--- | :--- | :--- |
| `Leads.csv` | `leads` | `POST /leads` | `NewLeadModal` | `calculateSolarSystem` (Cálculo inline) |
| `Leads.csv` | `solar_projects` | `GET /leads/:id/solar-project` | `NewLeadModal` (Seção Solar) | `calculateSolarSystem` (Payback & Geração) |
| `Emails.csv` | `emails` | `POST /emails/send` | `EmailComposerModal` | N/A (Disparo integrado SMTP/IMAP) |
| `Notes.csv` | `notes` | `POST /notes` | `NoteModal` | N/A (Autocomplete de @Usuários) |
| `Contacts.csv` | `contacts` | `GET /contacts` | `PeopleSummaryModal` | N/A (Detalhamento dinâmico) |
| `Accounts.csv` | `accounts` | `GET /accounts` | N/A (Filtros de Indústria e Território) | `parseCsvImport` (Carregamento em Lote) |

Este blueprint unifica a inteligência do ecossistema do **CRM Avalia Solar**, provendo todo o ferramental técnico necessário para que o time de desenvolvimento execute a migração com total segurança, estabilidade e fidelidade operacional às fontes originais do sistema.
