# AGENTS.md

Instruções para agentes de código neste repositório. Visão geral e estado do projeto: `README.md`.

ShirNote é um **app Android mobile-first** de biblioteca, leitura e edição simples de partituras. O
MVP web está concluído e o site continua como demonstração do núcleo. O produto atual é descrito no
[PRD do app móvel](docs/PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md); o PRD web fica como
registro do que já foi entregue. Qual documento vale para quê, e qual vence em conflito, está em
[`docs/README.md`](docs/README.md). O formato `.enc` não tem especificação pública. O parser de produto é
`src/enc/parser.ts`; no web, `App.tsx` passa o arquivo por ele, gera o MusicXML e renderiza no OSMD. No
móvel, o mesmo núcleo alimenta uma WebView com OSMD. O spike `scripts/enc-spike.mjs` é descartável; os
testes usam o leitor de MusicXML dele (`readReferenceXml`).

## Antes de concluir uma alteração

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm run format:check
```

O CI roda os quatro primeiros, mas não `format:check`. O aviso de chunk acima de 500 kB no build é
conhecido. Um teste só: `npx vitest run src/enc/container.test.ts`.

Node >= 22.12. Testes ficam junto do código (`src/**/*.test.{ts,tsx}`); fora desse padrão o Vitest
não os encontra.

## Arquitetura

Web: `ArrayBuffer → src/enc → src/music → src/musicxml → OSMD (React DOM)`.
Móvel: o mesmo núcleo alimenta uma WebView com OSMD; a biblioteca, a edição e a nuvem são React Native.

Limites que nenhuma ferramenta verifica (o ESLint não restringe imports), então confira na revisão:

- `src/enc`, `src/music` e `src/musicxml` não importam React, `react-dom`, React Native, OSMD nem APIs
  de DOM/plataforma (RNF-05, RNFM-05, ADR 0001, ADR 0005). Esse núcleo é compartilhado com o app
  móvel **sem cópia**.
- `src/music` não conhece Encore nem MusicXML. `src/enc` e `src/musicxml` dependem de `src/music`,
  nunca um do outro.
- Só `src/components` (web) e `apps/mobile/src/viewer` (móvel) juntam as camadas e usam OSMD.
- Nada de upload ou chamada de rede com o arquivo do usuário, exceto as saídas do RNFM-02: a
  biblioteca da conta do próprio usuário no backend do ShirNote (ADR 0010) e a nuvem pessoal que ele
  conectar (ADR 0008). Sem conta, nada sai do aparelho; a web sem login continua 100% local.
- Arquivo inválido nunca derruba a interface: use `EncoreFormatError` e leve avisos do modo tolerante
  como `ParseWarning` (RNF-02, RF-11, RFM-17).

O parser deve implementar o contrato `EncoreParser` de `src/enc/types.ts`.

## App móvel

Estrutura, banco, ponte da WebView, fluxos e o que já está implementado ficam no
[TECHSPEC do app móvel](docs/TECHSPEC%20—%20App%20Móvel%20ShirNote.md). Leia antes de mexer em
`apps/mobile` e atualize-o na mesma alteração que mudar o código. `apps/mobile/AGENTS.md` traz as
regras do Expo (versão do SDK, `npx expo install`, pasta `android/` gerada).

Regras do app móvel:

- O núcleo entra por import relativo; o Metro usa `watchFolders` na raiz e resolve os módulos do app
  antes dos da raiz. **Nunca copie** `src/enc`, `src/music` ou `src/musicxml` para dentro do app
  (ADR 0005).
- `npm run viewer:build` gera o HTML do visualizador antes de iniciar ou empacotar o app. O HTML não
  pode buscar nada na rede: o OSMD vai embutido.
- A ponte React Native ↔ WebView só transporta MusicXML, SVGs de página e eventos tipados. Nada de
  HTML arbitrário vindo do app.
- O limite do grátis (8 itens) e o direito Pro são regras de domínio, não `if` espalhado na tela
  (ADR 0006, ADR 0007).
- Em build de desenvolvimento, a pílula do plano na biblioteca alterna entre grátis e Pro para testar
  transposição e metadados. O build de produção ignora o atalho e mantém o grátis até a cobrança
  (Fase 10).
- Testes de domínio do app ficam em `apps/mobile/src/**/*.test.ts` e não importam React Native. O
  resto é teste de fumaça em aparelho/emulador antes de cada release (RNFM-06).

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
- O valor 54 está duplicado em `src/enc/parser.ts`, `src/enc/container.ts` e nos scripts `enc-dump`, `enc-diff` e
  `enc-spike`. Mude todos juntos.
- Percorra os eventos pelo tamanho (`+3`) até o tick `FFFF`. Procurar `50 40` gera falsos positivos.
- A duração da nota é a tocada (nominal × fator por arquivo). A figura vem de `+5`, e a posição, do
  tick.
- `y` tem sinal e depende da clave: `y = 0` só é C4 na clave de sol.
- O cabeçalho de `MEAS` traz lixo de memória em `+38` a `+53`, inclusive fragmentos de caminhos
  locais. Nunca exiba esses bytes e ignore-os no `enc-diff`.

## Fixtures

- `samples/` guarda cópias com nome ASCII dos originais em `tests/fixtures/originals/`.
- `controlled/` usa nomes `controle-NN-descricao.enc`. Todo arquivo novo ali entra no teste da cadeia
  de blocos sozinho.
- Os arquivos de `tests/fixtures/originals/Experimento/` não seguem a numeração `controle-NN`; o mapeamento das
  cópias usadas está em `tests/fixtures/controlled/README.md`.
- Não versione obra de terceiros sem direito de uso confirmado. Pergunte antes de adicionar amostra
  real.
- Script e diagnóstico podem usar `reference/`; o parser de produto não.

## Convenções

- Código em inglês; comentários, documentação e textos da interface em pt-BR (RNF-08).
- Commits no padrão Conventional Commits, com a descrição em pt-BR: `feat(enc): ...`.
- TypeScript estrito com `noUncheckedIndexedAccess`: trate `undefined` ao indexar bytes e arrays.
- Prettier: aspas simples, 100 colunas. As pastas `docs/` e `archive/` ficam fora do Prettier, mas `README.md`,
  `AGENTS.md` e `tests/fixtures/**/README.md` não.
- Requisitos são citados por ID (`RF-03`, `RNF-05`) em comentários e documentos.
- Escopo da v1 móvel: não adicione áudio, edição nota a nota, layout fiel ao Encore nem iOS (PRD
  móvel, seção 2). O editor completo é evolução futura, não v1.

## Decisões

Mudança de estrutura, atributo de qualidade ou comportamento vai para um ADR em `docs/decisions/`
(MADR em pt-BR, título no infinitivo). ADR aceito não é editado: escreva outro e marque o anterior
como `Superseded by ADR-NNNN`. Atualize o índice em `docs/decisions/README.md`.

Ao concluir um portão ou mudar o que está comprovado, atualize `docs/enc-format.md` (seção 11) e a
tabela de estado do `README.md`.
