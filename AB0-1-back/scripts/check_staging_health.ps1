param(
  [string]$BaseUrl = $env:STAGING_BASE_URL
)

if (-not $BaseUrl) {
  $BaseUrl = 'https://staging-api.avaliasolar.com.br'
}

$timeout = 10
if ($env:HEALTHCHECK_TIMEOUT) {
  $timeout = [int]$env:HEALTHCHECK_TIMEOUT
}

$endpoints = @(
  '/health',
  '/health/readiness',
  '/health/liveness',
  '/api/v1/states'
)

foreach ($path in $endpoints) {
  $url = $BaseUrl.TrimEnd('/') + $path
  Write-Host "Checking $url"
  $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec $timeout -UseBasicParsing
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "Non-2xx response for $url: $($response.StatusCode)"
  }
}

Write-Host 'All checks passed.'
