# Rodada 02 - Agentes Manuais no Cursor

## Nomes dos Agentes

- Recepcionista: Agenda e testes Playwright de agenda.
- Dentista: Prontuario/Odontograma e testes Playwright de prontuario.
- Financeiro: Financeiro backend, integracao API e transacoes.
- Arquiteto de Seguranca: Seguranca/Auth, autorizacao e testes de integracao.

Todos usam GPT 5.3 Spark.

Niveis de pensamento:

- Recepcionista: `medium`
- Dentista: `medium`
- Financeiro: `high`
- Arquiteto de Seguranca: `high`

## Premissas

- Docker esta disponivel.
- Banco local sobe com `docker compose up -d postgres`.
- Documentacao principal local: `D:\OdontoCloud\OdontoCloud_Documentacao_Completa.docx`.
- Ler antes de alterar:
  - `docs/ODONTOCLOUD_CONTEXT.md`
  - `docs/AGENTS_ROUND_01.md`
  - `docs/TEST_STRATEGY.md`
  - `docs/PROGRESS.md`

## Rodada Recomendada

1. Financeiro e Arquiteto de Seguranca trabalham em paralelo no backend.
2. Recepcionista e Dentista trabalham em paralelo no frontend/testes e2e.
3. Evitar que Recepcionista e Dentista editem os mesmos arquivos de layout global ao mesmo tempo, exceto quando inevitavel.
4. Todos atualizam `docs/PROGRESS.md`.

## Prompt - Recepcionista

```text
Nome do agente: Recepcionista
Modelo: GPT 5.3 Spark
Nivel de pensamento: medium

Voce esta no workspace D:\OdontoCloud. Seu escopo e Agenda frontend e testes e2e da Agenda.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- docs/AGENTS_ROUND_02.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- odontocloud-frontend/src/pages/Agenda.jsx
- odontocloud-frontend/src/components/agenda
- odontocloud-frontend/src/api/agenda.js

Premissa: Docker esta disponivel. Pode assumir PostgreSQL via `docker compose up -d postgres`.

Tarefa:
1. Revisar a Agenda apos a rodada 01 e corrigir qualquer regressao evidente.
2. Garantir que `npm run lint` e `npm run build` passem.
3. Adicionar Playwright de forma controlada se ainda nao existir.
4. Criar testes Playwright para fluxo minimo:
   - login com seed;
   - abrir Agenda;
   - abrir modal por clique em slot;
   - criar agendamento;
   - editar status para Cancelado;
   - confirmar que o card cancelado sai da grade;
   - criar outro agendamento e excluir via lixeira, se a UI expuser o botao.
5. Nao mexer no backend.
6. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.

Comandos esperados:
- docker compose up -d postgres
- dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http
- cd odontocloud-frontend
- npm run lint
- npm run build
- npm run test:e2e

Entregue:
- Arquivos alterados.
- Testes criados.
- Resultado de lint/build/e2e.
- Pendencias, se houver.
```

## Prompt - Dentista

```text
Nome do agente: Dentista
Modelo: GPT 5.3 Spark
Nivel de pensamento: medium

Voce esta no workspace D:\OdontoCloud. Seu escopo e Prontuario/Odontograma frontend e testes e2e do Prontuario.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- docs/AGENTS_ROUND_02.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- odontocloud-frontend/src/pages/Prontuario.jsx
- odontocloud-frontend/src/api/prontuario.js
- odontocloud-frontend/src/routes/index.jsx
- src/OdontoCloud.Api/Controllers/ProntuarioController.cs
- src/OdontoCloud.Application/UseCases/Prontuario

Premissa: Docker esta disponivel. Pode assumir PostgreSQL via `docker compose up -d postgres`.

Tarefa:
1. Revisar a tela de Prontuario criada na rodada 01.
2. Corrigir problemas de UX, acessibilidade e lint sem alterar contratos backend.
3. Garantir que estados enviados ao backend sejam somente os aceitos pelo enum atual.
4. Adicionar Playwright de forma controlada se ainda nao existir.
5. Criar teste Playwright para fluxo minimo:
   - login com seed;
   - abrir Prontuario;
   - selecionar paciente seed ou criar paciente antes se necessario;
   - carregar odontograma;
   - selecionar dente;
   - alterar para um estado suportado;
   - validar feedback de sucesso ou estado atualizado.
6. Nao mexer no backend, exceto se encontrar bug impeditivo muito pequeno e documentar.
7. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.

Comandos esperados:
- docker compose up -d postgres
- dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http
- cd odontocloud-frontend
- npm run lint
- npm run build
- npm run test:e2e

Entregue:
- Arquivos alterados.
- Testes criados.
- Resultado de lint/build/e2e.
- Limitacoes atuais do backend para odontograma.
```

