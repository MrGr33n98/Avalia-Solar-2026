# SPEC 022-P — Dashboard Performance Engineering A+++
Versão 1.2 | extensão da Spec 022 v1.1, não nova numeração de feature.
## Ordem vinculante
1. Ler INSPIRATION-ONLY.md e este documento; a estética segue exclusivamente Tremor como referência, sem instalar/copiar.
2. Executar somente A0–A3 (read-only) em `tasks.md` deste diretório. Não editar produto, abrir PR de implementação, instalar dependência, alterar flag, disparar mutações reais ou fazer deploy. Evidências e documentos de auditoria podem ser escritos em scratchpad seguro. Não rodar carga em produção.
3. Entregar relatório de baseline, gaps, RCA, PRD refinado, roadmap, evidências e decisão por hipótese. Parar no gate D0. Solicitar autorização para fase B.
4. Após aprovação explícita, integrar B0–B6 às waves existentes do tasks.md da raiz. Cada mudança tem teste RED, GREEN, REFACTOR e evidência antes/depois; não duplicar trabalho das Specs 014/017/019/020/021. W0 de redesign depende de D0.
## Fonte de verdade
A raiz contém inventário das 121 rotas, 40 blocos de abas e 74 tarefas existentes. Esta extensão acrescenta requisitos de desempenho, não retira nenhuma funcionalidade. Em caso de conflito de ordem, vale o gate read-only primeiro. Não considerar as contagens como 121 telas autorizadas ou efetivamente renderizadas; aliases e flags devem ser confirmados.
## Alvo inicial
/dashboard?company_id=372 somente com sessão e membership legítimas e navegação passiva. Se indisponível, registrar BLOCKED; usar staging/local com tenants sintéticos A/B, nunca reutilizar dados de cliente. Não capturar cookies, headers de autenticação, PII ou payloads sensíveis. Nenhuma sessão compartilhada por chat.
## Entrega D0
baseline.csv preenchido com medições reais, inventário por rota/aba/componente, traces sanitizados, matriz de hipóteses confirmadas/refutadas/inconclusivas, quick wins ranqueados por impacto/esforço e decisão de arquitetura. Sem evidência não há PASS.
