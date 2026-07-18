[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateRange(1, 4)]
  [int]$Leg
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$flowRoot = Join-Path $projectRoot 'media-production\pocket-worlds-flow'
$outputRoot = Join-Path $flowRoot 'outputs'
$handoffRoot = Join-Path $flowRoot 'handoffs'

$handoffs = @{
  1 = [pscustomobject]@{
    Source = '01-overview-to-wander.mp4'
    Output = '01-wander-actual.png'
    NextPrompt = '02-wander-to-sacred-geometry.md'
  }
  2 = [pscustomobject]@{
    Source = '02-wander-to-sacred-geometry.mp4'
    Output = '02-sacred-geometry-actual.png'
    NextPrompt = '03-sacred-geometry-to-small-wonders.md'
  }
  3 = [pscustomobject]@{
    Source = '03-sacred-geometry-to-small-wonders.mp4'
    Output = '03-small-wonders-actual.png'
    NextPrompt = '04-small-wonders-to-living-things.md'
  }
  4 = [pscustomobject]@{
    Source = '04-small-wonders-to-living-things.mp4'
    Output = '04-living-things-actual.png'
    NextPrompt = '05-living-things-to-table-notes.md'
  }
}

if (-not (Get-Command 'ffmpeg' -ErrorAction SilentlyContinue)) {
  throw "Required command 'ffmpeg' was not found. Install FFmpeg and make sure it is available in PATH."
}

$handoff = $handoffs[$Leg]
$sourcePath = Join-Path $outputRoot $handoff.Source
$destinationPath = Join-Path $handoffRoot $handoff.Output

if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
  throw "Accepted leg $Leg was not found at '$sourcePath'. Save the Flow render with the exact expected filename first."
}

New-Item -ItemType Directory -Path $handoffRoot -Force | Out-Null

# Decode only the final half-second and overwrite one PNG until the actual final frame remains.
& ffmpeg -hide_banner -loglevel warning -y -sseof -0.5 -i $sourcePath `
  -map 0:v:0 -fps_mode passthrough -update 1 $destinationPath
if ($LASTEXITCODE -ne 0) {
  throw "FFmpeg could not extract the final frame from '$sourcePath'."
}

Write-Host ''
Write-Host "Handoff frame ready: $destinationPath" -ForegroundColor Green
Write-Host "Use it as the start frame with prompts\$($handoff.NextPrompt)." -ForegroundColor Cyan
