# Rodada 03 - Dentista e Financeiro

Rodada focada para avancar dois blocos grandes sem perder a baseline verde:

- Bloco 3: Prontuario/Odontograma.
- Bloco 4: Financeiro.

Todos usam GPT 5.3 Spark.

## Premissas

- Workspace: `D:\OdontoCloud`.
- Docker esta disponivel.
- PostgreSQL local: `docker compose up -d postgres`.
- API local, quando necessaria: `dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http`.
- Frontend local, quando necessario: `cd odontocloud-frontend && npm run dev`.
- Documento principal: `OdontoCloud_Documentacao_Completa.docx`.

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
- odontocloud-frontend/src/pages/Prontuario.jsx
- odontocloud-frontend/src/api/prontuario.js
- odontocloud-frontend/tests/e2e/prontuario.spec.js
- src/OdontoCloud.Api/Controllers/ProntuarioController.cs
- src/OdontoCloud.Application/UseCases/Prontuario
- src/OdontoCloud.Domain

Tarefa:
1. Evoluir o Odontograma sem quebrar o MVP atual.
2. Investigar os contratos atuais de backend para dentes, estados e JSONB.
3. Implementar o menor incremento funcional que aproxime o produto do requisito documentado:
   - preferencia: adicionar suporte real ao estado `Protese` no backend/frontend se ainda faltar;
   - se isso ja existir, iniciar suporte controlado a denticao decidua;
   - se ambos forem grandes demais, preparar camada visual/estado para troca futura por SVG, sem alterar contratos instaveis.
4. Adicionar ou ajustar testes:
   - unitarios para regra de estado/transicao quando houver regra de dominio;
   - integracao API para GET/PATCH do prontuario, tenant e estado novo quando aplicavel;
   - Playwright para fluxo clinico atualizado.
5. Manter UI com Tailwind, sem CSS customizado novo desnecessario.
6. Nao mexer no financeiro, auth ou agenda.
7. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.
8. Se descobrir que a documentacao diverge do backend, registrar claramente a divergencia e a decisao tomada.

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
- Contratos alterados ou confirmacao de que nenhum contrato mudou.
- Testes criados/alterados.
- Resultado dos comandos.
- Pendencias do Bloco 3 no formato objetivo.
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
- src/OdontoCloud.Domain
- src/OdontoCloud.Infrastructure/Data
- tests/OdontoCloud.Api.IntegrationTests/FinanceiroApiIntegrationTests.cs

Tarefa:
1. Avancar o Financeiro sem abrir relatorios grandes ainda.
2. Revisar a regra critica: baixa de ContaReceber gera ContaPagar de comissao na mesma transacao.
3. Adicionar testes de integracao que provem:
   - baixa de conta a receber gera conta a pagar de comissao quando regra aplicavel;
   - falha na baixa nao deixa ContaPagar parcial;
   - faturamento misto entre dentistas permanece bloqueado;
   - isolamento multi-tenant em receber/pagar continua intacto.
4. Se faltar endpoint pequeno para suportar futura UI financeira MVP, implementar apenas se for consulta/acao essencial e documentar contrato.
5. Nao criar dashboard/DRE/relatorios amplos nesta rodada.
6. Nao mexer no frontend, exceto se criar um arquivo de anotacao muito pequeno for indispensavel. O foco e backend e testes.
7. Atualizar docs/PROGRESS.md com arquivos, comandos, resultados e pendencias.

Comandos obrigatorios:
- docker compose up -d postgres
- dotnet build OdontoCloud.slnx
- dotnet test OdontoCloud.slnx

Entregue:
- Arquivos alterados.
- Testes criados/alterados.
- Resultado dos comandos.
- Contratos novos, se houver.
- Riscos residuais do Bloco 4.
```

## Execucao Recomendada

Enviar `Dentista` e `Financeiro` ao mesmo tempo.

Nao enviar `Recepcionista` e `Arquiteto de Seguranca` nesta rodada, salvo se aparecer bloqueio direto em Agenda/Auth.
