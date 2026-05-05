# Rodada 01 - Agentes Manuais no Cursor

## Nomes dos Agentes

- Recepcionista: Agenda Frontend.
- Dentista: Prontuario/Odontograma Frontend.
- Financeiro: Financeiro Backend e API.
- Arquiteto de Seguranca: Seguranca/Auth/Arquitetura.

## Como Usar

Abrir um chat separado no Cursor para cada agente. Todos devem usar o modelo GPT 5.3 Spark.

Recomendacao de nivel de pensamento:

- Agentes de implementacao frontend: `medium`.
- Agente backend financeiro: `high`.
- Agente seguranca/auth: `high`.

Evitar mais de 4 agentes ao mesmo tempo. Mais agentes aumentam conflito de arquivos e duplicacao de decisoes.

## Ordem Recomendada

1. Rodar Agente 1, Agente 3 e Agente 4 em paralelo.
2. Rodar Agente 2 em paralelo apenas se aceitar mais risco de conflito em rotas/layout.
3. Ao final, coletar de cada agente: resumo, arquivos alterados, comandos rodados e pendencias.
4. Trazer os resultados para revisao e integracao.

## Regras Para Todos os Agentes

- Workspace: `D:\OdontoCloud`.
- Documentacao principal local: `D:\OdontoCloud\OdontoCloud_Documentacao_Completa.docx`.
- Antes de alterar, ler os arquivos relacionados.
- Nao reverter alteracoes de outros agentes.
- Nao fazer `git reset`, `git checkout --` ou operacoes destrutivas.
- Manter escopo pequeno e aderente ao prompt.
- Usar padroes locais do codigo.
- Quando tocar frontend, priorizar Tailwind e componentes existentes.
- Quando tocar backend, preservar multi-tenancy.
- Rodar verificacao relevante ao final.
- Atualizar `docs/PROGRESS.md` com o proprio progresso.

## Recepcionista - Agenda Frontend

Modelo: GPT 5.3 Spark

Nivel de pensamento: `medium`

Prompt para colar no Cursor:

```text
Voce esta no workspace D:\OdontoCloud. Trabalhe apenas no frontend React em odontocloud-frontend/src, principalmente nos arquivos da Agenda.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- odontocloud-frontend/src/pages/Agenda.jsx
- odontocloud-frontend/src/components/agenda/AgendaBoard.jsx
- odontocloud-frontend/src/components/agenda/AgendaEvent.jsx
- odontocloud-frontend/src/components/agenda/ModalAgendamento.jsx
- odontocloud-frontend/src/components/agenda/agendaUtils.js
- odontocloud-frontend/src/api/agenda.js

Contexto: OdontoCloud e um ERP odontologico multi-tenant. A Agenda precisa ser operacional, estilo Google Calendar, com modos dia/semana/mes, filtro por dentista, criacao ao clicar em slot, edicao ao clicar no card e coexistencia visual entre cor do dentista e status.

Tarefa:
1. Revisar a implementacao atual de Agenda.jsx, AgendaBoard.jsx, AgendaEvent.jsx, ModalAgendamento.jsx e agendaUtils.js.
2. Corrigir bugs de UX e layout que impedem uso fluido.
3. Garantir que cards exibam:
   - cor do dentista como borda esquerda espessa;
   - status como badge ou fundo suave;
   - nome do paciente, procedimento, horario e status legiveis.
4. Garantir que Cancelado seja ocultado da grade visual, mas continue possivel via status no modal.
5. Garantir que Excluir use DELETE real apenas por botao de lixeira no modal.
6. Nao mexer no backend.
7. Nao criar CSS customizado novo salvo se ja for padrao local; priorize Tailwind/utilitarios existentes.
8. Rodar npm build ou npm lint se possivel.
9. Atualizar docs/PROGRESS.md com seu progresso, arquivos alterados, comandos e pendencias.

Entregue:
- Arquivos alterados.
- Resumo objetivo do que mudou.
- Comandos rodados e resultado.
- Riscos ou pendencias.
```

## Dentista - Odontograma Frontend

Modelo: GPT 5.3 Spark

Nivel de pensamento: `medium`

Prompt para colar no Cursor:

```text
Voce esta no workspace D:\OdontoCloud. Trabalhe no frontend React em odontocloud-frontend/src para criar a base do modulo Prontuario/Odontograma.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- odontocloud-frontend/src/routes/index.jsx
- odontocloud-frontend/src/components/AppShell.jsx
- odontocloud-frontend/src/api/client.js
- src/OdontoCloud.Api/Controllers/ProntuarioController.cs
- src/OdontoCloud.Application/UseCases/Prontuario

Contexto: Existem SVGs externos em:
C:\Users\pmgam\Desktop\coisas-projeto-marcos\Dente_permanente.svg
C:\Users\pmgam\Desktop\coisas-projeto-marcos\denticao_decidua.svg

O backend ja tem endpoints de prontuario:
GET /api/prontuario/{pacienteId}
PATCH /api/prontuario/{id}/odontograma/{dente}
PATCH /api/prontuario/{id}/anamnese

Tarefa:
1. Criar uma tela real para /prontuario substituindo o ModulePlaceholder.
2. Implementar uma primeira versao funcional do odontograma visual.
3. Permitir selecionar paciente, carregar prontuario e exibir estados dos dentes.
4. Permitir clicar em um dente e alterar status usando a API.
5. Usar os estados documentados: saudavel/ok, tratado, carie, extracao indicada, ausente, implante, protese, respeitando os nomes aceitos pelo backend se forem diferentes.
6. Se os SVGs forem dificeis de integrar diretamente, implemente uma grade odontologica funcional por codigos FDI como fallback, mas deixe a estrutura preparada para substituir por SVG.
7. Nao mexer no backend nesta tarefa.
8. Rodar npm build ou npm lint se possivel.
9. Atualizar docs/PROGRESS.md com seu progresso, arquivos alterados, comandos e pendencias.

Entregue:
- Arquivos criados/alterados.
- Como acessar/testar.
- Pontos onde o backend limita a UI.
- Comandos rodados e resultado.
```

