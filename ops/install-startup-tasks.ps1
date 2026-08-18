$ErrorActionPreference = 'Stop'

# Run this in an elevated PowerShell session.
$TaskNameRecovery = 'RHPL Boot Recovery'
$TaskNameHealth = 'RHPL Health Check'
$WorkingPath = 'C:\Users\mrmik\Documents\WebsiteProjects\RedHatProperties'
$RecoveryScript = Join-Path $WorkingPath 'ops\boot-recovery.ps1'

if (-not (Test-Path $RecoveryScript)) {
  throw "Recovery script not found: $RecoveryScript"
}

$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = 'PT30S'

$recoveryAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RecoveryScript`""
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskNameRecovery -Action $recoveryAction -Trigger $startupTrigger -Principal $principal -Settings $settings -Force

# Recurring health check: every 5 minutes for the full day, re-created daily.
$healthTrigger = New-ScheduledTaskTrigger -Daily -At 12:00AM
$healthTrigger.Repetition.Interval = (New-TimeSpan -Minutes 5)
$healthTrigger.Repetition.Duration = (New-TimeSpan -Days 1)

Register-ScheduledTask -TaskName $TaskNameHealth -Action $recoveryAction -Trigger $healthTrigger -Principal $principal -Settings $settings -Force

Write-Host "Installed tasks: $TaskNameRecovery, $TaskNameHealth"
Write-Host "Test now with: Start-ScheduledTask -TaskName '$TaskNameRecovery'"
