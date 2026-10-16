# Matriz de Testes de Aceite — Hero Premium

**Feature:** `010-home-hero-premium-campaigns`  
**Padrão:** Given / When / Then rigoroso  
**Critério de Aprovação:** P0 = 100% de aprovação comprovada com testes executados.

---

## 1. Cenários de Aceite (AC-01 a AC-30)

| ID | Cenário | Resultado Exigido | Status |
|---|---|---|---|
| **AC-01** | Admin cria `home_hero` com copy e CTA | API entrega `headline`, `subtitle`, `cta_label`, `cta_href` e cores validadas. | Pendente (PR 1) |
| **AC-02** | Admin altera apenas título interno | Texto público exibido na home não se altera. | Pendente (PR 2) |
| **AC-03** | Admin altera headline pública | Preview e publicação atualizam apenas após aprovação do moderador. | Pendente (PR 2) |
| **AC-04** | Alterar tema escuro/claro e CTA variant | Contraste de texto legível (>= 4.5:1) nas larguras 320, 390, 768 e 1440 px. | Pendente (PR 3) |
| **AC-05** | Banner claro com overlay desativado | Imagem com texto integrado exibe sem sobreposição de headline duplicada. | Pendente (PR 3) |
| **AC-06** | Imagem 1920×420 desktop | Hero CSS permanece em 280px (>= 768px), sem corte do assunto principal. | Pendente (PR 3) |
| **AC-07** | Imagem 780×460 mobile | Hero CSS permanece em 210px (< 640px), servindo a arte vertical dedicada. | Pendente (PR 3) |
| **AC-08** | Mídia mobile omitida no cadastro | Fallback seguro para a imagem desktop com aviso de recomendação na prévia. | Pendente (PR 2) |
| **AC-09** | Imagem legada 1200×160 | Não é ampliada para o hero premium; aviso de qualidade exibido. | Pendente (PR 1) |
| **AC-10** | Alterações no slot `home_hero` | O slot comercial legado `home_top` permanece com suas rotas inalteradas. | Pendente (PR 1) |
| **AC-11** | Zero campanhas válidas | Renderiza 1 banner institucional único, sem barras ou setas vazias. | Pendente (PR 3) |
| **AC-12** | Duas ou mais campanhas aprovadas | Setas, swipe touch, barras e autocarrossel funcionam e respondem a foco. | Pendente (PR 3) |
| **AC-13** | Reduced motion ou aba oculta | Animações pausadas e autoplay suspenso conforme contrato de acessibilidade. | Pendente (PR 6) |
| **AC-14** | Admin usa a prévia no painel | Nenhuma impressão ou clique é registrado na telemetria de anúncios. | Pendente (PR 2) |
| **AC-15** | Visitante visualiza anúncio na viewport | Evento `view` registrado uma única vez com `delivery_id` e metadados. | Pendente (PR 5) |
| **AC-16** | Visitante aciona botão CTA | Navega para destino validado com registro deduplicado de clique. | Pendente (PR 5) |
| **AC-17** | Clique repetido com mesmo ID de instância| Zero contagem duplicada no banco de métricas. | Pendente (PR 5) |
| **AC-18** | Tentativa de URL maliciosa (`javascript:`, `//evil`) | Servidor rejeita na validação e impede persistência. | Pendente (PR 1) |
| **AC-19** | Upload de arquivo executável ou SVG falso | Validação server-side recusa com mensagem de erro clara. | Pendente (PR 1) |
| **AC-20** | Anunciante sem plano ativo tenta publicar | Sistema bloqueia veiculação comercial sem afetar campanhas institucionais. | Pendente (PR 1) |
| **AC-21** | Banner patrocinado exibido | Selo "Publicidade" visível sem alterar rating ou selo orgânico da empresa. | Pendente (PR 5) |
| **AC-22** | Banner expirado ou pausado | Desaparece da home dentro do SLA estipulado (< 60s). | Pendente (PR 4) |
| **AC-23** | API Rails retorna 503 | Fallback institucional renderizado sem quebrar o SSR da página. | Pendente (PR 3) |
| **AC-24** | Atualização de mídia | Novo arquivo exibido na home sem persistência da imagem antiga no cache. | Pendente (PR 4) |
| **AC-25** | Edições concorrentes | Sem sobrescrita silenciosa; histórico gravado em `BannerAuditLog`. | Pendente (PR 2) |
| **AC-26** | Zoom de browser em 50%, 100% e 200% | Textos, botões e foco permanecem utilizáveis sem colisão de layout. | Pendente (PR 7) |
| **AC-27** | Viewports 320, 375, 390, 430, 768, 1024, 1440 | Sem overflow horizontal e alturas CSS estritamente respeitadas. | Pendente (PR 7) |
| **AC-28** | Relatório de performance pós-deploy | Comparativo real de LCP/CLS e bytes transferidos documentado. | Pendente (PR 4) |
| **AC-29** | Frequência por usuário | UI não promete limitação de frequência até que o método seja corrigido. | Pendente (PR 5) |
| **AC-30** | Link interno relativo | Destinos como `/companies` ou `/pricing` são aceitos e normalizados. | Pendente (PR 1) |

---

## 2. Gates de Liberação

- **P0 (Bloqueador de Lançamento):** AC-01 a AC-11, AC-14 a AC-18, AC-20 a AC-28, AC-30.
- **P1 (Bloqueador de Comercialização):** AC-12, AC-13, AC-19, AC-21, AC-25, AC-29.
- **P2 (Evolução Contínua):** Transições avançadas e formatos de vídeo.
