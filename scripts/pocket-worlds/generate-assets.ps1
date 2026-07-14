[CmdletBinding()]
param(
  [ValidateSet('Estimate', 'Anchor', 'Stills', 'Draft', 'Final', 'Encode', 'Verify')]
  [string]$Phase = 'Estimate',
  [switch]$ApproveSpend,
  [switch]$ApproveAnchor,
  [switch]$ApproveDraft,
  [switch]$ApproveVisual
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$PromptPath = Join-Path $PSScriptRoot 'prompts.json'
$Work = Join-Path $Root 'artifacts\pocket-worlds'
$Public = Join-Path $Root 'public\media\pocket-worlds'
$ManifestPath = Join-Path $Public 'manifests\web-manifest.json'
$VerificationPath = Join-Path $Public 'manifests\verification.json'
$Spec = Get-Content -Raw -LiteralPath $PromptPath | ConvertFrom-Json
$Worlds = @($Spec.worlds)

$Directories = @(
  $Work,
  (Join-Path $Work 'prompts'),
  (Join-Path $Work 'stills'),
  (Join-Path $Work 'draft'),
  (Join-Path $Work 'draft\frames'),
  (Join-Path $Work 'final'),
  (Join-Path $Work 'final\frames'),
  (Join-Path $Work 'verify'),
  (Join-Path $Public 'master'),
  (Join-Path $Public 'mobile'),
  (Join-Path $Public 'posters'),
  (Join-Path $Public 'stills'),
  (Join-Path $Public 'manifests')
)
$Directories | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available."
  }
}

function Assert-GenerationApproval {
  if (-not $ApproveSpend) {
    throw 'Paid generation is locked. Re-run with -ApproveSpend only after the documented spend approval.'
  }
}

function Assert-AnchorApproval {
  if (-not $ApproveAnchor) {
    throw 'The Wander anchor is locked. Re-run with -ApproveAnchor only after the rendered anchor has been reviewed and approved.'
  }
}

function Assert-DraftApproval {
  if (-not $ApproveDraft) {
    throw 'Final generation is locked. Re-run with -ApproveDraft only after the complete low-cost previz has been reviewed and approved.'
  }
}

function Get-WorldPrompt($World) {
  return "$($Spec.stylePreamble)`nSubject: $($World.subject)"
}

function Get-DivePrompt($World) {
  return "Single continuous cinematic camera move, no cuts. Continue the same slow, steady forward glide. $($World.diveMotion) The camera moves into $($World.label) toward $($World.focalPoint). In the final second, settle back into a slow, steady forward glide toward the opening to the next scene. $($Spec.stylePreamble) Smooth, graceful, slow motion, subtle parallax. No text, no captions."
}

function Get-ConnectorPrompt($World) {
  return "Single continuous cinematic camera move, no cuts. $($World.connectorMotion) One connected miniature Pocket Worlds landscape, seamless flowing aerial transition. $($Spec.stylePreamble) Smooth, graceful, slow motion. No text, no captions."
}

function Write-PromptFiles {
  foreach ($world in $Worlds) {
    Set-Content -LiteralPath (Join-Path $Work "prompts\still-$($world.id).txt") -Value (Get-WorldPrompt $world)
    Set-Content -LiteralPath (Join-Path $Work "prompts\dive-$($world.id).txt") -Value (Get-DivePrompt $world)
    $connector = $world.PSObject.Properties['connectorTo']
    if ($connector -and $connector.Value) {
      Set-Content -LiteralPath (Join-Path $Work "prompts\connector-$($world.id).txt") -Value (Get-ConnectorPrompt $world)
    }
  }
}

function Start-HiggsfieldCommand {
  param(
    [Parameter(Mandatory)] [string]$Name,
    [Parameter(Mandatory)] [string[]]$Arguments,
    [Parameter(Mandatory)] [string]$Destination,
    [Parameter(Mandatory)] [string]$JsonPath,
    [Parameter(Mandatory)] [string]$ErrorPath
  )

  $argumentsJson = $Arguments | ConvertTo-Json -Compress
  return Start-Job -Name $Name -ScriptBlock {
    param($ArgumentsJson, $Destination, $JsonPath, $ErrorPath)
    $ErrorActionPreference = 'Stop'
    if (Test-Path -LiteralPath $Destination) {
      return "skip $Destination"
    }

    $commandArguments = @($ArgumentsJson | ConvertFrom-Json)
    $stdout = & higgsfield @commandArguments 2> $ErrorPath
    if ($LASTEXITCODE -ne 0) {
      $details = Get-Content -Raw -LiteralPath $ErrorPath -ErrorAction SilentlyContinue
      throw "Higgsfield failed: $details"
    }

    $json = $stdout -join [Environment]::NewLine
    Set-Content -LiteralPath $JsonPath -Value $json
    $result = @($json | ConvertFrom-Json)[0]
    $url = $result.result_url
    if (-not $url) {
      throw "Higgsfield returned no result_url for $Destination"
    }
    Invoke-WebRequest -Uri $url -OutFile $Destination
    return "created $Destination"
  } -ArgumentList $argumentsJson, $Destination, $JsonPath, $ErrorPath
}

