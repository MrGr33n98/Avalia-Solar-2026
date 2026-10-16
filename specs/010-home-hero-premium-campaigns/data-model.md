# Modelo de Dados e Estratégia de Migração

**Feature:** `010-home-hero-premium-campaigns`  
**Escopo:** Migração Aditiva (Non-Breaking)

---

## 1. Estratégia de Compatibilidade

A implementação é estritamente **aditiva**. Não renomeia nem remove nenhuma coluna existente da tabela `banners`.
- `title` legado continua existindo e passa a servir como **nome interno** de identificação no ActiveAdmin.
- `link` legado continua funcionando como destino fallback.
- `home_top` permanece com suas dimensões e contratos comerciais intocados.
- Um novo valor de placement `'home_hero'` é introduzido em `BannerPlacements::Catalog`.

---

## 2. Novos Campos Propostos na Tabela `banners`

| Coluna | Tipo | Default | Restrições / Validações | Finalidade |
|---|---|---|---|---|
| `headline` | `string` | `nil` | Limite de 110 caracteres | Título público exibido na home |
| `subtitle` | `text` | `nil` | Limite de 180 caracteres | Linha de apoio e contexto |
| `cta_label` | `string` | `nil` | Limite de 36 caracteres | Rótulo do botão de ação |
| `cta_href` | `string` | `nil` | Limite de 2048 caracteres, URL/Path seguro | Link de destino do botão |
| `cta_enabled` | `boolean` | `true` | Not null | Liga/desliga botão na UI |
| `theme` | `string` | `'dark'` | Enum: `['dark', 'light']` | Esquema de cor base do texto |
| `cta_variant` | `string` | `'solar_yellow'`| Enum: `['solar_yellow', 'primary_blue', 'outline', 'custom']` | Estilo do botão |
| `hero_background_color` | `string` | `nil` | Regex: `^#[0-9A-Fa-f]{6}$` | Cor sólida de fundo |
| `hero_text_color` | `string` | `nil` | Regex: `^#[0-9A-Fa-f]{6}$` | Cor personalizada do título |
| `cta_background_color` | `string` | `nil` | Regex: `^#[0-9A-Fa-f]{6}$` | Fundo do botão no modo custom |
| `cta_text_color` | `string` | `nil` | Regex: `^#[0-9A-Fa-f]{6}$` | Texto do botão no modo custom |
| `overlay_variant` | `string` | `'left_soft'` | Enum: `['none', 'left_soft', 'left_strong']` | Nível de proteção de contraste |
| `creative_mode` | `string` | `'photo_with_html'` | Enum: `['photo_with_html', 'image_only']` | Modo de renderização |
| `object_position_desktop_x` | `integer` | `50` | Faixa: 0 a 100 (%) | Ponto focal horizontal desktop |
| `object_position_desktop_y` | `integer` | `50` | Faixa: 0 a 100 (%) | Ponto focal vertical desktop |
| `object_position_mobile_x` | `integer` | `50` | Faixa: 0 a 100 (%) | Ponto focal horizontal mobile |
| `object_position_mobile_y` | `integer` | `50` | Faixa: 0 a 100 (%) | Ponto focal vertical mobile |
| `whole_banner_clickable` | `boolean` | `false` | Not null | Permitir clique em toda a área |
| `creative_version` | `integer` | `1` | Not null, auto-increment na edição | Cache busting e auditoria |

---

## 3. Anexos Active Storage

- `has_one_attached :image` (mantido como imagem principal / desktop).
- `has_one_attached :image_mobile` (novo anexo opcional para criativo vertical/mobile).

---

## 4. Estratégia de Migração (Fases)

1. **Fase 1 (Migration Aditiva no Rails):**
   - Criação das colunas com defaults seguros e sem bloqueios de lock.
   - Adição do slot `'home_hero'` em `BannerPlacements::Catalog` com dimensões `[1920, 420]`.
2. **Fase 2 (Atualização de Serializers e API):**
   - `Api::V1::BannersController` passa a serializar os novos campos quando disponíveis.
   - Preserva backward-compatibility total com clientes legados.
3. **Fase 3 (ActiveAdmin UI):**
   - Atualização do formulário com abas de Conteúdo, Mídia responsiva e Cores.
4. **Fase 4 (Frontend Behind Feature Flag):**
   - O `HomeHeroBanner` passa a consumir `home_hero` se existir, com fallback gracioso para `home_top`.