## Prompt - Financeiro

```text
Nome do agente: Financeiro
Modelo: GPT 5.3 Spark
Nivel de pensamento: high

Voce esta no workspace D:\OdontoCloud. Seu escopo e Financeiro backend, testes unitarios e testes de integracao API/EF.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- docs/AGENTS_ROUND_02.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- src/OdontoCloud.Api/Controllers/FinanceiroController.cs
- src/OdontoCloud.Api/Controllers/FinanceiroPagarController.cs
- src/OdontoCloud.Application/UseCases/Financeiro
- src/OdontoCloud.Application/UseCases/FinanceiroPagar
- src/OdontoCloud.Infrastructure/Data

Premissa: Docker esta disponivel. Use PostgreSQL via `docker compose up -d postgres` para testes de integracao quando necessario.

Tarefa:
1. Revisar os endpoints financeiros adicionados na rodada 01.
2. Criar ou ampliar testes de integracao que validem:
   - `GET /api/financeiro/receber` autenticado;
   - filtro por periodo/status;
   - `GET /api/financeiro/contas-pagar/pendentes` autenticado;
   - query filter multi-tenant;
   - nenhuma rota financeira funciona sem JWT.
3. Se ainda nao existir projeto de integracao API, criar `tests/OdontoCloud.Api.IntegrationTests` com configuracao minima e controlada.
4. Nao adicionar features grandes de relatorio nesta rodada.
5. Preservar contratos existentes.
6. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.

Comandos esperados:
- docker compose up -d postgres
- dotnet build OdontoCloud.slnx
- dotnet test OdontoCloud.slnx

Entregue:
- Arquivos alterados.
- Testes criados.
- Resultado de build/test.
- Observacoes sobre Docker/PostgreSQL.
```

## Prompt - Arquiteto de Seguranca

```text
Nome do agente: Arquiteto de Seguranca
Modelo: GPT 5.3 Spark
Nivel de pensamento: high

Voce esta no workspace D:\OdontoCloud. Seu escopo e Seguranca/Auth/Autorizacao e testes unitarios/integracao.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- docs/AGENTS_ROUND_02.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- src/OdontoCloud.Api/Program.cs
- src/OdontoCloud.Infrastructure/Identity
- src/OdontoCloud.Application/UseCases/Auth/Login
- src/OdontoCloud.Domain/Entities/Usuario.cs
- src/OdontoCloud.Domain/Permissions

Premissa: Docker esta disponivel. Use PostgreSQL via `docker compose up -d postgres` para testes de integracao quando necessario.

Tarefa:
1. Revisar as mudancas de seguranca da rodada 01.
2. Implementar o menor passo seguro para autorizacao por permissao, sem reescrever auth:
   - policy/handler para claim `permission`;
   - helper/attribute simples se fizer sentido no padrao atual;
   - aplicar em endpoints de maior risco: financeiro e prontuario, se viavel.
3. Criar testes unitarios para o handler/policy.
4. Criar ou ampliar testes de integracao para:
   - sem token retorna 401;
   - token sem ClinicaId valido retorna 403/401 conforme pipeline;
   - token sem permissao financeira nao acessa endpoints financeiros protegidos, se a policy for aplicada.
5. Manter compatibilidade com seed local.
6. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.

Comandos esperados:
- docker compose up -d postgres
- dotnet build OdontoCloud.slnx
- dotnet test OdontoCloud.slnx

Entregue:
- Arquivos alterados.
- Policies/claims criadas ou aplicadas.
- Testes criados.
- Resultado de build/test.
- Riscos residuais.
```
