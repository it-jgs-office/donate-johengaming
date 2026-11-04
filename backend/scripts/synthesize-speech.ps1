param(
    [Parameter(Mandatory = $true)]
    [string] $TextBase64,

    [Parameter(Mandatory = $true)]
    [string] $OutputPath
)

$ErrorActionPreference = 'Stop'

$text = [System.Text.Encoding]::UTF8.GetString(
    [System.Convert]::FromBase64String($TextBase64)
)

$outputDirectory = [System.IO.Path]::GetDirectoryName($OutputPath)
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

$python = Get-Command python -ErrorAction SilentlyContinue

if (-not $python) {
    throw 'Python tidak ditemukan. Install Python dan dependency dari requirements.txt.'
}

& $python.Source -m edge_tts `
    --voice 'id-ID-GadisNeural' `
    --rate '-5%' `
    --volume '+0%' `
    --pitch '+0Hz' `
    --text $text `
    --write-media $OutputPath `
    --no-progress

if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $OutputPath)) {
    throw 'Gagal membuat audio dengan voice id-ID-GadisNeural.'
}
