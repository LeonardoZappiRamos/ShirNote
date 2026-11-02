# Amostras `.enc` — Fase 1

Aqui ficam os arquivos reais usados para a engenharia reversa (tarefa 1.1 do cronograma). O parser
não existe ainda; por enquanto esta pasta é o acervo de evidências.

## Catálogo

Preencha uma linha por arquivo. A coluna "recurso comprovado" é o que o portão G1 exige: cada campo
documentado em `docs/enc-format.md` precisa de ao menos uma amostra que o comprove.

| Arquivo                        | Versão do Encore | SO          | Complexidade                       | Recurso comprovado                                                                          | Origem / direitos                                                                              |
| ------------------------------ | ---------------- | ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `samples/justica-flauta2.enc`  | a confirmar      | a confirmar | 1 parte, 38 compassos, 10 sistemas | contêiner `SCOW` + cadeia `PAGE`/`LINE`/`MEAS`/`TITL` fechando no EOF; bloco fixo de 54 B   | `docs/amostra/A JUSTIÇA - Flauta 2.enc` (direitos a confirmar)                                 |
| `samples/tora-sax-tenor.enc`   | a confirmar      | a confirmar | 1 parte, 36 compassos, 9 sistemas  | mesma cadeia fechando no EOF; `TEXT`/`FONT` de tamanho variável entre arquivos              | `docs/amostra/A TORÁ DE ADONAI - Sax tenor.enc` (direitos a confirmar)                         |
| `samples/alegrei-sax-alto.enc` | a confirmar      | a confirmar | 1 parte, 43 compassos, 11 sistemas | mesma cadeia fechando no EOF; `LINE` com 11 sistemas; possíveis pares de notas no mesmo `x` | `docs/amostra/ALEGREI-ME QUANDO ME DISSERAM (SALMO 122) - Sax Alto.enc` (direitos a confirmar) |

Análise consolidada em [`docs/enc-format.md`](../../docs/enc-format.md) (v0.2).

## Regras

- Nunca comitar arquivo com dados pessoais ou obra sem direito de uso confirmado (questão em aberto
  do PRD).
- Amostras grandes podem ir para armazenamento externo; registre o link no catálogo.
- Amostras controladas (uma nota, um compasso, outra tonalidade) devem ser identificáveis no nome,
  por exemplo `controle-1nota-c4.enc`.
- Para inspecionar bytes sem o parser: `node scripts/enc-dump.mjs <arquivo> --chunks` (cadeia de
  blocos) ou `--tags` (inventário de tags), ou suba o arquivo na tela do ShirNote e abra
  "Diagnóstico do cabeçalho".
