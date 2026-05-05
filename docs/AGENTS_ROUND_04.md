# Rodada 04 - Dentista e Financeiro

Rodada focada para avancar os proximos incrementos dos blocos ja iniciados:

- Bloco 3: Prontuario/Odontograma com denticao decidua e base para SVG.
- Bloco 4: Financeiro com UI MVP.

Todos usam GPT 5.3 Spark.

## Premissas

- Workspace: `D:\OdontoCloud`.
- Docker esta disponivel.
- PostgreSQL local: `docker compose up -d postgres`.
- API local, quando necessaria: `dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http`.
- Frontend local, quando necessario: `cd odontocloud-frontend && npm run dev`.
- Documento principal: `OdontoCloud_Documentacao_Completa.docx`.
- Roadmap principal: `docs/ROADMAP_BLOCOS.md`.

## Prompt - Dentista

```text
Nome do agente: Dentista
Modelo: GPT 5.3 Spark
Nivel de pensamento: Alto

Voce esta no workspace D:\OdontoCloud. Seu escopo e Bloco 3 do roadmap: Prontuario/Odontograma.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/ROADMAP_BLOCOS.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- Dente_permanente.svg, se existir no workspace ou no caminho documentado
- denticao_decidua.svg, se existir no workspace ou no caminho documentado
- src/OdontoCloud.Domain/Enums/StatusDenteOdontograma.cs
- src/OdontoCloud.Application/UseCases/Prontuario
- src/OdontoCloud.Api/Controllers/ProntuarioController.cs
- odontocloud-frontend/src/pages/Prontuario.jsx
- odontocloud-frontend/src/api/prontuario.js
- odontocloud-frontend/tests/e2e/prontuario.spec.js
- tests/OdontoCloud.Api.IntegrationTests/ProntuarioApiIntegrationTests.cs
- tests/OdontoCloud.Infrastructure.Tests/Prontuario/UpdateOdontogramaValidatorTests.cs

Objetivo:
Avancar o odontograma para suportar denticao decidua sem quebrar dentes permanentes, preparando a UI para futura troca por SVG interativo.

Tarefa:
1. Investigar como o backend valida dentes hoje (`OdontogramaHelper` ou equivalente) e como o JSON do odontograma e montado.
2. Adicionar suporte controlado a denticao decidua:
   - dentes FDI deciduos esperados: 55-51, 61-65, 85-81, 71-75;
   - manter suporte atual a permanentes: 18-11, 21-28, 48-41, 31-38;
   - nao alterar rotas nem shape dos DTOs se nao for necessario.
3. Atualizar frontend de Prontuario para exibir permanentes e deciduos de forma clara:
   - usar Tailwind;
   - manter acessibilidade por role/nome do botao;
   - se SVG ainda for grande demais, criar uma camada/componentizacao que permita trocar a grade por SVG depois sem reescrever estado/API.
4. Se os SVGs estiverem acessiveis e forem simples de integrar com seguranca, pode usar como base visual; se isso gerar risco alto, mantenha grade aprimorada e documente a pendencia.
5. Adicionar/ajustar testes:
   - unitarios/validator: aceitar dente deciduo valido e recusar invalido;
   - integracao API: GET retorna mapa com deciduos ou PATCH cria/persiste deciduo conforme decisao de contrato;
   - Playwright: selecionar paciente, alterar um dente deciduo para `protese` ou outro status aceito e validar feedback/estado.
6. Nao mexer em Financeiro, Agenda, Auth ou Layout global salvo necessidade minima e documentada.
7. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados, contratos e pendencias.

Comandos obrigatorios:
- docker compose up -d postgres
- dotnet build OdontoCloud.slnx
- dotnet test OdontoCloud.slnx
- cd odontocloud-frontend
- npm run lint
- npm run build
- npm run test:e2e

Entregue:
- Arquivos alterados.
- Contratos alterados ou confirmacao de que rotas/DTOs nao mudaram.
- Decisao tomada sobre SVG nesta rodada.
- Testes criados/alterados.
- Resultado dos comandos.
- Pendencias objetivas do Bloco 3.
```

