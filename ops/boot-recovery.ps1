$ErrorActionPreference = 'Stop'

# RHPL outage recovery settings
$RepoPath = 'C:\Users\mrmik\Documents\WebsiteProjects\RedHatProperties'
$ApiProcessName = 'rhpl-api'
$ApiHealthUrl = 'http://localhost:8080/api/listings'
$SiteHealthUrl = 'http://localhost/'
$LogDir = Join-Path $RepoPath 'logs'
$InitialDelaySeconds = 30
$NetworkRetryCount = 12
$NetworkRetryDelaySeconds = 5

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("boot-recovery-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')

function Write-Log {
  param([string]$Message)
  $line = "$(Get-Date -Format s)  $Message"
  $line | Out-File -FilePath $LogFile -Encoding utf8 -Append
  $line
}

function Resolve-NpxPath {
  $candidates = @(
    'C:\Program Files\nodejs\npx.cmd',
    'C:\Program Files (x86)\nodejs\npx.cmd'
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  try {
    $command = Get-Command npx -ErrorAction Stop
    return $command.Source
  } catch {
    return $null
  }
}

function Wait-NetworkReady {
  for ($i = 1; $i -le $NetworkRetryCount; $i++) {
    if (Test-NetConnection 1.1.1.1 -Port 53 -InformationLevel Quiet) {
      return $true
    }
    Write-Log "Network not ready ($i/$NetworkRetryCount), retrying in $NetworkRetryDelaySeconds seconds"
    Start-Sleep -Seconds $NetworkRetryDelaySeconds
  }
  return $false
}

function Test-HttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 8
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Test-ApiOk {
  try {
    $null = Invoke-RestMethod -Uri $ApiHealthUrl -TimeoutSec 8
    return $true
  } catch {
    return $false
  }
}

function Invoke-CommandChecked {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$Display
  )

  Write-Log "Running: $Display"
  & $FilePath @Arguments 2>&1 | Out-File -FilePath $LogFile -Encoding utf8 -Append
  if ($LASTEXITCODE -ne 0) {
    Write-Log ('Command failed with exit code {0}: {1}' -f $LASTEXITCODE, $Display)
    return $false
  }

  return $true
}

Write-Log 'Boot recovery started'
Start-Sleep -Seconds $InitialDelaySeconds

if (-not (Test-Path $RepoPath)) {
  Write-Log "Repo path not found: $RepoPath"
  exit 1
}

$npxPath = Resolve-NpxPath
if (-not $npxPath) {
  Write-Log 'npx was not found. Install Node.js system-wide and retry.'
  exit 1
}

Write-Log "Using npx at: $npxPath"
Set-Location $RepoPath

if (-not (Wait-NetworkReady)) {
  Write-Log 'Network was not confirmed. Continuing recovery anyway.'
}

$pm2ResurrectOk = Invoke-CommandChecked -FilePath $npxPath -Arguments @('pm2', 'resurrect') -Display 'npx pm2 resurrect'
$iisResetOk = Invoke-CommandChecked -FilePath 'iisreset' -Arguments @() -Display 'iisreset'

$apiOk = Test-ApiOk
$siteOk = Test-HttpOk -Url $SiteHealthUrl
Write-Log "Health check after first pass: API=$apiOk Site=$siteOk"

if (-not ($apiOk -and $siteOk)) {
  Write-Log 'Health check failed. Running one retry sequence.'
  $null = Invoke-CommandChecked -FilePath $npxPath -Arguments @('pm2', 'restart', $ApiProcessName) -Display "npx pm2 restart $ApiProcessName"
  $null = Invoke-CommandChecked -FilePath 'iisreset' -Arguments @() -Display 'iisreset'
  $apiOk = Test-ApiOk
  $siteOk = Test-HttpOk -Url $SiteHealthUrl
  Write-Log "Health check after retry: API=$apiOk Site=$siteOk"
}

if ($pm2ResurrectOk -and $iisResetOk -and $apiOk -and $siteOk) {
  Write-Log 'Boot recovery completed successfully'
  exit 0
}

Write-Log 'Boot recovery completed with failures'
exit 1
