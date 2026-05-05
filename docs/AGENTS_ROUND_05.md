# Rodada 05 - Odontograma SVG e Financeiro Operacional

Rodada focada em transformar os MVPs recentes em fluxos mais proximos de uso real:

- Bloco 3: odontograma com base visual SVG.
- Bloco 4: Financeiro com UX melhor e E2E de baixa real.

Todos usam GPT 5.3 Spark.

## Premissas

- Workspace: `D:\OdontoCloud`.
- Docker esta disponivel.
- API local esperada: `http://localhost:5189`.
- Frontend local esperado: `http://127.0.0.1:5173`.
- Documento principal: `OdontoCloud_Documentacao_Completa.docx`.
- Roadmap principal: `docs/ROADMAP_BLOCOS.md`.
- Baseline atual: Playwright possui 3 fluxos passando: Agenda, Prontuario e Financeiro.

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
- Dente_permanente.svg
- denticao_decidua.svg
- src/OdontoCloud.Application/UseCases/Prontuario/OdontogramaHelper.cs
- src/OdontoCloud.Domain/Enums/StatusDenteOdontograma.cs
- odontocloud-frontend/src/pages/Prontuario.jsx
- odontocloud-frontend/src/api/prontuario.js
- odontocloud-frontend/tests/e2e/prontuario.spec.js
- tests/OdontoCloud.Api.IntegrationTests/ProntuarioApiIntegrationTests.cs
- tests/OdontoCloud.Infrastructure.Tests/Prontuario/UpdateOdontogramaValidatorTests.cs

Objetivo:
Evoluir a UI do odontograma para usar uma camada visual preparada para SVG, sem quebrar os contratos atuais e sem perder acessibilidade/testabilidade.

Tarefa:
1. Localizar os SVGs `Dente_permanente.svg` e `denticao_decidua.svg`. Se estiverem fora do workspace, copiar para local apropriado do frontend, preferencialmente `odontocloud-frontend/src/assets/odontograma/` ou `public/odontograma/`, conforme padrao do Vite existente.
2. Avaliar a estrutura dos SVGs:
   - se cada dente tiver ids/classes utilizaveis, integrar clique/estado por dente diretamente;
   - se os SVGs forem pouco estruturados, criar componente intermediario que mantenha a grade FDI atual como fallback e deixe a integracao SVG documentada.
3. Refatorar `Prontuario.jsx` apenas o suficiente para separar:
   - estado e chamada API;
   - renderizacao do odontograma;
   - legenda/status;
   - painel de edicao do dente selecionado.
4. Manter suporte a permanentes e deciduos:
   - permanentes: 18-11, 21-28, 48-41, 31-38;
   - deciduos: 55-51, 61-65, 85-81, 71-75.
5. Preservar acessibilidade:
   - botoes/areas clicaveis devem ter nome acessivel como `Selecionar dente 55`;
   - Playwright deve continuar usando role/texto estavel.
6. Nao alterar rotas, DTOs ou enum, salvo bug impeditivo pequeno e documentado.
7. Atualizar ou adicionar testes:
   - Playwright deve continuar cobrindo alteracao de dente deciduo;
   - se a componentizacao criar utilitarios puros, adicionar testes unitarios quando fizer sentido;
   - manter testes de integracao existentes verdes.
8. Atualizar docs/PROGRESS.md com arquivos, decisao sobre SVG, comandos e pendencias.

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
- Onde os SVGs ficaram e como foram integrados ou por que ficaram como fallback.
- Contratos confirmados/alterados.
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
- odontocloud-frontend/src/pages/Financeiro.jsx
- odontocloud-frontend/src/api/financeiro.js
- odontocloud-frontend/tests/e2e/financeiro.spec.js
- odontocloud-frontend/src/api/pacientes.js
- tests/OdontoCloud.Api.IntegrationTests/FinanceiroApiIntegrationTests.cs
- src/OdontoCloud.Api/Controllers/FinanceiroController.cs
- src/OdontoCloud.Api/Controllers/FinanceiroPagarController.cs

Objetivo:
Refinar a tela Financeiro MVP para uso operacional e adicionar E2E de baixa real de conta a receber, sem abrir DRE/relatorios amplos.

Tarefa:
1. Revisar `Financeiro.jsx` para UX mobile e legibilidade:
   - evitar tabelas inutilizaveis em telas pequenas;
   - usar cards/lista responsiva quando necessario;
   - manter layout desktop eficiente.
2. Melhorar feedback de carregamento/erro por secao:
   - erro em contas a receber nao deve inutilizar contas a pagar se a outra chamada funcionou;
   - modal de baixa deve manter erro 400 sem fechar.
3. Criar ou ajustar seed via API no Playwright para garantir uma conta a receber baixavel:
   - preferencia: usar endpoints existentes para criar paciente/plano/faturamento se viavel;
   - se nao houver fluxo simples de criacao via API, documentar limite e manter E2E de leitura, mas antes investigar de fato.
4. Adicionar E2E financeiro para:
   - login;
   - abrir Financeiro;
   - encontrar uma conta a receber pendente criada/preparada para o teste;
   - abrir modal de baixa;
   - enviar valor/forma pagamento;
   - validar mensagem de sucesso e retirada/alteracao de status na UI.
5. Se for necessario pequeno ajuste backend para permitir seed/teste sem hack, implementar com teste de integracao. Nao criar relatorios amplos.
6. Nao mexer em Prontuario, Agenda, Auth ou Layout global salvo necessidade minima documentada.
7. Atualizar docs/PROGRESS.md com arquivos, endpoints usados, comandos e pendencias.

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
- Melhorias concretas de UX mobile/operacional.
- Como o E2E cria/encontra a conta a receber.
- Contratos novos, se houver.
- Testes criados/alterados.
- Resultado dos comandos.
- Pendencias objetivas do Bloco 4.
```

## Execucao Recomendada

Enviar `Dentista` e `Financeiro` ao mesmo tempo.

Nao enviar `Recepcionista` nem `Arquiteto de Seguranca` nesta rodada.

Observacao de conflito:

- `Dentista` nao deve tocar rotas/sidebar/layout global.
- `Financeiro` nao deve tocar Prontuario/Odontograma.
- Ambos podem tocar `docs/PROGRESS.md`; preservar as duas secoes se houver conflito manual.
