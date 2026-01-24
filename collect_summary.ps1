$Output = "sumario-improvement.md"

$Files = @(
    @{ Path = "AB0-1-front/app/companies/page.tsx"; Lang = "tsx" },
    @{ Path = "AB0-1-front/components/CompanyCard.tsx"; Lang = "tsx" },
    @{ Path = "AB0-1-front/app/globals.css"; Lang = "css" },
    @{ Path = "AB0-1-back/app/controllers/api/v1/companies_controller.rb"; Lang = "ruby" },
    @{ Path = "AB0-1-back/app/models/company.rb"; Lang = "ruby" },
    @{ Path = "AB0-1-back/app/serializers/company_serializer.rb"; Lang = "ruby" },
    @{ Path = "AB0-1-back/db/migrate/20260122040000_fix_json_indexes_to_gin.rb"; Lang = "ruby" }
)

# Inicializa o arquivo com cabeçalho e UTF8 para evitar caracteres estranhos (Ã¡)
"# Sumário Completo de Código - Mobile /Companies" | Out-File -FilePath $Output -Encoding UTF8
"Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Add-Content -Path $Output
"Este arquivo contém a implementação completa dos arquivos listados para facilitar a análise." | Add-Content -Path $Output
"" | Add-Content -Path $Output

foreach ($item in $Files) {
    $FilePath = $item.Path
    $Lang = $item.Lang
    $FileName = Split-Path $FilePath -Leaf

    "---" | Add-Content -Path $Output
    "## Arquivo: $FileName" | Add-Content -Path $Output
    "**Caminho:** ``$FilePath``" | Add-Content -Path $Output
    "" | Add-Content -Path $Output

    if (Test-Path $FilePath) {
        "Content-Length: $((Get-Item $FilePath).Length) bytes" | Add-Content -Path $Output
        "" | Add-Content -Path $Output
        "````$Lang" | Add-Content -Path $Output
        Get-Content $FilePath | Add-Content -Path $Output
        "````" | Add-Content -Path $Output
    } else {
        "> ⚠️ **Aviso:** Arquivo não encontrado no caminho especificado." | Add-Content -Path $Output
    }
    "" | Add-Content -Path $Output
}

$Analysis = @"
---
## Análise Técnica Mobile Final
- **Estrutura**: O projeto utiliza Next.js no front e Rails no back, com uma separação clara de responsabilidades.
- **Otimização**: Os arquivos mostram que já existe uma base para mobile (`compact` props, `no-scrollbar`), mas a lógica de dados ainda é pesada para o cliente.
- **Próximo Passo Recomendado**: Implementar o **Item 1 (API Querying)** para reduzir o payload enviado ao celular.
"@

$Analysis | Add-Content -Path $Output -Encoding UTF8

Write-Host "Sucesso! O arquivo $Output agora contém todo o código dos arquivos." -ForegroundColor Green