function Wait-HiggsfieldBatch([System.Collections.Generic.List[object]]$Jobs) {
  if ($Jobs.Count -eq 0) {
    return
  }
  $Jobs | Wait-Job | Out-Null
  foreach ($job in $Jobs) {
    try {
      Receive-Job -Job $job -ErrorAction Stop | Write-Host
      if ($job.State -ne 'Completed') {
        throw "Generation job '$($job.Name)' ended in state $($job.State)."
      }
    } finally {
      Remove-Job -Job $job -Force
    }
  }
}

function New-StillJob($World) {
  $prompt = Get-WorldPrompt $World
  $arguments = [System.Collections.Generic.List[string]]::new()
  @('generate', 'create', 'gpt_image_2', '--prompt', $prompt, '--aspect_ratio', '16:9', '--resolution', '2k', '--quality', 'high') |
    ForEach-Object { $arguments.Add($_) }
  foreach ($reference in @($World.references)) {
    $arguments.Add('--image')
    $arguments.Add((Join-Path $Root $reference))
  }
  @('--wait', '--wait-timeout', '20m', '--json') | ForEach-Object { $arguments.Add($_) }

  return Start-HiggsfieldCommand `
    -Name "still-$($World.id)" `
    -Arguments $arguments.ToArray() `
    -Destination (Join-Path $Work "stills\$($World.id).png") `
    -JsonPath (Join-Path $Work "stills\$($World.id).json") `
    -ErrorPath (Join-Path $Work "stills\$($World.id).err")
}

function New-VideoJob {
  param(
    [Parameter(Mandatory)] [string]$Name,
    [Parameter(Mandatory)] [string]$Model,
    [Parameter(Mandatory)] [string]$Prompt,
    [Parameter(Mandatory)] [string]$StartImage,
    [string]$EndImage,
    [Parameter(Mandatory)] [int]$Duration,
    [Parameter(Mandatory)] [ValidateSet('draft', 'final')] [string]$Tier,
    [Parameter(Mandatory)] [string]$Destination
  )

  $arguments = [System.Collections.Generic.List[string]]::new()
  @('generate', 'create', $Model, '--prompt', $Prompt, '--start-image', $StartImage) |
    ForEach-Object { $arguments.Add($_) }
  if ($EndImage) {
    $arguments.Add('--end-image')
    $arguments.Add($EndImage)
  }
  if ($Tier -eq 'final') {
    @('--mode', 'std', '--resolution', '1080p', '--bitrate_mode', 'high') | ForEach-Object { $arguments.Add($_) }
  } else {
    @('--resolution', '720p') | ForEach-Object { $arguments.Add($_) }
  }
  @('--aspect_ratio', '16:9', '--duration', [string]$Duration, '--generate_audio', 'false', '--wait', '--wait-timeout', '25m', '--json') |
    ForEach-Object { $arguments.Add($_) }

  $base = [System.IO.Path]::ChangeExtension($Destination, $null)
  return Start-HiggsfieldCommand `
    -Name $Name `
    -Arguments $arguments.ToArray() `
    -Destination $Destination `
    -JsonPath "$base.json" `
    -ErrorPath "$base.err"
}

function Invoke-FrameExtraction([string]$Tier) {
  $frameDirectory = Join-Path $Work "$Tier\frames"
  foreach ($world in $Worlds) {
    $clip = Join-Path $Work "$Tier\dive-$($world.id).mp4"
    if (-not (Test-Path -LiteralPath $clip)) {
      throw "Missing dive clip: $clip"
    }
    & ffmpeg -v error -y -ss 0 -i $clip -frames:v 1 -q:v 2 (Join-Path $frameDirectory "first-$($world.id).png")
    if ($LASTEXITCODE -ne 0) { throw "First-frame extraction failed for $($world.id)." }
    & ffmpeg -v error -y -sseof -0.04 -i $clip -frames:v 1 -q:v 2 (Join-Path $frameDirectory "last-$($world.id).png")
    if ($LASTEXITCODE -ne 0) { throw "Last-frame extraction failed for $($world.id)." }
  }
}

