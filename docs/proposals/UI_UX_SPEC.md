# UI/UX Specification — Proposal Studio Enterprise Avalia Solar

**Versão:** 2.0.0  
**Data:** 14 de Outubro de 2026  
**Guia Visual:** Design System Avalia Solar (AS-EDS)  

---

## 1. Arquitetura de Espaço em 3 Zonas

Dentro da área de conteúdo útil da aplicação (descontando a sidebar global da plataforma):

```
+-----------------------------------------------------------------------------------------+
| [TOPBAR] Configurações — Love Solar Teste | Abas: Empresa | Definições de propostas    |
+-------------------+---------------------------------------------+-----------------------+
| ZONA A: SUBMENU   | ZONA B: CANVAS PRINCIPAL                     | ZONA C: DRAWER        |
| (210px ~ 224px)   | (Flexível, 1 coluna fluida até ~900px)      | (380px ~ 420px)       |
|                   |                                             |                       |
| Geral             | [Banner Azul] Definir Modelo da Proposta    | < Modelo de Proposta  |
| - Mão de obra     | [Card] Cores da proposta PDF      [Editar]  |                       |
| - Cond. pagamento | [Card] Imagem de capa             [Editar]  | [Card Modelo 1]       |
|                   |                                             | [Card Modelo 2]       |
| Proposta PDF      | Status | Informações | Ação                 | [Card Modelo 3]       |
| - Configurações   | [O] Sobre a empresa               [Editar]  |                       |
|                   | [O] Imagens de obras              [Editar]  | [Prévia Modelo 3]     |
| Proposta Digital  | [ ] Título                        [Editar]  |                       |
| - Configurações   | [O] Garantias                     [Editar]  | [Salvar modelo padrão]|
| - Cores           | [ ] Termos e condições            [Editar]  |                       |
| - ROI             | [O] Cronograma                    [Editar]  |                       |
+-------------------+---------------------------------------------+-----------------------+
```

---

## 2. Design Tokens e Tipografia

| Elemento | Token AS-EDS / Especificação | Rationale |
| :--- | :--- | :--- |
| **Fonte Primária** | `Inter`, sans-serif | Tipografia oficial do Avalia Solar, sem importar assets de terceiros. |
| **H1 Página** | `text-2xl font-black text-slate-900` (24px) | Título institucional de alto nível. |
| **H2 / Seção** | `text-xl font-black text-slate-900` (20px) | Títulos das seções de configuração no canvas. |
| **Labels Navegação** | `text-xs font-bold text-slate-700` (12–13px) | Legibilidade ergonômica (proibido labels de 9–10px como primários). |
| **Linhas Configuráveis** | Altura mínima 56px, `p-4 hover:bg-slate-50/50` | Área de toque e clique acessível (WCAG AA). |
| **Cantos / Border Radius** | `rounded-2xl` (16px) em containers e `rounded-xl` (12px) em botões/inputs | Estilo claymorphic suave e moderno. |
| **Cor Brand Primária** | `#0066FF` (Azul Avalia Solar) | Destaque e confiabilidade institucional. |
| **Cor Neutra Escura** | `#0F172A` (Slate 900) | Contraste máximo em textos e títulos. |
| **Cor de Acento** | `#F6E85A` (Amarelo Solar) | Ênfase sutil em elementos de destaque da marca. |
| **Fundo da Aplicação** | `#F8FAFC` (Slate 50) com cartões `#FFFFFF` | Visual clean, profissional e sem poluição de gradientes. |

---

## 3. Comportamento dos Drawers e Modais

### 3.1 Drawer de Modelo (`PdfModelChooserDrawer.tsx`)
- Largura: `w-full sm:w-[380px] md:w-[420px]`.
- Animação de entrada: `animate-in slide-in-from-right duration-200`.
- Seleção de modelo: destaque com borda azul 2px e badge circular com ícone Check.
- Ação no rodapé: botão fixo sticky `"Salvar como modelo padrão"` com feedback de loading (`Salvando no servidor...`).

### 3.2 Modal de Prévia Ampliada (`PdfPreviewModal.tsx`)
- Renderização em proporção exata de folha A4 (`aspect-[1/1.414]`).
- Controles de zoom no cabeçalho: 70%, 85%, 100%, 115%, 130%, 150%.
- Paginação técnica: navegação entre Página 1 (Capa e Resumo), Página 2 (Equipamentos e Cronograma) e Página 3 (Garantias e Condições Comerciais).

### 3.3 Drawer de Edição de Seções (`SectionEditorDrawer.tsx`)
- Abre ao clicar em `Editar` em qualquer linha do canvas.
- Campos de texto com contadores de caracteres e validações em tempo real.
- Botão "Salvar alterações" persiste diretamente no backend Rails com atualização visual instantânea.

---

## 4. Adaptação para Viewports Mobile e PWA (320px–768px)
- Aba superior compacta com botões de alternância (`Minhas propostas` | `Modelos`).
- Submenu lateral colapsa em selector ou acordeão touch.
- Drawers abrem como bottom-sheet ou tela completa (`w-full h-full inset-0 fixed`).
- Altura de toque mínima: 44px em todos os botões e switches.
