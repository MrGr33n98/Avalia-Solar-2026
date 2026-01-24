# Configurações iniciais
$outputFile = "sumpario-improvement-categorycar.md"
$date = Get-Date -Format "dd/MM/yyyy HH:mm"
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false

# 1. Cabeçalho do Documento
$header = @"
# Análise de Melhoria: Funcionalidade de Categorias
**Data:** $date
**Objetivo:** Consolidar arquitetura, fluxo de dados e oportunidades de melhoria para a aba /categories.

---

## 1. Resumo da Funcionalidade
A aba "Categories" gerencia a hierarquia de classificação de empresas e produtos. Ela permite a navegação por nichos (ex: Alimentação, Tecnologia), exibindo métricas consolidadas (contagem de empresas, produtos e avaliações médias) e facilitando o SEO através de URLs amigáveis.

## 2. Arquitetura e Fluxo de Dados
- **Frontend:** Utiliza Next.js com componentes de servidor para busca inicial (SEO) e componentes de cliente para interatividade (filtros/cards).
- **Backend:** API em Ruby on Rails utilizando ActiveRecord para gerenciar a árvore de categorias (parent/child) e gatilhos (callbacks) para sincronização de métricas de desempenho.
- **Fluxo:** 
  1. O usuário acessa `/categories`.
  2. O Frontend solicita dados ao endpoint `api/v1/categories`.
  3. O Backend resolve o cache e retorna o JSON estruturado.
  4. O `CategoryCard` renderiza as métricas e links de SEO.

---

## 3. Arquivos Analisados e Responsabilidades
"@

$header | Out-File -FilePath $outputFile -Encoding UTF8

# 2. Busca e Processamento de Arquivos
# Definindo os padrões de busca para backend e frontend
$patterns = @(
    "*category*",
    "*Category*"
)

$excludeFolders = @("node_modules", ".next", "bin", "tmp", "log", "rubocop_backup")

# Coletar arquivos relevantes
$files = Get-ChildItem -Recurse -Include "*.rb", "*.tsx", "*.ts", "*.js", "*.jsx" | Where-Object {
    $path = $_.FullName
    $match = $false
    foreach ($p in $patterns) { if ($_.Name -like $p) { $match = $true } }
    $isExcluded = $false
    foreach ($ef in $excludeFolders) { if ($path -like "*\$ef\*") { $isExcluded = $true } }
    $match -and -not $isExcluded
}

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace("c:\Users\Bobi\Desktop\AB0-1-main\", "")
    
    # Definir responsabilidade básica baseada no tipo/local
    $responsibility = "Responsável pela lógica de "
    if ($file.FullName -like "*\models\*") { $responsibility += "persistência e regras de negócio de categorias." }
    elseif ($file.FullName -like "*\controllers\*") { $responsibility += "exposição da API e controle de fluxo de requisições." }
    elseif ($file.FullName -like "*\components\*") { $responsibility += "renderização visual do card ou lista de categorias." }
    elseif ($file.FullName -like "*\app\categories\*") { $responsibility += "página principal de listagem no frontend." }
    else { $responsibility += "suporte à funcionalidade de categorias." }

    $fileContent = Get-Content -Path $file.FullName -Raw
    
    $fileSection = @"

### Arquivo: $relativePath
- **Responsabilidade:** $responsibility
- **Código-Fonte:**

```$(($file.Extension).Replace(".", ""))
$fileContent
```

---
"@
    $fileSection | Out-File -FilePath $outputFile -Append -Encoding UTF8
}

# 3. Adicionar Seções de Melhoria e Dependências
$footer = @"

## 4. Oportunidades de Melhoria
1. **Cache de Fragmento:** Implementar cache em nível de componente no frontend para evitar re-renders de cards estáticos.
2. **Lazy Loading de Imagens:** Garantir que os banners das categorias utilizem `next/image` com priority para as primeiras da lista.
3. **Métricas Assíncronas:** Mover o `update_metrics!` do backend para um worker (Sidekiq) para não onerar o tempo de resposta do CRUD.
4. **Filtros Dinâmicos:** Adicionar debounce na busca de categorias para reduzir chamadas à API.

## 5. Dependências Críticas
- **Backend:** `ActiveRecord`, `JSON Serializer`.
- **Frontend:** `Next.js App Router`, `Tailwind CSS` (estilização dos cards).
- **Banco de Dados:** PostgreSQL (suporte a slugs e busca textual).

---
*Gerado automaticamente pelo assistente de desenvolvimento.*
"@

$footer | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host "O arquivo $outputFile foi gerado com sucesso!" -ForegroundColor Green