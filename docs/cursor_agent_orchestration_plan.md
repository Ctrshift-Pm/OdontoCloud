# Template de orquestracao com Cursor Agent

Este documento e uma versao generica e reutilizavel do plano de orquestracao com Cursor Agent. Use em outros projetos para coordenar varios agentes por repositorio/escopo, com relatorios em arquivo e follow-ups iterativos.

## Objetivo

Reduzir trabalho manual ao coordenar agentes externos via Cursor CLI.

Fluxo desejado:

1. O coordenador escreve prompts em arquivos.
2. Cursor Agent executa cada prompt no workspace correto.
3. Cada agente grava relatorio em `.md`.
4. O coordenador le relatorios, audita diffs e decide follow-up.
5. O usuario faz apenas smoke final e decisoes de produto.

## Pre-requisitos

1. Cursor Agent instalado e autenticado.
2. Comando `agent` disponivel no `PATH`.
3. Modelo desejado disponivel na conta.
4. Repositorios locais clonados.
5. Permissao para executar testes/builds localmente.

Validar instalacao:

```powershell
Get-Command agent
agent --version
agent models
```

Teste headless minimo:

```powershell
agent --print --trust --model <MODEL_ID> "Responda apenas: ok. Nao altere arquivos."
```

## Modelo

Liste modelos:

```powershell
agent models
```

Modelo padrao recomendado para este fluxo:

```text
Codex 5.3 Spark
ID: gpt-5.3-codex-spark-preview
```

Use esse modelo por padrao enquanto ele estiver disponivel/custo-beneficio adequado. Se outro projeto precisar trocar, substitua `<MODEL_ID>` pelo ID exato retornado em `agent models`.

Comando padrao recomendado:

```powershell
agent --print --trust --force --model gpt-5.3-codex-spark-preview "<PROMPT>"
```

Forma generica:

```powershell
agent --print --trust --force --model <MODEL_ID> "<PROMPT>"
```

Exemplo equivalente usando o modelo recomendado:

```powershell
agent --print --trust --force --model gpt-5.3-codex-spark-preview "<PROMPT>"
```

## Estrutura recomendada

No repositorio coordenador, criar:

```text
agent_prompts/
  agent_a.md
  agent_b.md
  agent_c.md

agent_reports/
  agent_a.md
  agent_b.md
  agent_c.md

scripts/
  launch_agents.ps1
```

Os prompts podem ficar em um repo central mesmo quando os agentes trabalham em outros repos.

## Mapeamento de agentes

Exemplo:

```text
Agent A -> C:/work/project-mobile
Agent B -> C:/work/project-web
Agent C -> C:/work/project-backend
Agent D -> C:/work/project-admin
Auditor -> leitura cross-repo, sem mudancas por padrao
```

Regra:

- Nao rode dois agentes no mesmo workspace ao mesmo tempo, a menos que os arquivos sejam totalmente disjuntos.
- Se um agente depende do contrato de outro, espere o contrato estabilizar antes de rodar consumidores.
- Para mudancas independentes, rode agentes em paralelo.

## Prompt padrao

Cabecalho recomendado:

```text
Use o modelo Codex 5.3 Spark (`gpt-5.3-codex-spark-preview`).
Nivel de pensamento: alto.

Trabalhe apenas em `<WORKSPACE_PATH>`.
Nao altere arquivos fora do escopo.
Nao reverta mudancas de terceiros.
Nao use comandos destrutivos.
Se encontrar mudanca inesperada conflitante, pare e relate.
```

Corpo recomendado:

```text
## Contexto
<problema, logs, decisao de produto, contrato esperado>

## Tarefas
1. ...
2. ...
3. ...

## Validacao obrigatoria
Rode:
<build/test/analyze/check>

## Criterios de aceite
- ...
- ...
- ...
```

Rodape obrigatorio:

