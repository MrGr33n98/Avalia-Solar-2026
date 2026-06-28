$headers = @{
    'User-Agent' = 'Codex-CI-Diagnostics'
    'Accept' = 'application/vnd.github+json'
}
$uri = 'https://api.github.com/repos/MrGr33n98/Avalia-Solar-2026/actions/runs?per_page=5'
$response = Invoke-RestMethod -Uri $uri -Headers $headers
$response.workflow_runs | Select-Object id, name, event, status, conclusion, head_sha, created_at | Format-Table -AutoSize
