# Amostras `.enc`

Aqui ficam os arquivos usados na engenharia reversa (Fase 1) e na conferência do parser de produto
(Fase 2, tarefa 2.6).

```
tests/fixtures/
  samples/     partituras reais de terceiros (evidência de formato, sem controle do conteúdo)
  controlled/  partituras de teste geradas por nós, um campo por arquivo
  reference/   MusicXML exportado pelo Encore para casar nota a nota com o binário
```

## Catálogo — `samples/`

Preencha uma linha por arquivo. A coluna "recurso comprovado" é o que o portão G1 exige: cada campo
documentado em `docs/enc-format.md` precisa de ao menos uma amostra que o comprove.

| Arquivo                                 | Versão do Encore | SO          | Complexidade                        | Recurso comprovado                                                                          | Origem / direitos                                                                      |
| --------------------------------------- | ---------------- | ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `samples/justica-flauta2.enc`           | `0xC4`           | a confirmar | 1 parte, 38 compassos, 10 sistemas  | contêiner `SCOW` + cadeia `PAGE`/`LINE`/`MEAS`/`TITL` fechando no EOF; bloco fixo de 54 B   | `originals/A JUSTIÇA - Flauta 2.enc` (acervo liberado)                                 |
| `samples/tora-sax-tenor.enc`            | `0xC4`           | a confirmar | 1 parte, 36 compassos, 9 sistemas   | mesma cadeia fechando no EOF; `TEXT`/`FONT` de tamanho variável entre arquivos              | `originals/A TORÁ DE ADONAI - Sax tenor.enc` (acervo liberado)                         |
| `samples/alegrei-sax-alto.enc`          | `0xC4`           | a confirmar | 1 parte, 43 compassos, 11 sistemas  | mesma cadeia fechando no EOF; `LINE` com 11 sistemas; possíveis pares de notas no mesmo `x` | `originals/ALEGREI-ME QUANDO ME DISSERAM (SALMO 122) - Sax Alto.enc` (acervo liberado) |
| `samples/meu-clamor-trompete.enc`       | `0xC4`           | a confirmar | 1 parte, 99 compassos, 24 sistemas  | confere com o MusicXML                                                                      | `originals/A MEU CLAMOR (SALMO 4) - Trompete Bb.enc` (acervo liberado)                 |
| `samples/seu-tempo-melodia.enc`         | `0xC4`           | a confirmar | 1 parte, 48 compassos, 12 sistemas  | confere com o MusicXML                                                                      | `originals/A SEU TEMPO - MELODIA.enc` (acervo liberado)                                |
| `samples/vontade-do-pai-trompete.enc`   | `0xC4`           | a confirmar | 1 parte, 31 compassos, 8 sistemas   | pausa pontuada sem `<dot/>` no MusicXML                                                     | `originals/A VONTADE DO PAI (O DIA E A HORA) - TROMPETE Bb.enc` (acervo liberado)      |
| `samples/adonai-adoneinu-melodia.enc`   | `0xC4`           | a confirmar | 1 parte, 56 compassos, 14 sistemas  | confere com o MusicXML                                                                      | `originals/ADONAI ADONEINU - MELODIA Bb.enc` (acervo liberado)                         |
| `samples/adonai-adoneinu-sax-tenor.enc` | `0xC4`           | a confirmar | 1 parte, 59 compassos, 12 sistemas  | confere com o MusicXML                                                                      | `originals/ADONAI ADONEINU - SAX TENOR.enc` (acervo liberado)                          |
| `samples/al-ze-flauta.enc`              | `0xC4`           | a confirmar | 1 parte, 127 compassos, 24 sistemas | confere com o MusicXML                                                                      | `originals/AL ZE- Flauta.enc` (acervo liberado)                                        |
| `samples/alegrei-flauta.enc`            | `0xC4`           | a confirmar | 1 parte, 43 compassos, 11 sistemas  | confere com o MusicXML                                                                      | `originals/ALEGREI-ME QUANDO ME DISSERAM (SALMO 122) - Flauta.enc` (acervo liberado)   |
| `samples/ana-bekoach-clarinete.enc`     | `0xC4`           | a confirmar | 1 parte, 120 compassos, 24 sistemas | 6/8; pausas pontuadas sem `<dot/>` no MusicXML                                              | `originals/ANA BEKOACH - Clarinete.enc` (acervo liberado)                              |
| `samples/ana-bekoach-flauta.enc`        | `0xC4`           | a confirmar | 1 parte, 120 compassos, 24 sistemas | 6/8; pausas pontuadas sem `<dot/>` no MusicXML                                              | `originals/ANA BEKOACH - Flauta.enc` (acervo liberado)                                 |
| `samples/ana-bekoach-trombone.enc`      | `0xC4`           | a confirmar | 1 parte, 120 compassos, 24 sistemas | 6/8; pausas pontuadas; grafia de ligadura C♯–D♭ no MusicXML                                 | `originals/ANA BEKOACH - Trombone.enc` (acervo liberado)                               |
| `samples/atravessem-sax-tenor.enc`      | `0xC4`           | a confirmar | 1 parte, 84 compassos, 21 sistemas  | confere com o MusicXML                                                                      | `originals/ATRAVESSEM AS PORTAS (Ivru Basharim) - Sax Tenor.enc` (acervo liberado)     |

Direito de uso: o acervo é liberado para o ShirNote, que será publicado como open source
(aprovado em 02/11/2026). Todas conferem com o MusicXML em `reference/`.

Análise consolidada em [`docs/enc-format.md`](../../docs/enc-format.md) (v0.9).

## Catálogo — `controlled/`

O catálogo dos 24 arquivos `controle-*.enc`, com o conteúdo de cada um, está em
[`controlled/README.md`](controlled/README.md).

## Catálogo — `reference/`

Ver [`reference/README.md`](reference/README.md). O MusicXML de uma partitura real (ou de cada
amostra controlada) vale mais que várias amostras controladas, porque traz centenas de notas já
rotuladas.

## Regras

- Nunca comitar arquivo com dados pessoais ou obra sem direito de uso confirmado (questão em aberto
  do PRD).
- Amostras grandes podem ir para armazenamento externo; registre o link no catálogo.
- Amostras controladas vão em `controlled/` com nome ASCII `controle-NN-descricao.enc`
  (ex.: `controle-02-c4-seminima.enc`).
- Para inspecionar bytes sem o parser: `node scripts/enc-dump.mjs <arquivo> --chunks` (cadeia de
  blocos), `--tags` (inventário de tags) ou `--notes` (notas), ou suba o arquivo na tela do ShirNote
  e abra "Diagnóstico do cabeçalho".
- Para ler e conferir uma amostra: `node scripts/enc-spike.mjs <arquivo> --check <referencia>`.
- Para comparar duas amostras: `node scripts/enc-diff.mjs <a.enc> <b.enc> --tag MEAS`
  (use depois de gerar cada `controle-*.enc`, comparando com o arquivo do passo anterior).