## Financeiro - Financeiro Backend e API

Modelo: GPT 5.3 Spark

Nivel de pensamento: `high`

Prompt para colar no Cursor:

```text
Voce esta no workspace D:\OdontoCloud. Trabalhe apenas no backend .NET em src e testes quando necessario.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- src/OdontoCloud.Api/Controllers/FinanceiroController.cs
- src/OdontoCloud.Api/Controllers/FinanceiroPagarController.cs
- src/OdontoCloud.Application/UseCases/Financeiro
- src/OdontoCloud.Application/UseCases/FinanceiroPagar
- src/OdontoCloud.Infrastructure/Data
- src/OdontoCloud.Domain/Entities/ContaReceber.cs
- src/OdontoCloud.Domain/Entities/ContaPagar.cs
- src/OdontoCloud.Domain/Entities/ItemPlanoTratamento.cs
- src/OdontoCloud.Domain/Entities/Dentista.cs

Contexto: O Financeiro ja possui ContasReceber, ContasPagar, comissoes por JSONB e fluxo de baixa. A documentacao preve relatorios, estados e endpoints uteis para tela financeira. O frontend ainda e placeholder.

Tarefa:
1. Revisar o backend financeiro atual.
2. Identificar lacunas objetivas frente a documentacao.
3. Implementar apenas melhorias pequenas e seguras que desbloqueiem o frontend financeiro MVP:
   - endpoint para listar contas a pagar pendentes/atrasadas;
   - endpoint para listar contas a receber por periodo/status, se ainda nao existir;
   - DTOs adequados;
   - validacoes necessarias.
4. Preservar multi-tenancy via TenantService/EF query filters.
5. Nao alterar contratos existentes sem necessidade.
6. Adicionar testes se tocar regra de negocio.
7. Rodar dotnet test OdontoCloud.slnx.
8. Atualizar docs/PROGRESS.md com seu progresso, arquivos alterados, comandos e pendencias.

Entregue:
- Arquivos alterados.
- Novos endpoints e contratos.
- Resultado dos testes.
- Qualquer decisao tomada.
```

## Arquiteto de Seguranca - Seguranca/Auth/Arquitetura

Modelo: GPT 5.3 Spark

Nivel de pensamento: `high`

Prompt para colar no Cursor:

```text
Voce esta no workspace D:\OdontoCloud. Faca uma revisao tecnica focada, com mudancas pequenas e seguras, no backend .NET.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/AGENTS_ROUND_01.md
- src/OdontoCloud.Api/Program.cs
- src/OdontoCloud.Api/appsettings.json
- src/OdontoCloud.Infrastructure/Identity/TenantService.cs
- src/OdontoCloud.Infrastructure/Identity/TokenService.cs
- src/OdontoCloud.Infrastructure/Identity/UsuarioAuthenticationRepository.cs
- src/OdontoCloud.Application/UseCases/Auth/Login
- src/OdontoCloud.Domain/Entities/Usuario.cs
- src/OdontoCloud.Domain/Permissions

Contexto: O projeto e multi-tenant. O ClinicaId deve vir do JWT e nunca do frontend. Hoje ha seed admin e login JWT. A documentacao exige seguranca LGPD, auditoria, 2FA futuro, criptografia e perfis.

Tarefa:
1. Revisar Auth, TokenService, TenantService, Program.cs, appsettings e entidades Usuario/Permissoes.
2. Identificar riscos criticos atuais, especialmente:
   - senha em texto puro;
   - secret JWT em appsettings;
   - ausencia de autorizacao por perfil/permissao;
   - comportamento quando ClinicaId esta ausente/Guid.Empty;
   - exposicao de dados entre tenants.
3. Implementar apenas correcoes pequenas e compativeis com o estado atual:
   - evitar operacao autenticada com ClinicaId vazio, se possivel;
   - melhorar tratamento de configuracao sensivel sem quebrar ambiente local;
   - preparar caminho para hash de senha sem quebrar seed atual, se viavel.
4. Nao reescrever o sistema de auth inteiro.
5. Adicionar testes unitarios quando tocar regra de dominio ou servico testavel.
6. Rodar dotnet test OdontoCloud.slnx.
7. Atualizar docs/PROGRESS.md com seu progresso, arquivos alterados, comandos e pendencias.

Entregue:
- Achados por severidade.
- Arquivos alterados.
- Resultado dos testes.
- Pendencias recomendadas para proxima sprint.
```