```text
Ao final, escreva obrigatoriamente um relatorio em:
<COORDINATOR_REPO>/agent_reports/<AGENT_NAME>.md

Inclua:
- causa raiz;
- arquivos alterados;
- comandos rodados;
- resultado exato de cada comando;
- testes adicionados/alterados;
- pendencias;
- blockers;
- se houve mudancas fora do escopo.
```

## Execucao de um agente

Forma recomendada no PowerShell com o modelo padrao:

```powershell
$prompt = Get-Content -Raw <COORDINATOR_REPO>\agent_prompts\<AGENT_NAME>.md
agent --print --trust --force --model gpt-5.3-codex-spark-preview --workspace <WORKSPACE_PATH> $prompt
```

Forma generica no PowerShell:

```powershell
$prompt = Get-Content -Raw <COORDINATOR_REPO>\agent_prompts\<AGENT_NAME>.md
agent --print --trust --force --model <MODEL_ID> --workspace <WORKSPACE_PATH> $prompt
```

Exemplo:

```powershell
$prompt = Get-Content -Raw C:\work\coordinator\agent_prompts\backend.md
agent --print --trust --force --model gpt-5.3-codex-spark-preview --workspace C:\work\backend $prompt
```

## Execucao paralela

Exemplo de `scripts/launch_agents.ps1`:

```powershell
$root = 'C:\work\coordinator'
$model = 'gpt-5.3-codex-spark-preview'

Start-Process powershell -ArgumentList '-NoExit', '-Command', "$prompt = Get-Content -Raw $root\agent_prompts\backend.md; agent --print --trust --force --model $model --workspace C:\work\backend `$prompt"

Start-Process powershell -ArgumentList '-NoExit', '-Command', "$prompt = Get-Content -Raw $root\agent_prompts\web.md; agent --print --trust --force --model $model --workspace C:\work\web `$prompt"

Start-Process powershell -ArgumentList '-NoExit', '-Command', "$prompt = Get-Content -Raw $root\agent_prompts\mobile.md; agent --print --trust --force --model $model --workspace C:\work\mobile `$prompt"
```

Use paralelismo com cuidado:

- Bom: repos independentes, bugs visuais separados, testes independentes.
- Ruim: backend mudando contrato enquanto frontends implementam em cima de contrato instavel.

## Leitura de relatorios

```powershell
Get-ChildItem <COORDINATOR_REPO>\agent_reports
Get-Content <COORDINATOR_REPO>\agent_reports\<AGENT_NAME>.md
```

Auditar diff:

```powershell
git -C <WORKSPACE_PATH> status --short
git -C <WORKSPACE_PATH> diff --stat
git -C <WORKSPACE_PATH> diff
```

## Ciclo operacional

1. Criar/atualizar prompt.
2. Rodar agente.
3. Ler relatorio.
4. Auditar diff.
5. Se falhou, criar follow-up.
6. Se passou, rodar proximo agente ou auditor.
7. Quando todos passam, executar auditor cross-repo.
8. Usuario faz smoke final.

## Politica de continuidade automatica

O coordenador deve diferenciar parada incompleta de parada pronta para smoke.

### Continuar automaticamente sem pedir smoke

Se o agente parou apos concluir apenas parte das tarefas objetivas, e ainda ha tasks claras pendentes, o coordenador deve criar follow-up e rodar o agente novamente sem acionar o usuario.

Exemplos:

- O agente concluiu `Task 2`, mas o prompt exigia `Task 3` a `Task 8`.
- O agente rodou build, mas nao rodou testes obrigatorios.
- O agente disse "proximo passo sugerido" para algo que ainda fazia parte do escopo original.
- O agente implementou contrato parcial e deixou arquivo/rota ainda pendente.

Acao:

1. Ler relatorio.
2. Identificar tarefas pendentes.
3. Criar prompt de follow-up objetivo.
4. Rodar `agent` novamente.
5. Repetir ate chegar em estado completo ou blocker real.

### Pedir smoke ao usuario

Pedir smoke apenas quando a implementacao estiver funcionalmente completa e a validacao depender de comportamento visual, dados reais, ambiente de producao-like ou percepcao de UX.

Exemplos:

- Painel diz que edicao persiste e testes passam, mas o bug foi encontrado em smoke real.
- Calendario/dropdown/layout foi alterado e precisa validacao visual.
- Fluxo completo de cadastro/anuncio depende de conta real, upload real ou backend remoto.

Acao:

1. Resumir exatamente o que testar.
2. Listar passos curtos de smoke.
3. Aguardar retorno do usuario.

### Acionar auditor/sentinela

Acionar auditor quando:

- Todos os agentes de uma trilha terminaram.
- Ha mudancas em varios repos com contrato compartilhado.
- E necessario decidir fechamento tecnico.

Nao acionar auditor se ainda ha tasks assumidamente pendentes.

### Parar e pedir decisao

Parar para decisao do usuario quando:

- A correcao exige mudanca de produto/UX nao decidida.
- O agente encontrou conflito de escopo ou mudanca inesperada.
- Resolver exigiria comando destrutivo.
- Ha trade-off tecnico relevante com impacto estrutural.

## Auditor/Sentinela

Use um agente auditor quando varios repos foram alterados.

Prompt do auditor deve ser preferencialmente read-only:

```text
Nivel de pensamento: alto.

