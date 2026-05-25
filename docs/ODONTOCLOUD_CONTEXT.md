# OdontoCloud - Contexto Operacional

## Produto

OdontoCloud é um ERP/SaaS multi-tenant para clínicas odontológicas. O objetivo do produto é centralizar operação clínica, agenda, CRM, financeiro, prontuário eletrônico, odontograma, IA via WhatsApp e assinatura digital.

O `ClinicaId` e o limite de tenant devem vir do backend, extraidos do JWT. O frontend nao deve enviar `ClinicaId` em payloads operacionais.

## Stack Atual

- Backend: .NET 8, ASP.NET Core REST API, EF Core Code-First, PostgreSQL, MediatR, FluentValidation, JWT.
- Frontend: React, Vite, Tailwind CSS, Axios, React Router, React Hook Form.
- Banco local: PostgreSQL via `docker-compose.yml`.
- Solucao: `OdontoCloud.slnx`.

## Estado Atual do Codigo

- Auth esta funcional com JWT e persistencia no `localStorage`.
- Multi-tenancy usa `TenantEntityBase`, `TenantService` e query filters no `OdontoCloudDbContext`.
- Backend tem modulos de Pacientes, Agenda, Prontuario, PlanoTratamento, Financeiro, ContasPagar e Dentistas.
- Frontend tem telas reais de Login, Dashboard, Agenda, Pacientes/CRM, Prontuário, Financeiro, Perfil e Configurações.
- IA Atendimento e Assinatura Digital permanecem como placeholders com marcação "Em breve" e sem transações ativas.
- Testes atuais de dominio passam com `dotnet test OdontoCloud.slnx`.

## Documentacao Externa Lida

Arquivo principal:

- `D:\OdontoCloud\OdontoCloud_Documentacao_Completa.docx`
- `C:\Users\pmgam\Desktop\coisas-projeto-marcos\OdontoCloud_Documentacao_Completa.docx`

Usar a copia local em `D:\OdontoCloud` como referencia primaria quando estiver trabalhando no Cursor.

Arquivos de apoio:

- `Diagrama de caso de uso.pdf`
- `Diagramas ERP e UML.pdf`
- `diagrama-maquina-estados1.pdf`
- `diagrama-estados-fatura.pdf`
- `diagrama-estados-itemplanotratamento.pdf`
- `diagrama-contasapagar.pdf`
- `diagrama-finalizacao-financas.pdf`
- `diagrama-sequencia-anamnese.pdf`
- `diagrama-sequencia-fatura.pdf`
- `diagrama-sequencia-ia.pdf`
- `diagrama-sequencia-recepcionista.pdf`
- `Dente_permanente.svg`
- `denticao_decidua.svg`

## Requisitos de Produto Consolidados

### Dashboard

- Tela inicial com KPIs operacionais e financeiros.
- Consultas do dia, faturamento por dentista, leads da IA, procedimentos do mes e metricas de WhatsApp.
- Filtros por periodo, dentista e clinica nos planos aplicaveis.

### Agenda

- Visualizacoes de dia, semana e mes.
- Dentista tem cor propria persistente para agenda, legenda, relatorios e WhatsApp.
- Status previstos: Agendado, Confirmado, Pendente, Remarcado, Falta, Cancelado, Atendido.
- Cancelamento e mudanca de status e preserva historico.
- Exclusao real e apenas para corrigir erro operacional.
- Configuracao futura por dentista: dias de atendimento, horario inicial/final, slot padrao, almoco, bloqueios pontuais e limite diario.

### IA Atendimento (em breve)

- Fluxo em placeholder. A implementação ainda não está disponível para produção.
- Planejamento do escopo: atendimento via WhatsApp Business API com qualificação de urgência, histórico de contato e sugestão de slots.

### Financeiro

- Contas a Receber, Contas a Pagar, fluxo de caixa, DRE, inadimplencia e relatorios por dentista/procedimento/convenio.
- Comissao automatica por dentista pode ser percentual fixo, por categoria, valor fixo por procedimento ou mista.
- Baixa de ContaReceber deve gerar ContaPagar de comissao na mesma transacao quando aplicavel.
- Faturamento misto entre dentistas deve continuar bloqueado.

### CRM de Pacientes

- Cadastro amplo: dados pessoais, contato, endereco, convenio e origem.
- Historico unificado: agendamentos, atendimentos, cobrancas, documentos, conversas IA, anotacoes, exames.
- Retornos automaticos por procedimento.
- Campanhas WhatsApp segmentadas.

### Prontuario

- Abas: dados do paciente, anamnese, odontograma, historico, exames, plano de tratamento.
- Anamnese estruturada e versionada.
- Odontograma interativo com dentes permanentes e deciduos.
- Estados documentados: Saudavel, Tratado, Carie, Extracao indicada, Ausente, Implante, Protese.
- Plano de tratamento deve calcular total, pago e a receber.

### Assinatura Digital (em breve)

- Fluxo em placeholder. A implementação ainda não está disponível para produção.
- Entrega prevista com documentos enviados por WhatsApp, assinatura sem login e evidência no prontuário (timestamp, IP, hash SHA-256, CPF).

### Perfis

- Admin: todos os modulos.
- Gestor: Dashboard, Agenda, Financeiro, CRM, Relatorios; nao edita prontuario.
- Dentista: agenda própria, prontuário e gerenciamento clínico; a assinatura digital está em breve.
- Recepcionista: Agenda e Pacientes; IA Atendimento e Assinatura Digital estão em breve.
- Financeiro: Financeiro e Relatorios; sem acesso clinico.

## Diretrizes de Implementacao

- Seguir padroes existentes do repo.
- Evitar refactors amplos durante tarefas de modulo.
- Backend deve manter isolamento multi-tenant por query filters e `TenantService`.
- Frontend deve delegar filtros pesados para API.
- Estado de UI deve refletir sucesso real da API.
- Erros 400 devem aparecer no formulario sem fechar modal.
- Usar Tailwind e componentes locais antes de criar CSS novo.
- Mudar contratos existentes somente quando necessario e documentar.

## Riscos Tecnicos Atuais

- Usuarios legados podem existir com senha em texto puro ate passarem pelo fluxo de upgrade; o seed novo ja grava hash.
- `PlanoTratamento` exigia endurecimento de permissao por acao e deve continuar coberto por testes de autorizacao.
- JWT deve continuar vindo de variavel de ambiente ou secret fora de `Development`; placeholder no repo nao pode ser usado em producao.
- Claims obrigatorias do tenant/usuario agora precisam continuar validadas estritamente em qualquer fluxo autenticado.
- Documentacao de produto e maior que a implementacao atual, entao cada agente deve limitar escopo.
