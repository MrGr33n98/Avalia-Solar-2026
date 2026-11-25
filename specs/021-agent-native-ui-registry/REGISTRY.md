# Registry próprio compatível com shadcn
Inicialmente local/privado, namespace `@avalia-solar`. Gerar JSON por item a partir de fontes versionadas e revisadas. Não incluir bridge privado, secrets, fixtures reais, sourcemaps, arquivos absolutos ou código Rails. Separar componentes genéricos de adapters de domínio. Usar schema oficial vigente, confirmar `registry:ui`, `registry:block`, `registry:style`, `registry:lib` e campos de files/dependencies.

Exemplo de entrada de catálogo (template, ajustar ao CLI validado):
```json
{"name":"solar-company-card","type":"registry:block","title":"Solar Company Card","description":"Card de integrador com reputação e cobertura declarada","files":[{"path":"components/solar-company-card.tsx","type":"registry:component"}],"registryDependencies":[]}
```
`templates/registry.example.json` é ponto de partida, não é instalável até que arquivos reais e esquema sejam validados. O build do registry deve verificar IDs duplicados, caminhos sem traversal, arquivos existentes, deps resolvidas, licenças, ausência de secrets e demonstrações e compatibilidade. Testar instalação de 3 itens em projeto descartável. Registrar digest de JSON e fonte, tags/versões e changelog; evitar `latest` para releases homologados.

Futuro: `https://ui.avaliasolar.com.br/r/{name}.json` (domínio proposto, não provisionado). Publicação requer revisão de IP/licenciamento e decisão de acesso. Não publicar automaticamente. O shadcn MCP consome `components.json` e pode descobrir o registry quando disponível; não criar servidor MCP novo só para isso.
