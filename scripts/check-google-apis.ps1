param(
  [string]$EnvPath = ".env",
  [string]$PlacesQuery = "Concreteira em Porto Alegre",
  [string]$PageSpeedUrl = "https://example.com"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Env file not found: $Path"
  }

  $values = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or $line -notmatch "=") {
      return
    }

    $parts = $line -split "=", 2
    $values[$parts[0]] = $parts[1]
  }

  return $values
}

function Get-KeyStatus {
  param([string]$Name, [hashtable]$Values)

  if (-not $Values.ContainsKey($Name)) {
    return "$Name=MISSING"
  }

  $value = $Values[$Name]
  if ([string]::IsNullOrWhiteSpace($value)) {
    return "$Name=EMPTY"
  }

  return "$Name=SET(length:$($value.Length))"
}

function Test-PlacesApi {
  param([string]$ApiKey, [string]$Query)

  $headers = @{
    "Content-Type" = "application/json"
    "X-Goog-Api-Key" = $ApiKey
    "X-Goog-FieldMask" = "places.id,places.displayName,places.formattedAddress"
  }

  $body = @{
    textQuery = $Query
    languageCode = "pt-BR"
    maxResultCount = 3
  } | ConvertTo-Json

  try {
    $response = Invoke-RestMethod -Uri "https://places.googleapis.com/v1/places:searchText" -Method Post -Headers $headers -Body $body -TimeoutSec 25
    $count = @($response.places).Count
    Write-Output "PLACES_OK count=$count"
  } catch {
    Write-GoogleApiError -Prefix "PLACES" -ErrorRecord $_
  }
}

function Test-PageSpeedApi {
  param([string]$ApiKey, [string]$Url)

  $encodedUrl = [System.Web.HttpUtility]::UrlEncode($Url)
  $endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$encodedUrl&strategy=mobile&key=$ApiKey"

  try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Get -TimeoutSec 45
    $score = [Math]::Round($response.lighthouseResult.categories.performance.score * 100)
    Write-Output "PAGESPEED_OK score=$score"
  } catch {
    Write-GoogleApiError -Prefix "PAGESPEED" -ErrorRecord $_
  }
}

function Write-GoogleApiError {
  param(
    [string]$Prefix,
    [object]$ErrorRecord
  )

  $message = $ErrorRecord.ErrorDetails.Message

  if (-not $message -and $ErrorRecord.Exception.Response) {
    try {
      $stream = $ErrorRecord.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $message = $reader.ReadToEnd()
    } catch {
      $message = $null
    }
  }

  if (-not $message) {
    $message = $ErrorRecord.Exception.Message
  }

  try {
    $json = $message | ConvertFrom-Json
    Write-Output "$($Prefix)_ERROR status=$($json.error.code) reason=$($json.error.status)"
    Write-Output "$($Prefix)_MESSAGE $($json.error.message)"
  } catch {
    Write-Output "$($Prefix)_ERROR $message"
  }
}

$envValues = Read-EnvFile -Path $EnvPath

Write-Output (Get-KeyStatus -Name "GOOGLE_PLACES_API_KEY" -Values $envValues)
Write-Output (Get-KeyStatus -Name "GOOGLE_PAGESPEED_API_KEY" -Values $envValues)

if ($envValues.ContainsKey("USE_MOCK_DATA")) {
  Write-Output "USE_MOCK_DATA=$($envValues["USE_MOCK_DATA"])"
}

$placesKey = $envValues["GOOGLE_PLACES_API_KEY"]
$pageSpeedKey = $envValues["GOOGLE_PAGESPEED_API_KEY"]

if (-not [string]::IsNullOrWhiteSpace($placesKey)) {
  Test-PlacesApi -ApiKey $placesKey -Query $PlacesQuery
}

if (-not [string]::IsNullOrWhiteSpace($pageSpeedKey)) {
  Test-PageSpeedApi -ApiKey $pageSpeedKey -Url $PageSpeedUrl
}