function Invoke-VideoTier([ValidateSet('draft', 'final')] [string]$Tier) {
  Assert-GenerationApproval
  $model = if ($Tier -eq 'draft') { 'seedance_2_0_mini' } else { 'seedance_2_0' }
  $jobs = [System.Collections.Generic.List[object]]::new()

  foreach ($world in $Worlds) {
    $still = Join-Path $Work "stills\$($world.id).png"
    if (-not (Test-Path -LiteralPath $still)) {
      throw "Missing approved world still: $still"
    }
    $jobs.Add((New-VideoJob -Name "$Tier-dive-$($world.id)" -Model $model -Prompt (Get-DivePrompt $world) -StartImage $still -Duration 8 -Tier $Tier -Destination (Join-Path $Work "$Tier\dive-$($world.id).mp4")))
  }
  Wait-HiggsfieldBatch $jobs
  Invoke-FrameExtraction $Tier

  $connectorJobs = [System.Collections.Generic.List[object]]::new()
  for ($index = 0; $index -lt $Worlds.Count - 1; $index += 1) {
    $world = $Worlds[$index]
    $next = $Worlds[$index + 1]
    $frameDirectory = Join-Path $Work "$Tier\frames"
    $connectorJobs.Add((New-VideoJob `
      -Name "$Tier-connector-$($world.id)" `
      -Model $model `
      -Prompt (Get-ConnectorPrompt $world) `
      -StartImage (Join-Path $frameDirectory "last-$($world.id).png") `
      -EndImage (Join-Path $frameDirectory "first-$($next.id).png") `
      -Duration 5 `
      -Tier $Tier `
      -Destination (Join-Path $Work "$Tier\connector-$($world.id)-to-$($next.id).mp4")))
  }
  Wait-HiggsfieldBatch $connectorJobs
}

function Invoke-Encode([string]$Input, [string]$Desktop, [string]$Mobile, [string]$Poster, [string]$MobilePoster) {
  & ffmpeg -v error -y -i $Input -an -vf 'unsharp=5:5:0.8:5:5:0.0' -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart $Desktop
  if ($LASTEXITCODE -ne 0) { throw "Desktop encoding failed for $Input" }
  & ffmpeg -v error -y -i $Input -an -vf 'scale=-2:720,unsharp=5:5:0.6:5:5:0.0' -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart $Mobile
  if ($LASTEXITCODE -ne 0) { throw "Mobile encoding failed for $Input" }
  & ffmpeg -v error -y -ss 0 -i $Desktop -frames:v 1 -c:v libwebp -quality 88 $Poster
  if ($LASTEXITCODE -ne 0) { throw "Poster extraction failed for $Input" }
  & ffmpeg -v error -y -ss 0 -i $Mobile -frames:v 1 -c:v libwebp -quality 86 $MobilePoster
  if ($LASTEXITCODE -ne 0) { throw "Mobile poster extraction failed for $Input" }
}

function Get-Probe([string]$Path) {
  $raw = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name -show_entries format=duration -of json $Path
  if ($LASTEXITCODE -ne 0) { throw "ffprobe failed for $Path" }
  return ($raw -join [Environment]::NewLine) | ConvertFrom-Json
}

