# AGENTS.md

Instruções para agentes de código neste repositório. Visão geral e estado do projeto: `README.md`.

ShirNote abre partituras do Encore (`.enc`) no navegador. O formato não tem especificação pública e
o projeto está na Fase 4 (G1 a G3 fechados em 02/11/2026; G4 em 27/11/2026; ver o cronograma). O parser de produto é `src/enc/parser.ts`;
`App.tsx` passa o arquivo por ele, gera o MusicXML e renderiza no OSMD, e abre com a partitura
sintética `simpleMelody`. O spike `scripts/enc-spike.mjs` é descartável; os testes usam o leitor de
MusicXML dele (`readReferenceXml`).

## Antes de concluir uma alteração

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm run format:check
```

O CI roda os quatro primeiros, mas não `format:check`. O aviso de chunk acima de 500 kB no build é
conhecido. Um teste só: `npx vitest run src/enc/container.test.ts`.

Node >= 22.12. Testes ficam junto do código (`src/**/*.test.{ts,tsx}`); fora desse padrão o Vitest
não os encontra.

## Arquitetura

`ArrayBuffer → src/enc → src/music → src/musicxml → OSMD`

Limites que nenhuma ferramenta verifica (o ESLint não restringe imports), então confira na revisão:

- `src/enc`, `src/music` e `src/musicxml` não importam React, `react-dom`, OSMD nem APIs de DOM
  (RNF-05, ADR 0001). Esse núcleo será reaproveitado no app React Native.
- `src/music` não conhece Encore nem MusicXML. `src/enc` e `src/musicxml` dependem de `src/music`,
  nunca um do outro.
- Só `src/components` junta as camadas e usa OSMD.
- Nada de upload ou chamada de rede com o arquivo do usuário (RNF-01).
- Arquivo inválido nunca derruba a interface: use `EncoreFormatError` e leve avisos do modo tolerante
  como `ParseWarning` (RNF-02, RF-11).

O parser deve implementar o contrato `EncoreParser` de `src/enc/types.ts`.

## Trabalhando no formato `.enc`

`docs/enc-format.md` é a fonte de verdade, e separa o que está **comprovado** do que é **hipótese**.
Mantenha essa separação:

- Um campo só vira comprovado com amostra que o demonstre. Registre offset, bytes e evidência.
- Só use no parser de produto campos comprovados. Do cabeçalho `SCOW`, só os marcados como
  comprovados na seção 4; `0x04` serve apenas para recusar versão diferente de `0xC4` (ADR 0002).
- O Enc2MusicXML (GPL-3.0) é só pista para hipóteses: não copie nem traduza código dele.
- Prefira `tests/fixtures/reference/*.xml` como gabarito e amostras controladas para isolar um
  campo. Comprove com `node scripts/enc-spike.mjs <arquivo> --check <referencia>`.

Armadilhas já medidas:

- `MEAS` é um cabeçalho de 54 bytes seguido da lista de eventos, e o tamanho declarado conta só a
  lista. Em `src/enc/container.ts`, esses 54 bytes ainda se chamam “trailer”.
- O valor 54 está duplicado em `src/enc/container.ts` e nos scripts `enc-dump`, `enc-diff` e
  `enc-spike`. Mude todos juntos.
- Percorra os eventos pelo tamanho (`+3`) até o tick `FFFF`. Procurar `50 40` gera falsos positivos.
- A duração da nota é a tocada (nominal × fator por arquivo). A figura vem de `+5`, e a posição, do
  tick.
- `y` tem sinal e depende da clave: `y = 0` só é C4 na clave de sol.
- O cabeçalho de `MEAS` traz lixo de memória em `+38` a `+53`, inclusive fragmentos de caminhos
  locais. Nunca exiba esses bytes e ignore-os no `enc-diff`.

## Fixtures

- `samples/` guarda cópias com nome ASCII dos originais em `docs/amostra/`.
- `controlled/` usa nomes `controle-NN-descricao.enc`. Todo arquivo novo ali entra no teste da cadeia
  de blocos sozinho.
- Os arquivos de `docs/amostra/Experimento/` não seguem a numeração `controle-NN`; o mapeamento das
  cópias usadas está em `tests/fixtures/controlled/README.md`.
- Não versione obra de terceiros sem direito de uso confirmado. Pergunte antes de adicionar amostra
  real.
- Script e diagnóstico podem usar `reference/`; o parser de produto não.

## Convenções

- Código em inglês; comentários, documentação e textos da interface em pt-BR (RNF-08).
- Commits no padrão Conventional Commits, com a descrição em pt-BR: `feat(enc): ...`.
- TypeScript estrito com `noUncheckedIndexedAccess`: trate `undefined` ao indexar bytes e arrays.
- Prettier: aspas simples, 100 colunas. A pasta `docs/` fica fora do Prettier, mas `README.md`,
  `AGENTS.md` e `tests/fixtures/**/README.md` não.
- Requisitos são citados por ID (`RF-03`, `RNF-05`) em comentários e documentos.
- Escopo do MVP: não adicione áudio, edição, exportação nem layout fiel ao Encore (PRD, seção 2).

## Decisões

Mudança de estrutura, atributo de qualidade ou comportamento vai para um ADR em `docs/decisions/`
(MADR em pt-BR, título no infinitivo). ADR aceito não é editado: escreva outro e marque o anterior
como `Superseded by ADR-NNNN`. Atualize o índice em `docs/decisions/README.md`.

Ao concluir um portão ou mudar o que está comprovado, atualize `docs/enc-format.md` (seção 11) e a
tabela de estado do `README.md`.
