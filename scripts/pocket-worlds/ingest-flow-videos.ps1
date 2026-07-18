[CmdletBinding()]
param(
  [switch]$ApproveVisual
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$flowRoot = Join-Path $projectRoot 'media-production\pocket-worlds-flow'
$sourceRoot = Join-Path $flowRoot 'outputs'
$publicRoot = Join-Path $projectRoot 'public\media\pocket-worlds'
$masterRoot = Join-Path $publicRoot 'master'
$mobileRoot = Join-Path $publicRoot 'mobile'
$posterRoot = Join-Path $publicRoot 'posters'
$manifestRoot = Join-Path $publicRoot 'manifests'
$verificationRoot = Join-Path $projectRoot 'artifacts\pocket-worlds\flow-verification'
$manifestPath = Join-Path $manifestRoot 'web-manifest.json'
$verificationPath = Join-Path $manifestRoot 'verification.json'
$nullDevice = if ($IsWindows) { 'NUL' } else { '/dev/null' }

$clips = @(
  [pscustomobject]@{
    Id = 'wander'
    Source = '01-overview-to-wander.mp4'
    Still = '/media/pocket-worlds/keyframes/01-wander-1664.webp'
  },
  [pscustomobject]@{
    Id = 'sacred-geometry'
    Source = '02-wander-to-sacred-geometry.mp4'
    Still = '/media/pocket-worlds/keyframes/02-sacred-geometry-1664.webp'
  },
  [pscustomobject]@{
    Id = 'small-wonders'
    Source = '03-sacred-geometry-to-small-wonders.mp4'
    Still = '/media/pocket-worlds/keyframes/03-small-wonders-1664.webp'
  },
  [pscustomobject]@{
    Id = 'living-things'
    Source = '04-small-wonders-to-living-things.mp4'
    Still = '/media/pocket-worlds/keyframes/04-living-things-1664.webp'
  },
  [pscustomobject]@{
    Id = 'table-notes'
    Source = '05-living-things-to-table-notes.mp4'
    Still = '/media/pocket-worlds/keyframes/05-table-notes-1664.webp'
  }
)

function Assert-Command {
  param([Parameter(Mandatory)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install FFmpeg and make sure it is available in PATH."
  }
}

function Invoke-MediaCommand {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string[]]$Arguments
  )

  & $Name @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

function Get-VideoInfo {
  param([Parameter(Mandatory)][string]$Path)

  $probeOutput = & ffprobe -v error -select_streams v:0 `
    -show_entries 'stream=codec_name,width,height,pix_fmt' `
    -show_entries 'format=duration,size' -of json $Path
  if ($LASTEXITCODE -ne 0) {
    throw "ffprobe could not inspect '$Path'."
  }

  $probe = $probeOutput | ConvertFrom-Json
  $stream = $probe.streams[0]

  return [pscustomobject]@{
    codec = [string]$stream.codec_name
    width = [int]$stream.width
    height = [int]$stream.height
    pixelFormat = [string]$stream.pix_fmt
    duration = [math]::Round([double]$probe.format.duration, 3)
    bytes = [long]$probe.format.size
  }
}

function Get-SsimScore {
  param(
    [Parameter(Mandatory)][string]$ReferencePath,
    [Parameter(Mandatory)][string]$ComparisonPath
  )

  $filter = '[1:v][0:v]scale2ref=flags=lanczos[scaled][reference];[reference][scaled]ssim'
  $output = & ffmpeg -hide_banner -v info -i $ReferencePath -i $ComparisonPath `
    -lavfi $filter -f null $nullDevice 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to compare '$ReferencePath' with '$ComparisonPath'."
  }

  $matches = [regex]::Matches($output, 'All:([0-9.]+)')
  if ($matches.Count -eq 0) {
    throw "FFmpeg did not return an SSIM score for '$ComparisonPath'."
  }

  return [math]::Round([double]$matches[$matches.Count - 1].Groups[1].Value, 6)
}

function Get-CheckStatus {
  param([Parameter(Mandatory)][double]$Score)

  if ($Score -ge 0.90) { return 'pass' }
  if ($Score -ge 0.75) { return 'warning' }
  return 'fail'
}

Assert-Command 'ffmpeg'
Assert-Command 'ffprobe'

$missing = @(
  foreach ($clip in $clips) {
    $path = Join-Path $sourceRoot $clip.Source
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $path
    }
  }
)

if ($missing.Count -gt 0) {
  $missingList = ($missing | ForEach-Object { "  - $_" }) -join [Environment]::NewLine
  throw "The five accepted Google Flow renders must be present before ingestion:$([Environment]::NewLine)$missingList"
}

@($masterRoot, $mobileRoot, $posterRoot, $manifestRoot, $verificationRoot) | ForEach-Object {
  New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

$assets = [System.Collections.Generic.List[object]]::new()
$checks = [System.Collections.Generic.List[object]]::new()
$framePairs = [System.Collections.Generic.List[object]]::new()

foreach ($clip in $clips) {
  $sourcePath = Join-Path $sourceRoot $clip.Source
  $desktopPath = Join-Path $masterRoot "$($clip.Id).mp4"
  $mobilePath = Join-Path $mobileRoot "$($clip.Id).mp4"
  $posterPath = Join-Path $posterRoot "$($clip.Id).webp"
  $mobilePosterPath = Join-Path $posterRoot "$($clip.Id)-mobile.webp"
  $firstFramePath = Join-Path $verificationRoot "$($clip.Id)-first.png"
  $lastFramePath = Join-Path $verificationRoot "$($clip.Id)-last.png"

  Write-Host "Encoding $($clip.Source)..." -ForegroundColor Cyan
  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-i', $sourcePath,
    '-map', '0:v:0', '-an', '-vf', 'unsharp=5:5:0.22:5:5:0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-g', '8', '-keyint_min', '8', '-sc_threshold', '0',
    $desktopPath
  )

  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-i', $sourcePath,
    '-map', '0:v:0', '-an', '-vf', 'scale=-2:min(720\,ih),unsharp=5:5:0.18:5:5:0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-g', '4', '-keyint_min', '4', '-sc_threshold', '0',
    $mobilePath
  )

  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-i', $desktopPath,
    '-vf', 'select=eq(n\,0)', '-frames:v', '1', '-c:v', 'libwebp',
    '-quality', '90', '-compression_level', '6', $posterPath
  )
  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-i', $mobilePath,
    '-vf', 'select=eq(n\,0)', '-frames:v', '1', '-c:v', 'libwebp',
    '-quality', '88', '-compression_level', '6', $mobilePosterPath
  )
  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-i', $desktopPath,
    '-vf', 'select=eq(n\,0)', '-frames:v', '1', '-update', '1', $firstFramePath
  )
  Invoke-MediaCommand 'ffmpeg' @(
    '-hide_banner', '-loglevel', 'warning', '-y', '-sseof', '-0.5', '-i', $desktopPath,
    '-map', '0:v:0', '-fps_mode', 'passthrough', '-update', '1', $lastFramePath
  )

  $desktopInfo = Get-VideoInfo $desktopPath
  $mobileInfo = Get-VideoInfo $mobilePath
  $encodingPass =
    $desktopInfo.codec -eq 'h264' -and
    $mobileInfo.codec -eq 'h264' -and
    $desktopInfo.pixelFormat -eq 'yuv420p' -and
    $mobileInfo.pixelFormat -eq 'yuv420p' -and
    $desktopInfo.duration -gt 0 -and
    [math]::Abs($desktopInfo.duration - $mobileInfo.duration) -le 0.1 -and
    $mobileInfo.height -le 720

  $checks.Add([pscustomobject]@{
    kind = 'encoding'
    id = $clip.Id
    status = if ($encodingPass) { 'pass' } else { 'fail' }
    desktop = $desktopInfo
    mobile = $mobileInfo
  })

  $posterScore = Get-SsimScore $firstFramePath $posterPath
  $checks.Add([pscustomobject]@{
    kind = 'poster-to-first-frame'
    id = $clip.Id
    status = Get-CheckStatus $posterScore
    ssim = $posterScore
    threshold = 0.90
  })

  $framePairs.Add([pscustomobject]@{
    id = $clip.Id
    first = $firstFramePath
    last = $lastFramePath
  })

  $assets.Add([ordered]@{
    id = $clip.Id
    desktop = "/media/pocket-worlds/master/$($clip.Id).mp4"
    mobile = "/media/pocket-worlds/mobile/$($clip.Id).mp4"
    poster = "/media/pocket-worlds/posters/$($clip.Id).webp"
    mobilePoster = "/media/pocket-worlds/posters/$($clip.Id)-mobile.webp"
    still = $clip.Still
    duration = $desktopInfo.duration
    desktopBytes = $desktopInfo.bytes
    mobileBytes = $mobileInfo.bytes
  })
}

for ($index = 0; $index -lt $framePairs.Count - 1; $index += 1) {
  $from = $framePairs[$index]
  $to = $framePairs[$index + 1]
  $seamScore = Get-SsimScore $from.last $to.first
  $checks.Add([pscustomobject]@{
    kind = 'inter-clip-seam'
    id = "$($from.id)-to-$($to.id)"
    status = Get-CheckStatus $seamScore
    ssim = $seamScore
    threshold = 0.90
  })
}

$failedChecks = @($checks | Where-Object { $_.status -ne 'pass' })
$allChecksPass = $failedChecks.Count -eq 0
$ready = $ApproveVisual.IsPresent -and $allChecksPass
$generatedAt = [DateTime]::UtcNow.ToString('o')

$verification = [ordered]@{
  version = 1
  generatedAt = $generatedAt
  architecture = 'A'
  source = 'google-flow'
  visualApproval = $ApproveVisual.IsPresent
  passed = $allChecksPass
  ready = $ready
  checks = @($checks)
}

$manifest = [ordered]@{
  version = 1
  ready = $ready
  architecture = 'A'
  generatedAt = $generatedAt
  model = 'google-flow'
  sections = @($assets)
  connectors = @()
}

$verification | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $verificationPath -Encoding utf8
$manifest | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host ''
Write-Host "Verification report: $verificationPath" -ForegroundColor Green
Write-Host "Runtime manifest:    $manifestPath" -ForegroundColor Green

if (-not $allChecksPass) {
  Write-Warning 'The manifest remains locked because one or more checks did not pass.'
  $failedChecks | ForEach-Object {
    $scoreProperty = $_.PSObject.Properties['ssim']
    $score = if ($null -ne $scoreProperty) { " (SSIM $($scoreProperty.Value))" } else { '' }
    Write-Warning "  $($_.kind): $($_.id)$score"
  }
  exit 2
}

if (-not $ApproveVisual) {
  Write-Host 'All automated checks passed. Review the encoded journey, then rerun with -ApproveVisual.' -ForegroundColor Yellow
  exit 0
}

Write-Host 'All checks passed and visual approval was supplied. Cinematic video mode is ready.' -ForegroundColor Green
