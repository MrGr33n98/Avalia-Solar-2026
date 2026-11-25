# Setup do início ao fim

## 0 — Segurança e pré-requisitos
Linux/Ubuntu, Git, Node/npm conforme `.nvmrc`/CI do pacote, acesso autorizado ao GitHub e diretório fora da produção. Para laboratório mcpcn use versão Node suportada por Next/shadcn no upstream (verifique engines); para REA 6.10.1 confira `npm view rea-agents@6.10.1 engines --json` e `rea doctor`, runtime isolado. Não assumir que Node do produto é adequado. Se o relatório 020 apontar credenciais expostas, responsável deve rotacionar/revogar e verificar uso; não reproduza chaves nos logs.

## 1 — Branch segura
Na raiz de uma cópia do projeto:
```bash
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list
git fetch origin main
git log -1 --oneline origin/main
# se branch ou worktree já existirem, inspeção e reuso consciente; não sobrescrever
git worktree add -b feat/spec-021-agent-native-ui-registry ../avalia-solar-spec021 origin/main
cd ../avalia-solar-spec021
```
Se 018/020 estiverem em branch não integrada, registrar dependência e selecionar base revisada com o mantenedor; não cherry-pick cego. Copiar pack para `specs/021-agent-native-ui-registry/` após verificar colisão. Manter o worktree original intacto.

## 2 — Baseline do produto (sem mcpcn)
```bash
node -v; npm -v
cd packages/mcp-ui
npm ci
npm run typecheck
npm run test
npm run build
npx playwright install chromium # somente ambiente dev/CI autorizado
npm run test:e2e
```
Confirme scripts no package.json e Playwright config; utilize o comando CI já adotado se diferente. Registre manifest, SHA, gzip, stderr e códigos de saída sem segredos. Execute specs Rails de MCP conforme ambiente de teste já configurado (`bundle exec rspec spec/requests/api/v1/mcp spec/services/mcp` em AB0-1-back). Não usar DB produtivo. Baseline vermelho = registrar investigação e não mascarar.

## 3 — Laboratório mcpcn isolado
Exemplo reproduzível de bootstrap: criar projeto React/Tailwind/shadcn fora do worktree. O CLI upstream recomenda `shadcn init` apenas se não existir components.json. Fixar versão após verificar compatibilidade; `latest` abaixo é apenas descoberta/consulta, não dependência de produção.
```bash
LAB=$(mktemp -d -t as-mcpcn-lab.XXXXXX)
git clone --depth 1 https://github.com/shadcn-labs/mcpcn.git "$LAB/upstream"
git -C "$LAB/upstream" rev-parse HEAD
npm view shadcn version
npm view shadcn@4.13.0 engines --json
# baixar catálogo sem executar scripts e registrar digest
mkdir -p "$LAB/snapshots"
curl --fail --silent --show-error --location --proto '=https' https://mcpcn.dev/r/registry.json -o "$LAB/snapshots/registry.json"
sha256sum "$LAB/snapshots/registry.json"
```
Inspecione LICENSE, registry.json, dependências, URLs e scripts antes de instalar. Registre commit e hash dos JSONs; upstream e registry online podem divergir. Para ver aplicação upstream, use o gerenciador/lockfile real e os scripts documentados após revisão, apenas no laboratório. Alternativa: crie projeto React/Tailwind/shadcn descartável conforme documentação do shadcn para a versão fixada. Não usar o `components.json` de AB0-1-front para instalar blocos MCP.

### Criar o projeto descartável do zero (rota concreta)
Use um runtime Node compatível com o Next do laboratório. O Next 16.3.1 e o shadcn 4.13.0 são referências observadas no upstream, não versões homologadas do Avalia Solar. Confirme disponibilidade e engines antes de rodar; se não disponíveis, selecione e fixe versões compatíveis, registre decisão. Leia o help para os flags reais.
```bash
npm view create-next-app@16.3.1 version engines --json
npm view next@16.3.1 engines --json
npx --yes create-next-app@16.3.1 --help
npx --yes create-next-app@16.3.1 "$LAB/sandbox" --ts --tailwind --eslint --app --src-dir --use-npm --import-alias '@/*' --yes
cd "$LAB/sandbox"
npx --yes shadcn@4.13.0 init
```
Se o assistente pedir escolhas, usar TypeScript, aliases `@/*`, CSS variables e preset compatível com os blocos, consultando o `components.json` upstream (`base-nova`, Lucide). Revisar antes de aprovar; se o CLI não oferecer as mesmas opções, registrar a diferença. O `init` somente deve ocorrer neste sandbox e apenas se não houver `components.json`. Não copiar o tema do laboratório para o produto.

No **projeto descartável**, após shadcn configurado, mescle o campo abaixo (não substituir o arquivo):
```json
{"registries":{"@mcpcn":"https://mcpcn.dev/r/{name}.json"}}
```
```bash
# no laboratório shadcn preparado, versão revisada e fixada
npx --yes shadcn@4.13.0 --help
npx --yes shadcn@4.13.0 add @mcpcn/product-list
npx --yes shadcn@4.13.0 add @mcpcn/table
# alternativa URL: npx --yes shadcn@4.13.0 add https://mcpcn.dev/r/product-list.json
```
Após instalar, criar uma página de preview local com dados sintéticos explícitos, importar os exports reais dos arquivos gerados e rodar `npm run build` e `npm run dev -- --hostname 127.0.0.1`. Verificar lista/grid/carrossel/picker e tabela; não usar defaults de produtos de varejo. Se a versão não estiver disponível/compatível, selecione versão auditada, fixe no log/lockfile. Instalar um bloco por vez e revisar diff, dependências e tema; não usar --overwrite. `apps-sdk-theme` é opcional no guia, mas é dependência declarada de vários itens; preservar apenas os tokens necessários no port. Não misturar Tailwind 4 com o CSS de produção automaticamente. Para os outros blocos use o catálogo e a task correspondente.

## 4 — MCP de descoberta
No laboratório ou projeto de tooling dedicado com o alias, execute:
```bash
npx --yes shadcn@4.13.0 mcp init
```
Selecione cliente quando solicitado, revise configuração e reinicie. Use as tools de busca e leitura disponíveis (descubra nomes reais). Não registrar servidor duplicado, não trocar configs globais sem revisar. Se CLI exigir `--client` consultar help. O REA pode ser executado por CLI local, sem Hopper para web/JS. `rea doctor` e `rea --help`; se config_drift, seguir setup oficial e revisão do symlink, não remover diretórios sem identificar propriedade.

## 5 — Port seletivo
Leia `MCPCN_SCAN.md`, copie apenas padrões/blocos aprovados, preserve copyright MIT, adapte para classes e tokens `--as-*`, IDs estáveis, contrato real, host bridge e testes. Não carregar exemplos de varejo. Atualize lockfile apenas se necessário. Não importar Next 16 ou React 19 no pacote de produção.

## 6 — Registro, revisão e entrega
```bash
# após gates e revisão dos arquivos
# git add <arquivos revisados explicitamente>
git diff --cached --stat
git diff --cached --check
# git commit -m 'feat(mcp-ui): ...'
# git push -u origin feat/spec-021-agent-native-ui-registry
# gh pr create --draft --base main --head feat/spec-021-agent-native-ui-registry
```
Evite `git add .`; nunca subir dumps, .env ou sourcemaps de análise. PR somente após verificar que a base selecionada corresponde ao alvo; CI e staging conforme ROLLOUT.
