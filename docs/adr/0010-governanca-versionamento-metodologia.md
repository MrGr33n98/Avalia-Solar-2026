# ADR 0010: Governança e versionamento da metodologia de ranking

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Publicação, versionamento e reprodução metodológica de rankings

## Contexto

O código atual tem versões parciais em constantes, mas não um manifesto composto que identifique todas as regras de um snapshot. ENV e regras de código podem evoluir independentemente; snapshots guardam uma versão geral e resultados, mas não referências a versões específicas de fórmula, elegibilidade, quality gates, geografia/fallback, benchmark, janela de dados e desempate. O Git registra código e revisão, porém não é uma referência metodológica direta suficiente no snapshot.

## Decisão

A arquitetura-alvo adotará um conceito equivalente a `MethodologyManifest`: um manifesto publicado, versionado, imutável, auditável, referenciável e orientado à reprodução. Ele terá identidade metodológica e release/versão composta, além de referências explícitas às versões dos componentes governados relevantes — no mínimo fórmula, elegibilidade, quality gates, geografia, fallback, benchmark, janela de dados e desempate, com demais políticas quando aplicável. Não criar schema ou formato agora.

Metodologia terá lifecycle conceitual separado entre draft e published. Draft pode ser alterado e avaliado em preview/experimento; release publicado não pode ser editado em lugar. Mudança capaz de alterar score, ordem, população, fallback, publicabilidade ou benchmark exige novo release ou nova referência imutável de componente conforme política futura. Não se pode manter o mesmo release e mudar silenciosamente parâmetro efetivo via ENV, Admin, configuração em banco ou feature flag.

Os parâmetros efetivos precisam estar resolvidos por referência imutável e reproduzível; uma versão não pode apontar para configuração mutable que muda retroativamente. Git, commit/release/artifact continuam evidência importante de implementação, mas o snapshot deve identificar diretamente o manifesto e contexto usados, sem depender de inferência futura do commit ativo. Formato exato de commit/artifact não é decidido.

Snapshots futuros devem referenciar o manifesto/release e preservar contexto de execução necessário, incluindo `as_of` — corte temporal dos dados — separado de `computed_at`. A janela de dados metodológica (lookback/decay) pertence à metodologia ou componente versionado; parâmetro de consulta de histórico da UI não. Os snapshots históricos permanecem associados ao manifesto original e nunca são reinterpretados como release posterior.

Admin, se adotado futuramente, governa lifecycle (criar draft, revisar, aprovar, publicar, ativar e consultar changelog), não mutação de release publicado. Feature flags podem controlar rollout, mas não mudar a semântica de manifesto já publicado. Experimento/preview com draft é distinto de execução oficial.

O changelog publicado deve registrar proposta, revisão, aprovação, timestamps, motivo, versão anterior e nova, além de descrição legível das mudanças. Atributos e workflow exatos permanecem em aberto.

## Reprodutibilidade

Um snapshot deve permitir identificar seu RankingScope, manifesto, versões de componentes, `as_of`, parâmetros efetivos, referência de código/release, fontes/contexto de dados e resultado. O manifesto viabiliza **reprodução explicável** das regras e parâmetros usados. **Reprodução computacional completa** — recalcular exatamente o resultado histórico — depende também de decisões futuras sobre retenção/referência de dados de entrada, snapshots dos inputs, event history e versionamento de fontes; este ADR não garante recálculo byte a byte.

## Consequências

- Versionar somente a expressão de score não basta; elegibilidade, quality gates, geografia/fallback, benchmark, janela e desempate também influenciam o resultado.
- Configuração operacional pode propor, testar ou ativar um manifesto, mas não alterar um release publicado.
- Resultado experimental deve ser distinguível de ranking oficial; snapshot oficial referencia release imutável.
- Mudanças publicadas tornam-se explícitas e explicáveis; um snapshot de v2 nunca será apresentado como se usasse v5.

## Em aberto

Permanecem em aberto schema/formato do manifesto, identidade versus release, armazenamento dos componentes/artefatos e parâmetros, processo de aprovação/ativação, retenção de inputs e eventos, nível de reprodução computacional, referências de código/artifact, migração de snapshots existentes e política de compatibilidade.
