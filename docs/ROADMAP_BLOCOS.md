# OdontoCloud - Roadmap por Blocos

Este documento guia a conclusao do produto bloco por bloco. A regra e simples: nao abrir varios modulos grandes ao mesmo tempo sem uma baseline verde de build, testes e documentacao.

## Baseline Atual

Status em 2026-05-04:

- Backend compila com `dotnet build OdontoCloud.slnx`.
- Suite .NET passa com `dotnet test OdontoCloud.slnx --no-restore`.
- Frontend passa em `npm run lint` e `npm run build`.
- Playwright cobre fluxos reais de Agenda e Prontuario contra API local e PostgreSQL Docker.
- Auth, tenant, permissoes, migracao de senha legado, Agenda MVP, Pacientes MVP, Prontuario/Odontograma MVP e Financeiro backend inicial ja existem.

## Regra de Qualidade por Bloco

Todo bloco concluido precisa registrar em `docs/PROGRESS.md`:

- Arquivos alterados.
- Contratos novos ou alterados.
- Comandos executados.
- Resultado de testes unitarios.
- Resultado de testes de integracao quando houver API/EF/transacao.
- Resultado de Playwright quando houver fluxo de UI.
- Pendencias reais, sem mascarar escopo incompleto.

Comandos base:

```powershell
docker compose up -d postgres
dotnet build OdontoCloud.slnx
dotnet test OdontoCloud.slnx
cd odontocloud-frontend
npm run lint
npm run build
npm run test:e2e
```

## Bloco 1 - Fundacao e Segurança

Objetivo: garantir que a base multi-tenant, auth, permissao e testes nao permitam vazamento entre clinicas.

Status: em andamento avancado.

Ja feito:

- JWT funcional.
- `ClinicaId` extraido do token no backend.
- Policies por claim `permission` para Financeiro e Prontuario.
- Migracao runtime de senha legado para hash.
- Testes unitarios e integracao para auth, tenant, permissao e login.

Pendencias:

- Auditoria/lote para mapear usuarios ainda com senha legado.
- Remover segredo JWT padrao de arquivos versionados em fluxo controlado.
- Expandir autorizacao por permissao para todos os endpoints sensiveis.
- Melhorar observabilidade de falhas de auth/autorizacao.

Criterio de pronto:

- Nenhum endpoint sensivel sem `[Authorize]` ou policy apropriada.
- Testes cobrindo 401 sem token, token sem tenant e token sem permissao.

## Bloco 2 - Agenda e Recepcao

Objetivo: tornar Agenda confiavel para uso diario da recepcao.

Status: MVP funcional.

Ja feito:

- Agenda em dia/semana/mes.
- Criacao, edicao, cancelamento por status e exclusao real.
- Cor do dentista coexistindo com status.
- Playwright cobrindo criacao, cancelamento visual e exclusao.

Pendencias:

- Configuracao dinamica de horarios por dentista.
- Bloqueios pontuais, almoco, dias de atendimento e slot padrao.
- Melhor tratamento de sobreposicao de eventos.
- Confirmar regra de semana com UX: 5 dias uteis ou 7 dias.

Criterio de pronto:

- Backend filtra por periodo e dentista.
- UI respeita agenda configurada por dentista.
- Playwright cobre criacao em horario valido, bloqueio de horario invalido e cancelamento.

## Bloco 3 - Prontuario e Odontograma

Objetivo: transformar o prontuario em area clinica utilizavel, com odontograma persistente e historico.

Status: MVP inicial.

Ja feito:

- Tela real de Prontuario substituindo placeholder.
- Selecao de paciente.
- Odontograma permanente em grade FDI.
- Atualizacao de estado de dente via API.
- Playwright cobrindo alteracao de dente.

Pendencias:

- Trocar grade MVP por SVG interativo usando `Dente_permanente.svg`.
- Suportar denticao decidua usando `denticao_decidua.svg`.
- Alinhar enum/backend com estado documentado `Protese`.
- Historico/auditoria de alteracoes por dente.
- Anamnese estruturada/versionada com UI.
- Plano de tratamento integrado ao prontuario.

Criterio de pronto:

- Odontograma permanente e deciduo funcionam com SVG.
- Estados documentados persistem corretamente em JSONB.
- Testes unitarios cobrem regra de transicao de estados.
- Testes de integracao cobrem GET/PATCH e tenant.
- Playwright cobre selecao de paciente, dente permanente e dente deciduo.

## Bloco 4 - Financeiro

Objetivo: fechar o ciclo financeiro operacional: receber, pagar, comissoes, fluxo de caixa e relatorios basicos.

Status: backend parcial funcional.

