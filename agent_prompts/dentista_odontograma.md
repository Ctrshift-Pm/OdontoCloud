Use o modelo Codex 5.3 Spark (`gpt-5.3-codex-spark-preview`).
Nivel de pensamento: alto.

Trabalhe apenas em `D:\OdontoCloud`.
Nao altere arquivos fora do escopo.
Nao reverta mudancas de terceiros.
Nao use comandos destrutivos.
Se encontrar mudanca inesperada conflitante, pare e relate.

## Contexto

A documentacao principal define o odontograma como representacao visual interativa de todos os 32 dentes permanentes e 20 deciduos. Ao clicar em um dente, deve abrir edicao/historico. Nao ha regra documental para esconder denticao por idade; idade deve ser usada no maximo para priorizar/expandir a denticao mais provavel, mantendo as duas acessiveis por causa de denticao mista e excecoes clinicas.

Problemas relatados no smoke:

- SVG permanente esta pequeno demais.
- Busca/seleção de paciente nao funciona bem.
- Ao selecionar um novo estado antes de salvar, o SVG perde as cores/feedback visual.
- UX desejada: mini modal/popover ao clicar no dente, ancorado proximo ao ponto clicado, em vez de depender apenas do painel lateral.
- Denticao decidua esta visualmente boa; preserve.

## Leia Antes

- `docs/ODONTOCLOUD_CONTEXT.md`
- `docs/ROADMAP_BLOCOS.md`
- `docs/TEST_STRATEGY.md`
- `docs/PROGRESS.md`
- `docs/ODONTOGRAMA_SVG_MAP.md`
- `OdontoCloud_Documentacao_Completa.docx`
- `odontocloud-frontend/src/pages/Prontuario.jsx`
- `odontocloud-frontend/src/assets/odontograma/Dente_permanente.svg`
- `odontocloud-frontend/src/assets/odontograma/denticao_decidua.svg`
- `odontocloud-frontend/tests/e2e/prontuario.spec.js`
- `odontocloud-frontend/src/api/pacientes.js`

## Tarefas

1. Corrigir escala/layout do SVG permanente.
   - Deve ficar legivel e proporcional ao decíduo.
   - Nao distorcer.
   - Manter responsivo.

2. Corrigir busca/seleção de paciente.
   - Busca por nome, CPF e telefone deve filtrar claramente.
   - Se o select nativo for ruim para UX, criar lista de resultados clicaveis ou melhorar o fluxo sem quebrar acessibilidade.
   - Adicionar/ajustar E2E cobrindo busca.

3. Corrigir perda de cores ao alterar estado.
   - Mudar estado local antes de salvar nao pode apagar as cores do SVG.
   - Aplicar preview somente no dente selecionado.
   - Em erro de API, manter estado visual consistente.

4. Implementar mini modal/popover ao clicar no dente.
   - Abrir proximo ao ponto clicado.
   - Mostrar dente, estado atual, novo estado, salvar e cancelar.
   - Reaproveitar PATCH existente.
   - Manter painel lateral como resumo/fallback se ja existir.
   - Suportar teclado minimamente.

5. Usar idade/data de nascimento como preferencia visual, se o DTO de paciente ja expuser esse dado.
   - Adulto: permanente primeiro/expandido.
   - Crianca: decidua primeiro/expandida.
   - Nunca esconder a outra denticao.
   - Se `dataNascimento` nao existir no contrato atual, documentar limite e nao alterar backend nesta rodada.

6. Nao alterar backend, rotas, DTOs ou JSONB salvo se a data de nascimento ja existir e apenas nao estiver sendo usada.

7. Atualizar `docs/ODONTOGRAMA_SVG_MAP.md` se mexer em IDs/estrutura SVG.

8. Atualizar `docs/PROGRESS.md`.

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

- Permanente fica legivel e proporcional ao deciduo.
- Busca de paciente funciona no fluxo real.
- SVG nao perde cores ao trocar estado antes de salvar.
- Mini modal/popover permite alterar estado e persistir.
- E2E cobre busca + clique em permanente + clique em deciduo + persistencia.
- Nao ha alteracao de contrato backend.

## Relatorio Obrigatorio

Ao final, escreva obrigatoriamente um relatorio em:

`D:\OdontoCloud\agent_reports\dentista_odontograma.md`

Inclua:

- causa raiz;
- arquivos alterados;
- comandos rodados;
- resultado exato de cada comando;
- testes adicionados/alterados;
- pendencias;
- blockers;
- se houve mudancas fora do escopo.
