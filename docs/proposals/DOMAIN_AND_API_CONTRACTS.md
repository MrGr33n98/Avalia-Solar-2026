# Domain and API Contracts — Avalia Solar Proposal Studio

**Versão:** 2.0.0  
**Data:** 14 de Outubro de 2026  
**Ambiente:** Rails 7 API (`AB0-1-back`) & Next.js 14 App Router (`AB0-1-front`)  

---

## 1. Modelo de Domínio Rails

### Tabela `company_proposal_settings`
```ruby
# Migration: db/migrate/20261014120000_create_company_proposal_settings.rb
create_table :company_proposal_settings do |t|
  t.references :company, null: false, foreign_key: true, index: { unique: true }
  t.string :selected_pdf_model, default: 'modelo_1', null: false
  t.string :cover_image_option, default: 'solar_ceu', null: false
  t.jsonb :pdf_colors, default: { primary: '#0066FF', secondary: '#0F172A', accent: '#F6E85A' }
  t.jsonb :sections_config, default: {}
  t.jsonb :pricing_tiers, default: []
  t.jsonb :payment_conditions, default: []
  t.jsonb :digital_sections, default: []
  t.jsonb :custom_form_fields, default: []
  t.timestamps
end
```

### Model `CompanyProposalSetting`
```ruby
class CompanyProposalSetting < ApplicationRecord
  belongs_to :company

  AVAILABLE_MODELS = %w[modelo_1 modelo_2 modelo_3].freeze
  AVAILABLE_COVERS = %w[padrao solar_ceu usina_solo custom].freeze

  validates :company_id, presence: true, uniqueness: true
  validates :selected_pdf_model, inclusion: { in: AVAILABLE_MODELS }
  validates :cover_image_option, inclusion: { in: AVAILABLE_COVERS }
end
```

---

## 2. Contratos de API RESTful

### 2.1 Obter Configurações da Empresa
- **Rota:** `GET /api/v1/company_dashboard/proposal_settings?company_id=:company_id`
- **Autenticação:** JWT Bearer Token (`current_user`)
- **Autorização:** Pundit `CompanyPolicy#show?`
- **Resposta Sucesso (200 OK):**
```json
{
  "id": 1,
  "company_id": 1,
  "selected_pdf_model": "modelo_1",
  "cover_image_option": "solar_ceu",
  "pdf_colors": {
    "primary": "#0066FF",
    "secondary": "#0F172A",
    "accent": "#F6E85A"
  },
  "pdf_sections": [
    { "id": "1", "key": "sobre_empresa", "label": "Sobre a empresa", "enabled": true, "content": "..." },
    { "id": "2", "key": "imagem_obras", "label": "Imagens de obras", "enabled": true, "content": "" }
  ],
  "payment_conditions": [
    { "id": "boleto", "name": "Boleto", "enabled": true, "installments": 1, "discountPercent": 5 },
    { "id": "cartao", "name": "Cartão de crédito", "enabled": false, "installments": 12, "discountPercent": 0 },
    { "id": "financiamento", "name": "Calculadora de financiamentos", "enabled": false, "installments": 72 },
    { "id": "transferencia", "name": "Transferência", "enabled": true, "installments": 1, "discountPercent": 5 }
  ],
  "pricing_tiers": [
    {
      "id": "p1",
      "status": true,
      "costName": "Mão de Obra e Instalação Padrão",
      "pricePerKwp": 650.0,
      "fromKwp": 0,
      "toKwp": 10,
      "calculationType": "Por kWp"
    }
  ],
  "digital_sections": [
    { "id": "d1", "key": "cronograma", "label": "Cronograma", "enabled": false }
  ],
  "updated_at": "2026-10-14T02:30:00Z"
}
```

### 2.2 Atualizar Configurações da Empresa
- **Rota:** `PATCH /api/v1/company_dashboard/proposal_settings`
- **Payload (JSON):**
```json
{
  "company_id": 1,
  "selected_pdf_model": "modelo_2",
  "cover_image_option": "solar_ceu",
  "pdf_colors": {
    "primary": "#0066FF",
    "secondary": "#0F172A",
    "accent": "#F6E85A"
  },
  "pdf_sections": [...],
  "payment_conditions": [...],
  "pricing_tiers": [...]
}
```
- **Resposta Sucesso (200 OK):** Objeto serializado atualizado.
- **Respostas de Erro:**
  - `401 Unauthorized`: Usuário sem sessão ativa.
  - `403 Forbidden`: Usuário não tem permissão de gerenciar a empresa informada.
  - `422 Unprocessable Entity`: Parâmetros inválidos ou schema rejeitado.

---

## 3. Contratos TypeScript Frontend (`AB0-1-front/lib/api.ts`)

```typescript
export interface CompanyProposalSettingsPayload {
  id?: number;
  company_id: number;
  selected_pdf_model?: 'modelo_1' | 'modelo_2' | 'modelo_3';
  cover_image_option?: 'padrao' | 'solar_ceu' | 'usina_solo' | 'custom';
  pdf_colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  pdf_sections?: Array<{
    id: string;
    key: string;
    label: string;
    enabled: boolean;
    content?: string;
    details?: Record<string, any>;
  }>;
  payment_conditions?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    hasInfo?: boolean;
    infoText?: string;
    installments?: number;
    discountPercent?: number;
  }>;
  pricing_tiers?: Array<{
    id: string;
    status: boolean;
    costName: string;
    pricePerKwp: number;
    fromKwp: number;
    toKwp: number;
    calculationType: 'Por kWp' | 'Fixo por projeto' | 'Percentual';
  }>;
  digital_sections?: Array<{
    id: string;
    key: string;
    label: string;
    enabled: boolean;
  }>;
  custom_form_fields?: any[];
  updated_at?: string;
}

export const companyProposalSettingsApi = {
  get: (companyId: number | string): Promise<CompanyProposalSettingsPayload> =>
    apiClient.get(`/api/v1/company_dashboard/proposal_settings?company_id=${companyId}`),
  update: (payload: Partial<CompanyProposalSettingsPayload> & { company_id: number | string }): Promise<CompanyProposalSettingsPayload> =>
    apiClient.patch('/api/v1/company_dashboard/proposal_settings', payload),
};
```
