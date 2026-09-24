# ADR 0006: Identidade territorial canônica

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Identidade de territórios e referências geográficas no domínio

## Contexto

O domínio atual resolve cidades e estados por nomes, siglas, normalização e slugs. `CompanyServiceArea` armazena `state_code` e `city_name`; a sede também usa `companies.state` e `companies.city`. O CSV `db/data/municipios.csv` contém código IBGE, mas o gerador de `br_locations.json` mantém nomes e UFs e descarta o código. O arquivo não foi declarado catálogo oficial definitivo; origem, versão, atualização, cobertura, integridade e licença precisam ser verificadas.

## Decisão

O domínio-alvo distinguirá identidade territorial interna estável, código de fonte externa, fonte/versão, nome canônico, aliases e slug de exibição. Nomes, aliases e slugs não serão identidade primária. Códigos externos serão preservados separadamente da identidade interna; o código IBGE é candidato a identificador externo de municípios brasileiros, não a chave primária universal do domínio. A sigla oficial da UF permanece código externo útil, mantendo-se o mesmo princípio de identidade interna distinta quando aplicável.

O catálogo deverá poder representar explicitamente país (incluindo Brasil), região, estado, região metropolitana e município, assim como relações territoriais governadas que não presumam árvore perfeita nem pertencimento metropolitano universal. Regiões e regiões metropolitanas não participarão de escopos até serem definidos fonte, identidade, membership, versão e histórico.

O código IBGE presente no CSV atual é um ativo a investigar, não prova de governança do catálogo. Deve-se verificar origem, data, processo de atualização, integridade, cobertura, versão e licença antes de adotá-lo como fonte. O gap atual de `br_locations.json` — que descarta o código municipal — fica registrado, sem alterar o gerador nesta etapa.

As áreas de atendimento, a sede, projetos, leads, reviews e outras evidências territoriais deverão convergir futuramente para a mesma identidade canônica, mantendo temporariamente os campos e formatos atuais durante uma migração governada. O RankingScope futuro deverá referenciar território por identidade canônica, mantendo `geographic_basis` separado (`headquarters` ou `service_coverage`). O fallback do ADR 0002 deverá resolver relações territoriais canônicas, não regras especiais por nome.

URLs existentes, como `/companies/energia-solar/sc/florianopolis`, permanecem compatíveis por resolução de slug para a identidade territorial. Slug continua atributo de navegação/SEO, não identidade.

## Consequências

- A mesma identidade territorial poderá ser compartilhada por sede, cobertura, escopos e evidências, evitando representações territoriais incompatíveis entre domínios.
- Códigos, fontes, versões e relações territoriais devem permitir explicar mudanças de nome, criação de territórios e alterações de membership sem reinterpretar silenciosamente snapshots históricos.
- Catálogo territorial não implica materializar todas as relações empresa-território nem todos os RankingScopes; catálogo e materialização de ranking permanecem conceitos distintos.
- Não há implementação nesta etapa: nenhuma tabela, model, migration, importação, foreign key ou alteração de URLs/normalizadores.

## Em aberto

Permanecem em aberto a fonte oficial e seu processo de refresh; formato de IDs internos; modelo de códigos/fontes/versões e aliases; política de validade temporal e histórico; identidade e membership de regiões/metrópoles; relações entre territórios; migração de sede, áreas, projetos, leads, reviews e escopos; e contrato de resolução de URL.
