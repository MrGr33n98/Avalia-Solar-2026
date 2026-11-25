# Baseline e evidências de entrada

Observação estática prévia da main (revalidar SHA no W0): `packages/mcp-ui` usa React 18, Vite 6, Zod 4, @modelcontextprotocol/ext-apps ^2.0.4; CSS próprio, tokens, HostProvider, fixtures, Vitest, Playwright, axe. Cinco HTML singlefile: search, profile, reputation, compare, categories. Profile v2 mapeia para o mesmo arquivo profile.v1.html conforme registry consultado; confirmar comportamento atual. `scripts/build.mjs`: limite 120 KiB gzip (122880 B), manifest SHA256, sourcemap false. `AB0-1-front/components.json` já existe; frontend usa system-ui. `ADR-004..007` exige Rails existente e cinco chaves do envelope. Main e estado deploy não são equivalentes.

## Relatório REA fornecido (Spec 020, HEAD 31583d20f)
| Achado reportado | Consequência nesta spec |
|---|---|
| 5 HTML ~425–445 KB raw; 117666–122680 B gzip | Margem mínima; categories 200 B abaixo do limite |
| profile 121610 B, reputation 117666 B, compare 118198 B, categories 122680 B | Repetir medição; não aceitar teto maior de proposta 020 |
| HTML inline: 0 JS parseados | Não tratar como análise semântica completa |
| JS extraído: timeout 300s; RSS 654 MB | Não rodar em cada PR nem na VM |
| Search único: 4m47s / 748 MB; semântica not-examined, 0 findings | Não aumentar timeout como solução padrão |
| CDP web bundle: deadline 30s por script | Preferir análise de fonte e browser harness; dist-analysis só em CI |
| WebMCP discovery: zero tools; MCP Apps usa postMessage | Não confundir WebMCP com servidor remoto |
| Capturas fora do host ficam skeleton | Capturas com harness + fixtures e smoke em host real |
| REA CLI 6.10.1 funcionou, MCP Claude config_drift | CLI opcional; corrigir cadastro local separadamente |
| Evidências copiadas tiveram caminhos redigidos, digests internos inválidos | Não autenticar cópias como originais; recapturar ou marcar derivadas |
| Swagger .json com YAML, cobertura incompleta | Dependência 020; não misturar patch nesta spec |
| Spec 019 T007/T033/T035/T042/T043 bloqueadas no relatório | Revalidar e coordenar; não marcar concluídas por nova UI |
| Segredos expostos em logs anteriores | Revogação/rotação pelo responsável antes de qualquer publicação |

Provas: anexo de log REA, seção final linhas 1010–1058 e tabelas 830–990. Não recebemos os JSONs originais ou o estado atual da VM. Evidências são reportadas, não reproduzidas nesta entrega.
