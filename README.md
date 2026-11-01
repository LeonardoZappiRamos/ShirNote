# ShirNote

Visualizador web de partituras do Encore (`.enc`) que roda inteiramente no navegador: o arquivo é
lido como `ArrayBuffer`, convertido para um modelo musical neutro, exportado como MusicXML e
renderizado com [OpenSheetMusicDisplay](https://opensheetmusicdisplay.org/) (OSMD).

O produto e o planejamento estão em [`docs/`](docs/):

- [`docs/PRD — Visualizador Web de Partituras Encore (.enc).md`](<docs/PRD%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md>)
- [`docs/CRONOGRAMA — Visualizador Web de Partituras Encore (.enc).md`](<docs/CRONOGRAMA%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md>)

## Estado atual

Trilha paralela do cronograma (seção 7), executada antes do parser `.enc` existir:

| Item                                                                 | Estado                                             |
| -------------------------------------------------------------------- | -------------------------------------------------- |
| Scaffold Vite + React + TypeScript + Vitest + ESLint/Prettier + CI   | pronto                                             |
| Modelo musical neutro (`src/music`) com testes                       | pronto                                             |
| Gerador MusicXML `score-partwise` 4.0 (`src/musicxml`) com testes    | pronto                                             |
| Partitura sintética renderizada no OSMD (`src/components`)           | pronto                                             |
| Contrato do parser + diagnóstico hexadecimal de amostras (`src/enc`) | pronto                                             |
| Parser do formato Encore                                             | **pendente** — depende do portão G1                |
| Contêiner `.enc` documentado (`docs/enc-format.md` v0.1)             | parcial — 1 amostra, notas ainda não decodificadas |

O que já funciona no navegador: upload/arrastar de um `.enc` é lido localmente e tem o cabeçalho
exibido em hexadecimal; a partitura exibida é o exemplo sintético. Nenhum byte é enviado a servidor.

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # typecheck + build de produção
npm run test         # Vitest
npm run test:watch
npm run lint
npm run format       # Prettier
npm run typecheck
```

Node 22.12+ (testado com Node 24).

## Estrutura

```
src/
  enc/            contrato do parser Encore, erros tipados e inspeção hexadecimal
  music/          modelo musical neutro: tipos, matemática de durações, validação
  musicxml/       gerador MusicXML e serializador XML
  components/     App, FileUploader, StatusBar, ScoreViewer (React + OSMD)
  test-utils/     builders de partituras usados só nos testes
scripts/          ferramentas de engenharia reversa (enc-dump)
tests/fixtures/   amostras .enc reais e o catálogo da Fase 1
docs/             PRD, cronograma e enc-format.md
```

O fluxo é sempre `ArrayBuffer → src/enc → src/music → src/musicxml → OSMD`. Cada camada conhece só
a vizinha: o parser não importa MusicXML e o gerador não importa o parser (RNF-05).

## Decisões

- **React + Vite** em vez de TypeScript puro ou outro framework, porque o app mobile previsto será
  React Native e o time reaproveita o modelo de estado, os tipos e o conhecimento.
- **Modelo neutro próprio** em vez de gerar MusicXML direto do parser: permite aceitar outros
  formatos de entrada e trocar a saída sem tocar na leitura do `.enc`.
- **Zoom por `transform: scale()`** no contêiner do OSMD, não por `osmd.Zoom`: com `autoResize`, o
  OSMD reengravita a partitura na largura disponível e o zoom deixaria de ampliar de verdade.
- **`divisions` calculado pelo MMC exato** das durações presentes na partitura, em vez de um valor
  fixo: figuras de 64 avos e pontuadas continuam exatas.

## Amostras `.enc`

As amostras da Fase 1 ficam em [`tests/fixtures/`](tests/fixtures/README.md), com o catálogo de
versão do Encore, sistema operacional e recurso comprovado por arquivo.

## Limitações conhecidas

- O bundle inclui o OSMD e passa de 500 kB (aviso do Vite); avaliar code splitting quando a UI
  estabilizar.
- Sem cursor/playback: o OSMD é usado só para desenhar a partitura.
- Portão G1 não atingido: o contêiner `.enc` está documentado, mas notas, claves e armaduras ainda
  não foram decodificadas — faltam amostras controladas (ver seção 8 de `docs/enc-format.md`).
