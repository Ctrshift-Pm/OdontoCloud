Use o modelo Codex 5.3 Spark (`gpt-5.3-codex-spark-preview`).
Nivel de pensamento: alto.

Trabalhe apenas em `D:\OdontoCloud`.
Nao altere arquivos fora do escopo.
Nao reverta mudancas de terceiros.
Nao use comandos destrutivos.
Se encontrar mudanca inesperada conflitante, pare e relate.

## Contexto

O workspace atual nao possui `.git` detectavel na raiz. Portanto, seja rigoroso ao relatar arquivos alterados.

O build .NET esta bloqueado por:

```text
src/OdontoCloud.Application/UseCases/Agendamentos/Commands/UpdateAgendamentoCommandHandler.cs
CS0246: Dentista nao encontrado
```

A documentacao principal (`OdontoCloud_Documentacao_Completa.docx`) descreve Agenda como central de agendamentos da clinica, com agenda por dentista e modos de visualizacao. A tela semanal nao deve esconder sabado/domingo sem regra explicita. Hoje `getWeekDays` retorna 5 dias, enquanto outros modos mostram fim de semana.

## Leia Antes

- `docs/ODONTOCLOUD_CONTEXT.md`
- `docs/ROADMAP_BLOCOS.md`
- `docs/TEST_STRATEGY.md`
- `docs/PROGRESS.md`
- `OdontoCloud_Documentacao_Completa.docx`
- `src/OdontoCloud.Application/UseCases/Agendamentos/Commands/UpdateAgendamentoCommandHandler.cs`
- `src/OdontoCloud.Application/UseCases/Agendamentos/Commands/CreateAgendamentoCommandHandler.cs`
- `odontocloud-frontend/src/components/agenda/agendaUtils.js`
- `odontocloud-frontend/src/components/agenda/AgendaBoard.jsx`
- `odontocloud-frontend/src/pages/Agenda.jsx`
- `odontocloud-frontend/tests/e2e/agenda.spec.js`
- `tests/OdontoCloud.Api.IntegrationTests/AgendamentosApiIntegrationTests.cs`

## Tarefas

1. Corrigir o build .NET quebrado em `UpdateAgendamentoCommandHandler.cs`.
   - Use a referencia/namespace correto da entidade `Dentista`.
   - Nao criar tipo duplicado.

2. Ajustar a visualizacao semanal da Agenda para semana completa.
   - `getWeekDays` deve retornar 7 dias.
   - `getRangeEndExclusive` em modo `week` deve cobrir 7 dias.
   - `formatWeekLabel` deve refletir segunda a domingo.
   - O layout deve continuar responsivo; se necessario, ajuste largura minima/scroll.

3. Preservar a agenda dinamica por dentista.
   - Dias fora de `agendaConfig.diasDaSemana` podem aparecer como indisponiveis/sem slot clicavel, mas nao devem sumir da semana.
   - Criacao/edicao fora da agenda deve continuar bloqueada pelo backend.

4. Corrigir estabilidade do E2E de agenda.
   - Evite clique em slot ocupado.
   - Use seed/dia/horario deterministico.
   - Cubra que sabado e domingo aparecem no modo semanal.

5. Nao mexer em Prontuario/Odontograma ou Financeiro.

6. Atualizar `docs/PROGRESS.md` com arquivos, comandos, resultado e pendencias.

## Validacao Obrigatoria

Rode:

```powershell
docker compose up -d postgres
dotnet build OdontoCloud.slnx
dotnet test OdontoCloud.slnx
cd odontocloud-frontend
npm run lint
npm run build
npm run test:e2e
```

## Criterios De Aceite

- `dotnet build OdontoCloud.slnx` passa.
- `dotnet test OdontoCloud.slnx` passa ou qualquer falha residual e claramente fora do escopo e documentada.
- Semana mostra 7 dias.
- E2E de agenda nao depende de clique ambiguo/slot ocupado.
- Nenhuma alteracao fora de Agenda/Agendamentos e docs, exceto correcao minima de build.

## Relatorio Obrigatorio

Ao final, escreva obrigatoriamente um relatorio em:

`D:\OdontoCloud\agent_reports\recepcionista_agenda.md`

Inclua:

- causa raiz;
- arquivos alterados;
- comandos rodados;
- resultado exato de cada comando;
- testes adicionados/alterados;
- pendencias;
- blockers;
- se houve mudancas fora do escopo.
