param(
  [string]$EnvPath = ".env",
  [string]$PlacesQuery = "Concreteira em Porto Alegre",
  [string]$PageSpeedUrl = "https://www.wikipedia.org"
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

function Test-MapsApi {
  param([string]$ApiKey)

  $encodedAddress = [System.Web.HttpUtility]::UrlEncode("Porto Alegre, RS")
  $endpoint = "https://maps.googleapis.com/maps/api/geocode/json?address=$encodedAddress&key=$ApiKey"

  try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Get -TimeoutSec 25
    if ($response.status -eq "OK") {
      Write-Output "MAPS_OK status=OK"
    } else {
      Write-Output "MAPS_ERROR status=$($response.status)"
      if ($response.error_message) {
        Write-Output "MAPS_MESSAGE $($response.error_message)"
      }
    }
  } catch {
    Write-GoogleApiError -Prefix "MAPS" -ErrorRecord $_
  }
}

function Test-OpenAiApi {
  param([string]$ApiKey)

  $headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ApiKey"
  }

  $body = @{
    model = "gpt-4.1-mini"
    input = "Responda apenas: NODERE_OK"
  } | ConvertTo-Json

  try {
    $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/responses" -Method Post -Headers $headers -Body $body -TimeoutSec 45
    if ($response.output_text) {
      Write-Output "OPENAI_OK response=$($response.output_text)"
    } else {
      Write-Output "OPENAI_OK response=received"
    }
  } catch {
    Write-GoogleApiError -Prefix "OPENAI" -ErrorRecord $_
  }
}

function Test-GoogleBusinessProfileApi {
  param(
    [string]$ClientId,
    [string]$ClientSecret,
    [string]$RefreshToken
  )

  if ([string]::IsNullOrWhiteSpace($ClientId) -or [string]::IsNullOrWhiteSpace($ClientSecret) -or [string]::IsNullOrWhiteSpace($RefreshToken)) {
    Write-Output "GBP_PENDING missing_oauth_credentials"
    return
  }

  $body = @{
    client_id = $ClientId
    client_secret = $ClientSecret
    refresh_token = $RefreshToken
    grant_type = "refresh_token"
  }

  try {
    $token = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body $body -TimeoutSec 25
    $headers = @{ Authorization = "Bearer $($token.access_token)" }
    $accounts = Invoke-RestMethod -Uri "https://mybusinessaccountmanagement.googleapis.com/v1/accounts" -Method Get -Headers $headers -TimeoutSec 25
    $count = @($accounts.accounts).Count
    Write-Output "GBP_OK accounts=$count"
  } catch {
    Write-GoogleApiError -Prefix "GBP" -ErrorRecord $_
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
Write-Output (Get-KeyStatus -Name "GOOGLE_MAPS_API_KEY" -Values $envValues)
Write-Output (Get-KeyStatus -Name "GOOGLE_PAGESPEED_API_KEY" -Values $envValues)
Write-Output (Get-KeyStatus -Name "GOOGLE_BUSINESS_PROFILE_CLIENT_ID" -Values $envValues)
Write-Output (Get-KeyStatus -Name "GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET" -Values $envValues)
Write-Output (Get-KeyStatus -Name "GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN" -Values $envValues)
Write-Output (Get-KeyStatus -Name "OPENAI_API_KEY" -Values $envValues)

if ($envValues.ContainsKey("USE_MOCK_DATA")) {
  Write-Output "USE_MOCK_DATA=$($envValues["USE_MOCK_DATA"])"
}

$placesKey = $envValues["GOOGLE_PLACES_API_KEY"]
$mapsKey = $envValues["GOOGLE_MAPS_API_KEY"]
$pageSpeedKey = $envValues["GOOGLE_PAGESPEED_API_KEY"]
$openAiKey = $envValues["OPENAI_API_KEY"]

if (-not [string]::IsNullOrWhiteSpace($placesKey)) {
  Test-PlacesApi -ApiKey $placesKey -Query $PlacesQuery
}

if (-not [string]::IsNullOrWhiteSpace($mapsKey)) {
  Test-MapsApi -ApiKey $mapsKey
}

if (-not [string]::IsNullOrWhiteSpace($pageSpeedKey)) {
  Test-PageSpeedApi -ApiKey $pageSpeedKey -Url $PageSpeedUrl
}

if (-not [string]::IsNullOrWhiteSpace($openAiKey)) {
  Test-OpenAiApi -ApiKey $openAiKey
}

Test-GoogleBusinessProfileApi `
  -ClientId $envValues["GOOGLE_BUSINESS_PROFILE_CLIENT_ID"] `
  -ClientSecret $envValues["GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET"] `
  -RefreshToken $envValues["GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN"]
