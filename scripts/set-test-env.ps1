<#
Dot-source this script to set TEST env vars in your current PowerShell session:
. .\scripts\set-test-env.ps1
This script does NOT persist secrets to disk; it only sets env vars in-memory.
#>

function Read-SecureInput {
  param([string]$prompt)
  $secure = Read-Host -AsSecureString $prompt
  return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

if (-not $env:TEST_USER_TOKEN) {
  $token = Read-SecureInput "Paste TEST_USER_TOKEN (input hidden)"
  if ($token) { $env:TEST_USER_TOKEN = $token }
}

if (-not $env:TEST_USER_ID) {
  $id = Read-Host "Enter TEST_USER_ID"
  if ($id) { $env:TEST_USER_ID = $id }
}

if (-not $env:TEST_ALLOW_PAYMENTS) {
  $allow = Read-Host "Enable payments? (true/false) [false]"
  if (-not $allow) { $allow = 'false' }
  $env:TEST_ALLOW_PAYMENTS = $allow
}

Write-Host "TEST env vars set for current session (not persisted). Run your tests now."
Write-Host "To clear them: Remove-Item Env:\TEST_USER_TOKEN; Remove-Item Env:\TEST_USER_ID; Remove-Item Env:\TEST_ALLOW_PAYMENTS"
