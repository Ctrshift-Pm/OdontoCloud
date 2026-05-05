# Estrategia de Testes - OdontoCloud

## Objetivo

Todo trabalho dos agentes deve sair com verificacao proporcional ao risco. A ordem padrao e:

1. Testes unitarios para regra pura.
2. Testes de integracao para contratos API, EF Core, multi-tenancy e transacoes.
3. Playwright para fluxo critico de frontend.
4. Build/lint como barreira minima.

## Comandos Base

Backend:

```powershell
dotnet build OdontoCloud.slnx
dotnet test OdontoCloud.slnx
```

Frontend:

```powershell
cd odontocloud-frontend
npm run lint
npm run build
```

Banco local:

```powershell
docker compose up -d postgres
```

API local:

```powershell
dotnet run --project src/OdontoCloud.Api/OdontoCloud.Api.csproj --launch-profile http
```

Frontend local:

```powershell
cd odontocloud-frontend
npm run dev
```

## Unitarios

Usar para:

- Entidades de dominio.
- Validadores FluentValidation.
- Parsers e calculos financeiros.
- Servicos sem dependencia externa.
- Regras de permissao e senha.

Projetos atuais:

- `tests/OdontoCloud.Domain.Tests`
- `tests/OdontoCloud.Infrastructure.Tests`

## Integracao

Usar para:

- Controllers ou endpoints novos.
- Repositories EF Core.
- Query filters multi-tenant.
- Transacoes financeiras.
- Auth/JWT e fallback policy.

Preferencia:

- Criar projeto dedicado `tests/OdontoCloud.Api.IntegrationTests` quando a tarefa tocar API real.
- Usar banco PostgreSQL via Docker para evitar divergencia de comportamento com JSONB, datas e transacoes.

Cenarios minimos recomendados:

- Login com seed retorna JWT valido.
- Endpoint autenticado falha sem token.
- Endpoint autenticado falha com token sem `ClinicaId`.
- Paciente/agenda/financeiro nao vazam dados entre tenants.
- Baixa de conta a receber gera conta a pagar de comissao na mesma transacao.

## Playwright

Usar para:

- Login.
- Criar paciente.
- Criar/editar/cancelar/excluir agendamento.
- Fluxo prontuario: selecionar paciente, carregar odontograma, alterar dente.
- Financeiro: consultar contas a receber/pagar quando UI existir.

Se Playwright ainda nao estiver instalado no frontend, o agente responsavel deve propor ou adicionar de forma controlada:

```powershell
cd odontocloud-frontend
npm install -D @playwright/test
npx playwright install
```

Scripts sugeridos no `package.json`:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

## Regras de Qualidade

- Nenhum agente deve declarar tarefa concluida se `dotnet test`, `npm run lint` ou `npm run build` falhar no escopo tocado.
- Se um teste depender de Docker e Docker nao estiver disponivel, registrar como pendencia em `docs/PROGRESS.md`.
- Warnings podem ser aceitos temporariamente, mas precisam ser listados.
- Playwright deve preferir seletores por texto/role quando possivel.
- Teste e2e deve limpar ou isolar dados quando criar registros.