## Prompt - Financeiro

```text
Nome do agente: Financeiro
Modelo: GPT 5.3 Spark
Nivel de pensamento: Alto

Voce esta no workspace D:\OdontoCloud. Seu escopo e Bloco 4 do roadmap: Financeiro.

Antes de alterar, leia:
- docs/ODONTOCLOUD_CONTEXT.md
- docs/ROADMAP_BLOCOS.md
- docs/TEST_STRATEGY.md
- docs/PROGRESS.md
- OdontoCloud_Documentacao_Completa.docx
- src/OdontoCloud.Api/Controllers/FinanceiroController.cs
- src/OdontoCloud.Api/Controllers/FinanceiroPagarController.cs
- src/OdontoCloud.Application/UseCases/Financeiro
- src/OdontoCloud.Application/UseCases/FinanceiroPagar
- tests/OdontoCloud.Api.IntegrationTests/FinanceiroApiIntegrationTests.cs
- odontocloud-frontend/src/routes/index.jsx
- odontocloud-frontend/src/components/AppShell.jsx
- odontocloud-frontend/src/pages
- odontocloud-frontend/src/api
- odontocloud-frontend/tests/e2e

Objetivo:
Substituir o placeholder de Financeiro por uma UI MVP real, usando os endpoints existentes, sem abrir DRE/dashboard/relatorios grandes nesta rodada.

Tarefa:
1. Mapear endpoints financeiros disponiveis:
   - `GET /api/financeiro/receber`
   - `PATCH /api/financeiro/receber/{id}`
   - `GET /api/financeiro/pendentes`
   - `GET /api/financeiro/contas-pagar/pendentes`
   - endpoints de contas a pagar existentes, se houver.
2. Criar camada frontend `src/api/financeiro.js` ou ajustar a existente, seguindo padrao de Axios atual.
3. Criar tela real `Financeiro.jsx` ou evoluir a rota existente:
   - cards de resumo simples: total a receber, total a pagar, vencidos/pendentes;
   - lista de contas a receber com filtro por periodo/status;
   - lista de contas a pagar pendentes/atrasadas;
   - acao de baixa de recebivel via modal/formulario simples, se o endpoint estiver pronto;
   - erros 400 devem aparecer na UI sem fechar modal;
   - nao enviar `ClinicaId` pelo frontend.
4. Preservar o AppShell/sidebar atual.
5. Nao criar DRE, fluxo de caixa completo, relatorios complexos ou graficos nesta rodada.
6. Adicionar/ajustar testes:
   - frontend lint/build obrigatorios;
   - Playwright financeiro se houver fluxo minimo viavel com seed/dados criados por API;
   - se precisar de pequeno ajuste backend para suportar a UI, adicionar teste de integracao correspondente.
7. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados, contratos e pendencias.

Comandos obrigatorios:
- docker compose up -d postgres
- dotnet build OdontoCloud.slnx
- dotnet test OdontoCloud.slnx
- cd odontocloud-frontend
- npm run lint
- npm run build
- npm run test:e2e

Entregue:
- Arquivos alterados.
- Endpoints consumidos e contratos novos, se houver.
- Testes criados/alterados.
- Resultado dos comandos.
- Pendencias objetivas do Bloco 4.
```

## Execucao Recomendada

Enviar `Dentista` e `Financeiro` ao mesmo tempo.

Nao enviar `Recepcionista` nem `Arquiteto de Seguranca` nesta rodada, salvo se aparecer bloqueio direto em Agenda/Auth/permissao.

Observacao de conflito:

- Ambos podem tocar `docs/PROGRESS.md`; isso e aceitavel, mas se houver conflito manual, preservar as duas secoes.
- O `Financeiro` pode tocar rotas/sidebar; o `Dentista` nao deve tocar esses arquivos nesta rodada.
