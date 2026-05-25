# Mapa de Normalização de IDs do Odontograma SVG (Bloco 3)

## Objetivo

Registrar o estado final da normalização dos SVGs de odontograma para a camada interativa FDI:
- manter contratos atuais do backend e formato `tooth -> { status, cariePercentual? }` de `PATCH /api/prontuario/{id}/odontograma/{dente}`
- preparar fallback por grade FDI caso algum SVG não carregue ou falte ID em runtime

## Estratégia-alvo de normalização aplicada

- Normalizar para o padrão `id="tooth-XX"` sem alterar geometria visual.
- Duplicados por dente no decíduo foram mantidos com `id` não clicável.
- Mantido `HAS_STRUCTURED_SVG_IDS = true` no frontend com validação de IDs; se faltar qualquer `tooth-XX` faltante em runtime, cai para fallback FDI.
- A visualização de dentição **Mista** passou a usar os SVGs existentes de permanente e decíduo em camadas:
  - sem necessidade de novo arquivo de merge;
  - renderização combinada controlada por `denticaoAtiva === 'Mista'`;
  - manutenção dos estados JSON por dente para ambas as dentições no mesmo prontuário.

## Normalização concluída por arquivo

### `odontocloud-frontend/src/assets/odontograma/Dente_permanente.svg`

Todos os 32 dentes permanentes já estão normalizados:

- `tooth-11, tooth-12, tooth-13, tooth-14, tooth-15, tooth-16, tooth-17, tooth-18`
- `tooth-21, tooth-22, tooth-23, tooth-24, tooth-25, tooth-26, tooth-27, tooth-28`
- `tooth-31, tooth-32, tooth-33, tooth-34, tooth-35, tooth-36, tooth-37, tooth-38`
- `tooth-41, tooth-42, tooth-43, tooth-44, tooth-45, tooth-46, tooth-47, tooth-48`

### `odontocloud-frontend/src/assets/odontograma/denticao_decidua.svg`

Todos os 20 dentes decíduos já estão normalizados:

- `tooth-51, tooth-52, tooth-53, tooth-54, tooth-55`
- `tooth-61, tooth-62, tooth-63, tooth-64, tooth-65`
- `tooth-81, tooth-82, tooth-83, tooth-84, tooth-85`
- `tooth-71, tooth-72, tooth-73, tooth-74, tooth-75`

### Duplicados no decíduo e resolução

No `denticao_decidua.svg`, parte dos elementos vinha com IDs duplicados (`_55_*` + `55_*` etc). A solução foi:

- Manter **exatamente** um clicável por dente:
  - `id="tooth-XX"`
- Renomear os duplicados para não-clicáveis:
  - `id="legacy-_55_..."`
  - ... até `legacy-_75_...` (e equivalentes para todos os 20 decíduos)

## Cobertura total (confirmada)

- Permanente: **32** IDs normalizadas, sem faltantes.
- Decíduo: **20** IDs normalizadas, sem faltantes.
- Nenhum `id="tooth-XX"` duplicado após normalização.

## Estado rico por dente (cárie parcial)

- O frontend já renderiza `cariePercentual` no JSON vindo do backend, aceitando tanto legacy (`"18": "ok"`) quanto objeto (`"18": {"status":"carie","cariePercentual":50}`).
- A visualização de preview parcial para `carie` usa gradiente:
  - permanentes: preenchimento vermelho vai da base do dente até o percentual informado.
  - decíduos: escolha consistente de preenchimento do topo até o percentual informado.
- Cores de legenda no frontend foram alinhadas para distinguir prótese de extração:
  - `ext` (extração): destaque rosado (`rose`);
  - `protese`: tom neutro (`stone`) para não conflitar com fluxo de urgência/extrração.

## Como validar

- Regex aplicada no markup:
  - `id="tooth-(\\d{2})"` deve cobrir todos os códigos abaixo.
- `OdontogramaPainel` só renderiza SVG interativo quando `ODO_GRAPHS_WITH_VALID_IDS` não tem `missingToothCodes`; caso contrário, usa a grade FDI.

## Validação determinística para dentição mista (muito importante)

- Para `denticao_mista.svg` também foi adicionada validação local em runtime com:
  - total de códigos detectados,
  - verificação de códigos faltantes em relação a `DENTES_POR_DENTICAO.mista`,
  - detecção de IDs duplicados no parser.
- O frontend mantém:
  - extração de símbolos por `id="tooth-XX"` (`getMixedToothSymbols`) com fallback regex + DOM,
  - `data-symbol-ok` por slot para auditoria visual no e2e,
  - estado textual de fallback nos slots cujo símbolo não foi encontrado para evitar overflow de renderização com fonte quebrada.
