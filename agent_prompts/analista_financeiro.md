Use o modelo Codex 5.3 Spark (`gpt-5.3-codex-spark-preview`).
Nivel de pensamento: alto.

Trabalhe apenas em `D:\OdontoCloud`.
Nao altere arquivos fora do escopo.
Nao reverta mudancas de terceiros.
Nao use comandos destrutivos.
Se encontrar mudanca inesperada conflitante, pare e relate.

## Contexto

A documentacao principal define financeiro com contas a receber, contas a pagar, comissao automatica e fluxo de caixa. Hoje contas a receber possui modal de baixa, mas contas a pagar usa acao direta `Dar baixa`. Para operacao real, baixa de conta a pagar tambem deve ter confirmacao/modal. Apos pagar, a conta deve virar `Pago` e sair da lista de pendentes/atrasadas.

## Leia Antes

- `docs/ODONTOCLOUD_CONTEXT.md`
- `docs/ROADMAP_BLOCOS.md`
- `docs/TEST_STRATEGY.md`
- `docs/PROGRESS.md`
- `OdontoCloud_Documentacao_Completa.docx`
- `odontocloud-frontend/src/pages/Financeiro.jsx`
- `odontocloud-frontend/src/api/financeiro.js`
- `odontocloud-frontend/tests/e2e/financeiro.spec.js`
- `src/OdontoCloud.Api/Controllers/FinanceiroPagarController.cs`
- `src/OdontoCloud.Application/UseCases/FinanceiroPagar`
- `tests/OdontoCloud.Api.IntegrationTests/FinanceiroApiIntegrationTests.cs`

## Tarefas

1. Criar modal de baixa/confirmacao para Conta a Pagar.
   - Mostrar fornecedor, descricao, vencimento, valor e status atual.
   - Confirmar chama `PATCH /api/financeiro/contas-pagar/{id}/pagar`.
   - Erro aparece no modal sem fechar.
   - Sucesso fecha modal, mostra mensagem e recarrega contas a pagar.

2. Garantir comportamento apos pagar.
   - Item some da lista de pendentes/atrasadas.
   - Mensagem: `Conta a pagar liquidada com sucesso.`
   - Se o backend retornar DTO com `Pago`, use para feedback se fizer sentido, mas lista final deve refletir o endpoint de pendentes.

3. Adicionar/ajustar E2E.
   - Criar/semear uma conta a pagar pendente via API ou helper existente.
   - Abrir Financeiro.
   - Abrir modal de conta a pagar.
   - Confirmar pagamento.
   - Validar mensagem de sucesso.
   - Validar que a conta nao aparece mais em pendentes.

4. Se faltar endpoint pequeno para seed de conta a pagar em E2E, investigar antes.
   - Se implementar contrato novo, adicionar teste de integracao e documentar.
   - Nao criar DRE, relatorios amplos ou dashboard.

5. Nao mexer em Agenda ou Prontuario.

6. Atualizar `docs/PROGRESS.md`.

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

- Conta a pagar usa modal de confirmacao, nao baixa direta sem contexto.
- Erros ficam no modal.
- Sucesso remove item da lista pendente.
- E2E cobre baixa real de conta a pagar.
- Nenhum relatorio amplo/DRE criado.

## Relatorio Obrigatorio

Ao final, escreva obrigatoriamente um relatorio em:

`D:\OdontoCloud\agent_reports\analista_financeiro.md`

Inclua:

- causa raiz;
- arquivos alterados;
- comandos rodados;
- resultado exato de cada comando;
- testes adicionados/alterados;
- pendencias;
- blockers;
- se houve mudancas fora do escopo.
