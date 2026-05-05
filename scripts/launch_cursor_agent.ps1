param(
  [Parameter(Mandatory = $true)]
  [string]$PromptName,

  [string]$Workspace = "D:\OdontoCloud",

  [string]$Model = "gpt-5.3-codex-spark-preview"
)

$ErrorActionPreference = "Stop"

$root = "D:\OdontoCloud"
$promptPath = Join-Path $root "agent_prompts\$PromptName.md"

if (-not (Test-Path -LiteralPath $promptPath)) {
  throw "Prompt nao encontrado: $promptPath"
}

$prompt = Get-Content -Raw -LiteralPath $promptPath
agent --print --trust --force --model $Model --workspace $Workspace $prompt
