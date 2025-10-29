# start-project.ps1 — helper to install and start the project on Windows (PowerShell)
# Usage: run this in a NEW PowerShell window after installing Node.js
# Example: `powershell -ExecutionPolicy Bypass -File .\start-project.ps1`

$ErrorActionPreference = 'Stop'

$projectPath = "C:\Users\Bedirhan\Desktop\RutiMind"
Write-Output "Switching to project folder: $projectPath"
Set-Location -Path $projectPath

Write-Output "Installing dependencies (npm ci)..."
npm ci

Write-Output "Starting project (npm start)..."
npm start