Modo auditor. Nao altere arquivos.
Leia os relatorios e arquivos relevantes nos repos:
- <repo A>
- <repo B>
- <repo C>

Retorne:
- aprovado/reprovado item por item;
- inconsistencias cross-repo;
- riscos residuais;
- comandos/evidencias usados;
- decisao de fechamento.

Escreva relatorio em:
<COORDINATOR_REPO>/agent_reports/auditor.md
```

Rodar auditor em modo plan/ask quando possivel:

```powershell
agent --print --trust --model <MODEL_ID> --mode plan --workspace <COORDINATOR_REPO> $prompt
```

## Politica de seguranca

- Nunca usar `git reset --hard`, `git checkout --`, `Remove-Item -Recurse` ou comandos destrutivos sem autorizacao explicita.
- Nao permitir que agente reverta mudancas de outros agentes sem coordenacao.
- Exigir testes/builds no prompt.
- Exigir relatorio em arquivo.
- Nao declarar fechamento sem:
  - testes principais passando;
  - relatorio escrito;
  - diff revisado;
  - smoke quando mudanca for visual/UX.

## Quando usar worktrees

Use `--worktree` quando quiser isolar mudancas experimentais:

```powershell
agent --print --trust --force --model <MODEL_ID> --workspace <REPO> --worktree <TASK_NAME> $prompt
```

Vantagens:

- reduz conflito com trabalho atual;
- facilita descartar experimento;
- bom para spikes.

Desvantagens:

- exige integrar depois;
- pode complicar testes que dependem de arquivos locais/gerados.

## Falhas comuns

### O agente nao escreveu relatorio

Tratamento:

1. Verificar terminal/log.
2. Verificar se prompt tinha caminho correto.
3. Reexecutar com instrucao mais curta e obrigatoria.

### O agente passou teste mas smoke falhou

Tratamento:

1. Escrever follow-up com evidencia do smoke.
2. Exigir teste que reproduza o fluxo real.
3. Auditar se teste anterior mockava endpoint errado ou caminho superficial.

### O agente alterou escopo errado

Tratamento:

1. Parar novas execucoes.
2. Auditar diff.
3. Reverter apenas com autorizacao explicita ou pedir ao agente ajuste controlado.

### Build falhou apos agente

Tratamento:

1. Rodar prompt curto no mesmo repo com erro exato.
2. Exigir correcao + build + testes afetados.

## Checklist para novo projeto

1. Definir repo coordenador.
2. Criar `agent_prompts/` e `agent_reports/`.
3. Rodar `agent models` e escolher `<MODEL_ID>`.
4. Criar mapeamento de agentes para repos.
5. Criar prompts com relatorio obrigatorio.
6. Rodar um piloto pequeno.
7. Verificar relatorio + diff.
8. Escalar para paralelo.
9. Rodar auditor.
10. Fazer smoke final.