function New-ManifestAsset([string]$Id, [string]$Desktop, [string]$Mobile, [string]$Poster, [string]$MobilePoster, [string]$Still) {
  $probe = Get-Probe $Desktop
  $publicRoot = Join-Path $Root 'public'
  return [ordered]@{
    id = $Id
    desktop = $Desktop.Substring($publicRoot.Length).Replace('\', '/')
    mobile = $Mobile.Substring($publicRoot.Length).Replace('\', '/')
    poster = $Poster.Substring($publicRoot.Length).Replace('\', '/')
    mobilePoster = $MobilePoster.Substring($publicRoot.Length).Replace('\', '/')
    still = $Still.Substring($publicRoot.Length).Replace('\', '/')
    duration = [Math]::Round([double]$probe.format.duration, 3)
    desktopBytes = (Get-Item -LiteralPath $Desktop).Length
    mobileBytes = (Get-Item -LiteralPath $Mobile).Length
  }
}

function Invoke-Encoding {
  $sections = [System.Collections.Generic.List[object]]::new()
  $connectors = [System.Collections.Generic.List[object]]::new()
  foreach ($world in $Worlds) {
    $input = Join-Path $Work "final\dive-$($world.id).mp4"
    $desktop = Join-Path $Public "master\$($world.id).mp4"
    $mobile = Join-Path $Public "mobile\$($world.id).mp4"
    $poster = Join-Path $Public "posters\$($world.id).webp"
    $mobilePoster = Join-Path $Public "posters\$($world.id)-mobile.webp"
    $still = Join-Path $Public "stills\$($world.id).webp"
    Invoke-Encode $input $desktop $mobile $poster $mobilePoster
    & ffmpeg -v error -y -i (Join-Path $Work "stills\$($world.id).png") -vf 'scale=1800:-2' -c:v libwebp -quality 88 $still
    if ($LASTEXITCODE -ne 0) { throw "Still encoding failed for $($world.id)." }
    $sections.Add((New-ManifestAsset $world.id $desktop $mobile $poster $mobilePoster $still))
  }

  for ($index = 0; $index -lt $Worlds.Count - 1; $index += 1) {
    $world = $Worlds[$index]
    $next = $Worlds[$index + 1]
    $id = "$($world.id)-to-$($next.id)"
    $input = Join-Path $Work "final\connector-$id.mp4"
    $desktop = Join-Path $Public "master\$id.mp4"
    $mobile = Join-Path $Public "mobile\$id.mp4"
    $poster = Join-Path $Public "posters\$id.webp"
    $mobilePoster = Join-Path $Public "posters\$id-mobile.webp"
    $still = Join-Path $Public "stills\$($next.id).webp"
    Invoke-Encode $input $desktop $mobile $poster $mobilePoster
    $connectors.Add((New-ManifestAsset $id $desktop $mobile $poster $mobilePoster $still))
  }

  $manifest = [ordered]@{
    version = 1
    ready = $false
    architecture = 'B'
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    model = 'seedance_2_0'
    sections = $sections
    connectors = $connectors
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ManifestPath
}

function Get-Ssim([string]$First, [string]$Second) {
  $output = & ffmpeg -v info -i $First -i $Second -lavfi ssim -f null NUL 2>&1
  $match = [regex]::Match(($output -join [Environment]::NewLine), 'All:([0-9.]+)')
  if (-not $match.Success) { throw "Unable to calculate SSIM for $First and $Second" }
  return [double]$match.Groups[1].Value
}

function Invoke-Verification {
  $checks = [System.Collections.Generic.List[object]]::new()
  $verifyDirectory = Join-Path $Work 'verify'
  foreach ($world in $Worlds) {
    $master = Join-Path $Public "master\$($world.id).mp4"
    $poster = Join-Path $Public "posters\$($world.id).webp"
    $first = Join-Path $verifyDirectory "first-$($world.id).png"
    & ffmpeg -v error -y -ss 0 -i $master -frames:v 1 $first
    $score = Get-Ssim $first $poster
    $checks.Add([ordered]@{ type = 'poster'; id = $world.id; ssim = $score; status = if ($score -ge 0.90) { 'pass' } elseif ($score -ge 0.75) { 'warning' } else { 'fail' } })
  }

  for ($index = 0; $index -lt $Worlds.Count - 1; $index += 1) {
    $world = $Worlds[$index]
    $next = $Worlds[$index + 1]
    $connectorId = "$($world.id)-to-$($next.id)"
    $dive = Join-Path $Public "master\$($world.id).mp4"
    $connector = Join-Path $Public "master\$connectorId.mp4"
    $nextDive = Join-Path $Public "master\$($next.id).mp4"
    $diveLast = Join-Path $verifyDirectory "last-$($world.id).png"
    $connectorFirst = Join-Path $verifyDirectory "first-$connectorId.png"
    $connectorLast = Join-Path $verifyDirectory "last-$connectorId.png"
    $nextFirst = Join-Path $verifyDirectory "first-$($next.id)-seam.png"
    & ffmpeg -v error -y -sseof -0.04 -i $dive -frames:v 1 $diveLast
    & ffmpeg -v error -y -ss 0 -i $connector -frames:v 1 $connectorFirst
    & ffmpeg -v error -y -sseof -0.04 -i $connector -frames:v 1 $connectorLast
    & ffmpeg -v error -y -ss 0 -i $nextDive -frames:v 1 $nextFirst
    $scores = @(
      [ordered]@{ type = 'seam'; id = "$($world.id)-to-connector"; ssim = (Get-Ssim $diveLast $connectorFirst) },
      [ordered]@{ type = 'seam'; id = "connector-to-$($next.id)"; ssim = (Get-Ssim $connectorLast $nextFirst) }
    )
    foreach ($result in $scores) {
      $result['status'] = if ($result.ssim -ge 0.90) { 'pass' } elseif ($result.ssim -ge 0.75) { 'warning' } else { 'fail' }
      $checks.Add($result)
    }
  }

  $allPass = @($checks | Where-Object { $_.status -ne 'pass' }).Count -eq 0
  $report = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    thresholds = [ordered]@{ pass = 0.90; warning = 0.75 }
    allPass = $allPass
    checks = $checks
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $VerificationPath

  if ($ApproveVisual -and $allPass) {
    $manifest = Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
    $manifest.ready = $true
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ManifestPath
  } elseif ($ApproveVisual -and -not $allPass) {
    throw 'Visual approval cannot unlock the manifest because at least one SSIM check is not a pass.'
  }
}

function Get-Cost([string[]]$Arguments) {
  $raw = & higgsfield generate cost @Arguments --json
  if ($LASTEXITCODE -ne 0) { throw "Cost estimate failed for $($Arguments -join ' ')" }
  return [double](($raw -join [Environment]::NewLine) | ConvertFrom-Json).credits
}

function Show-Estimate {
  $first = Join-Path $Root 'public\photos\the-sea\w1440.webp'
  $second = Join-Path $Root 'public\photos\tower-and-sky\w1440.webp'
  $prompt = 'Single continuous cinematic camera move through a miniature landscape, no cuts.'
  $still = Get-Cost @('gpt_image_2', '--prompt', 'Cinematic miniature diorama landscape', '--aspect_ratio', '16:9', '--resolution', '2k', '--quality', 'high')
  $draftDive = Get-Cost @('seedance_2_0_mini', '--prompt', $prompt, '--start-image', $first, '--aspect_ratio', '16:9', '--resolution', '720p', '--duration', '8', '--generate_audio', 'false')
  $draftConnector = Get-Cost @('seedance_2_0_mini', '--prompt', $prompt, '--start-image', $first, '--end-image', $second, '--aspect_ratio', '16:9', '--resolution', '720p', '--duration', '5', '--generate_audio', 'false')
  $finalDive = Get-Cost @('seedance_2_0', '--prompt', $prompt, '--start-image', $first, '--mode', 'std', '--aspect_ratio', '16:9', '--resolution', '1080p', '--bitrate_mode', 'high', '--duration', '8', '--generate_audio', 'false')
  $finalConnector = Get-Cost @('seedance_2_0', '--prompt', $prompt, '--start-image', $first, '--end-image', $second, '--mode', 'std', '--aspect_ratio', '16:9', '--resolution', '1080p', '--bitrate_mode', 'high', '--duration', '5', '--generate_audio', 'false')
  $base = 5 * $still + 5 * $draftDive + 4 * $draftConnector + 5 * $finalDive + 4 * $finalConnector
  [ordered]@{
    stills = [ordered]@{ count = 5; each = $still; total = 5 * $still }
    draftDives = [ordered]@{ count = 5; each = $draftDive; total = 5 * $draftDive }
    draftConnectors = [ordered]@{ count = 4; each = $draftConnector; total = 4 * $draftConnector }
    finalDives = [ordered]@{ count = 5; each = $finalDive; total = 5 * $finalDive }
    finalConnectors = [ordered]@{ count = 4; each = $finalConnector; total = 4 * $finalConnector }
    baseTotal = $base
    recommendedWithRerolls = [ordered]@{ minimum = [Math]::Ceiling($base * 1.20); maximum = [Math]::Ceiling($base * 1.30) }
  } | ConvertTo-Json -Depth 5
}

Assert-Command 'higgsfield'
Assert-Command 'ffmpeg'
Assert-Command 'ffprobe'
Write-PromptFiles

switch ($Phase) {
  'Estimate' { Show-Estimate }
  'Anchor' {
    Assert-GenerationApproval
    $jobs = [System.Collections.Generic.List[object]]::new()
    $jobs.Add((New-StillJob $Worlds[0]))
    Wait-HiggsfieldBatch $jobs
  }
  'Stills' {
    Assert-GenerationApproval
    Assert-AnchorApproval
    if (-not (Test-Path -LiteralPath (Join-Path $Work 'stills\wander.png'))) {
      throw 'Generate and approve the Wander anchor before batching the remaining stills.'
    }
    $jobs = [System.Collections.Generic.List[object]]::new()
    foreach ($world in $Worlds | Select-Object -Skip 1) { $jobs.Add((New-StillJob $world)) }
    Wait-HiggsfieldBatch $jobs
  }
  'Draft' {
    Assert-AnchorApproval
    Invoke-VideoTier 'draft'
  }
  'Final' {
    Assert-DraftApproval
    Invoke-VideoTier 'final'
  }
  'Encode' { Invoke-Encoding }
  'Verify' { Invoke-Verification }
}