Ja feito:

- Contas a Receber e Contas a Pagar base.
- Comissoes automaticas por regra JSONB.
- Baixa de ContaReceber gera ContaPagar na mesma transacao.
- Bloqueio de faturamento misto entre dentistas.
- Endpoints de consulta para contas a receber e contas a pagar pendentes.
- Testes de integracao para endpoints financeiros e isolamento.

Pendencias:

- UI Financeiro real substituindo placeholder.
- Baixa/pagamento pela UI com erros detalhados.
- Fluxo de caixa por periodo.
- DRE simplificada.
- Relatorio por dentista/procedimento.
- Testes de integracao adicionais para transacao de comissao e rollback.
- Playwright financeiro quando a UI existir.

Criterio de pronto:

- Financeiro opera ponta a ponta por UI.
- Baixa de recebivel gera comissao corretamente.
- Falha transacional nao deixa dados parciais.
- Multi-tenant provado em testes.

## Bloco 5 - CRM de Pacientes

Objetivo: evoluir Pacientes de cadastro para CRM operacional.

Status: CRUD MVP.

Ja feito:

- Cadastro/listagem de pacientes.
- Validacao de CPF e unicidade.
- Modal de criacao conectado a API.
- Mascara de CPF/telefone.

Pendencias:

- Kanban de leads.
- Historico unificado do paciente.
- Origem/campanhas/convenio/endereco completos.
- Retornos automaticos por procedimento.
- Metricas de CRM no topo.

Criterio de pronto:

- Paciente tem visao 360 funcional.
- Kanban opera com estados persistidos.
- Playwright cobre cadastro, erro 400 e movimentacao de lead.

## Bloco 6 - Dashboard

Objetivo: dar visao executiva para clinica.

Status: placeholder/parcial.

Pendencias:

- KPIs do dia.
- Faturamento por dentista.
- Leads da IA.
- Procedimentos do mes.
- Inadimplencia e contas vencidas.
- Filtros por periodo/dentista.

Criterio de pronto:

- Endpoints agregados no backend, sem calculo pesado no frontend.
- UI responsiva com cards e graficos simples.
- Testes de integracao para agregacoes principais.

## Bloco 7 - IA Atendimento

Objetivo: estruturar atendimento via WhatsApp e funil de leads.

Status: placeholder.

Pendencias:

- Modelo de lead/conversa.
- Registro de mensagens.
- Status/urgencia/procedimento de interesse.
- Sugestao de slots integrada a agenda.
- Auditoria de acoes automaticas.

Criterio de pronto:

- Lead criado e atualizado por API.
- Conversa e historico persistidos por tenant.
- Testes de integracao cobrem fluxo de lead sem WhatsApp real inicialmente.

## Bloco 8 - Assinatura Digital

Objetivo: permitir documentos assinados pelo paciente e anexados ao prontuario.

Status: placeholder.

Pendencias:

- Geracao de documentos.
- Link publico seguro para assinatura.
- Registro de timestamp, IP, CPF e hash SHA-256.
- Associacao ao prontuario.

Criterio de pronto:

- Documento assinado gera evidencia verificavel.
- Link publico nao vaza dados entre tenants.
- Testes cobrem hash, expiracao e acesso indevido.

## Bloco 9 - Configuracoes e Administracao

Objetivo: permitir operacao real por clinica sem hardcode.

Status: parcial/placeholder.

Pendencias:

- Usuarios/perfis/permissoes.
- Configuracao de agenda por dentista.
- Regras de comissao por dentista.
- Dados da clinica.
- Preferencias de notificacao.

Criterio de pronto:

- Admin configura operacao sem alterar banco manualmente.
- Permissoes refletidas no token e nas policies.
- Testes cobrem alteracao e efeito das configuracoes.

## Ordem Recomendada de Execucao

1. Fechar Bloco 3: Prontuario/Odontograma SVG e estados.
2. Fechar Bloco 4: Financeiro UI minima e transacoes.
3. Fechar Bloco 2: Configuracao dinamica de agenda.
4. Expandir Bloco 5: CRM/Kanban.
5. Construir Bloco 6: Dashboard com dados reais.
6. Avancar Bloco 9: Configuracoes administrativas.
7. Implementar Bloco 7: IA Atendimento.
8. Implementar Bloco 8: Assinatura Digital.

## Politica de Paralelismo

- Pode rodar em paralelo quando os agentes mexem em modulos e arquivos distintos.
- Evitar dois agentes no mesmo arquivo de rota, layout global ou `PROGRESS.md` ao mesmo tempo sem coordenacao.
- A cada rodada paralela, executar uma validacao central sequencial antes da proxima rodada.
