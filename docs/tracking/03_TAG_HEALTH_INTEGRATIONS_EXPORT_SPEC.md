# Especificação Técnica — PR 4: Tag Health, Validação HTTPS e Exportação Segura (CSV)

## 1. Visão Geral
O **PR 4** consolida os serviços avançados de diagnóstico de saúde da tag de parceiro, auditoria estrita de domínios permitidos (HTTPS / localhost), integridade de telemetria sem dados sintéticos e motor de exportação de dados analíticos com proteção rigorosa contra injeção de fórmulas no Excel (CSV Formula Injection) e suporte nativo a acentuação UTF-8 (BOM).

---

## 2. Componentes e Serviços

### 2.1 Monitor de Saúde da Tag (`TagHealthMonitorService`)
Localização: `AB0-1-back/app/services/company_dashboard/tag_health_monitor_service.rb`

#### Máquina de Estados da Tag
1. `tag_not_installed`: Nenhum registro `Sales::TrackingSite` associado à empresa.
2. `inactive`: Tag configurada, porém com flag `active: false`.
3. `configured_no_evidence`: Tag ativa, mas nenhuma telemetria (sessão ou evento) registrada ainda.
4. `possibly_inactive`: Última telemetria registrada há mais de 7 dias.
5. `healthy`: Telemetria recente recebida com sucesso nos últimos 7 dias.

#### Métricas Auditadas
- **Volume Recente:** Contagem exata de eventos nas últimas 24 horas (`events_last_24h`) e 7 dias (`events_last_7d`).
- **Sessões e Consentimento:** Contagem de sessões nos últimos 7 dias (`sessions_last_7d`) e taxa percentual de consentimento LGPD concedido (`consent_grant_rate = granted / total * 100`).
- **Auditoria de Origens:** Confirmação de que todas as origens cadastradas utilizam estritamente protocolo seguro `https://` (ou `http://localhost` para desenvolvimento).
- **Referrers Observados:** Amostra real dos hosts de referência capturados pelo script sem duplicatas.

---

### 2.2 Motor de Exportação Segura (`ProspectsExportService`)
Localização: `AB0-1-back/app/services/company_dashboard/prospects_export_service.rb`

#### Mitigações de Segurança e Usabilidade
1. **Defesa Contra CSV Formula Injection (DDE):** Valores que iniciam com `=`, `+`, `-`, `@`, `\t` ou `\r` são prefixados com aspas simples (`'`), prevenindo execução remota de código ou vazamento de dados via planilhas (Excel, LibreOffice, Google Sheets).
2. **Prevenção de Mojibake (UTF-8 BOM):** Inclusão do marcador Byte Order Mark (`\uFEFF`) no início do payload CSV, garantindo exibição perfeita de caracteres em português (ex: "Não identificado", "Perfil no Marketplace", "Apenas clique") ao abrir com duplo clique no Microsoft Excel.
3. **Mapeamento Legível de Origem e Evidência:**
   - Origens mapeadas: Perfil no Marketplace, Comparador Solar, Calculadora Solar, Catálogo de Empresas, Solicitação de Proposta, Destaque Patrocinado, etc.
   - Evidências mapeadas: Apenas clique, Chegada verificada, Formulário observado, Lead confirmado.
4. **Cálculo de Duração Real:** Diferença em segundos entre o início da sessão e o último evento disparado.

---

## 3. Endpoints da API

| Método | Rota | Descrição | Políticas de Acesso |
|---|---|---|---|
| `GET` | `/api/v1/company_dashboard/analytics/prospects/health` | Diagnóstico de saúde da tag e integridade | `CompanyPolicy#view_analytics?` + Tenancy |
| `GET` | `/api/v1/company_dashboard/analytics/prospects/export` | Download do relatório CSV sanitizado | `CompanyPolicy#view_analytics?` + Tenancy |

---

## 4. Evidência de Testes Automatizados

### RSpec Backend (`spec/services/company_dashboard/`)
- `tag_health_monitor_service_spec.rb`: 5 cenários cobrindo todos os estados de saúde, cálculo de consentimento e isolamento multi-tenant.
- `prospects_export_service_spec.rb`: 5 cenários cobrindo UTF-8 BOM, sanitização contra fórmulas, labels legíveis, filtros de evidência/busca e isolamento multi-tenant.
- `company_dashboard_prospects_spec.rb`: 9 cenários ponta a ponta cobrindo os controladores REST, segurança 403 e persistência de integrações GA4.

**Resultado:** 28 examples, 0 failures (100% aprovado).
