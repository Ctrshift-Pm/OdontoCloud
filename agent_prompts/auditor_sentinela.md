Use o modelo Codex 5.3 Spark (`gpt-5.3-codex-spark-preview`).
Nivel de pensamento: alto.

Modo auditor. Trabalhe apenas em `D:\OdontoCloud`.
Nao altere arquivos.
Nao use comandos destrutivos.

## Contexto

Auditar fechamento tecnico apos execucao dos agentes:

- Recepcionista/Agenda
- Dentista/Odontograma
- Analista Financeiro

O workspace nao possui `.git` detectavel. Audite por relatorios, leitura de arquivos e comandos de validacao.

## Leia

- `agent_reports/recepcionista_agenda.md`
- `agent_reports/dentista_odontograma.md`
- `agent_reports/analista_financeiro.md`
- `docs/PROGRESS.md`
- `docs/ODONTOCLOUD_CONTEXT.md`
- `docs/ROADMAP_BLOCOS.md`
- `docs/TEST_STRATEGY.md`
- arquivos alterados listados nos relatorios

## Tarefa

1. Conferir se cada agente cumpriu tarefas e criterios de aceite.
2. Conferir inconsistencias cross-module.
3. Conferir se comandos obrigatorios passaram.
4. Conferir se ha mudanca fora de escopo relatada.
5. Identificar riscos residuais reais.
6. Decidir:
   - aprovado para smoke;
   - reprovado com follow-ups objetivos;
   - bloqueado por decisao de produto.

## Validacao Recomendada

Rode comandos read-only/validacao:

```powershell
dotnet build OdontoCloud.slnx
dotnet test OdontoCloud.slnx
cd odontocloud-frontend
npm run lint
npm run build
npm run test:e2e
```

## Relatorio Obrigatorio

Ao final, escreva obrigatoriamente um relatorio em:

`D:\OdontoCloud\agent_reports\auditor_sentinela.md`

Inclua:

- aprovado/reprovado por trilha;
- inconsistencias;
- comandos/evidencias usados;
- riscos residuais;
- recomendacao final;
- passos de smoke para o usuario, somente se aprovado para smoke.
