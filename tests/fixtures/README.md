# Amostras `.enc` — Fase 1

Aqui ficam os arquivos reais usados para a engenharia reversa (tarefa 1.1 do cronograma). O parser
não existe ainda; por enquanto esta pasta é o acervo de evidências.

## Catálogo

Preencha uma linha por arquivo. A coluna "recurso comprovado" é o que o portão G1 exige: cada campo
documentado em `docs/enc-format.md` precisa de ao menos uma amostra que o comprove.

| Arquivo       | Versão do Encore | SO            | Complexidade | Recurso comprovado | Origem / direitos |
| ------------- | ---------------- | ------------- | ------------ | ------------------ | ----------------- |
| _exemplo.enc_ | _a confirmar_    | _a confirmar_ | _1 nota_     | _a confirmar_      | _a confirmar_     |

## Regras

- Nunca comitar arquivo com dados pessoais ou obra sem direito de uso confirmado (questão em aberto
  do PRD).
- Amostras grandes podem ir para armazenamento externo; registre o link no catálogo.
- Amostras controladas (uma nota, um compasso, outra tonalidade) devem ser identificáveis no nome,
  por exemplo `controle-1nota-c4.enc`.
- Para inspecionar bytes sem o parser: suba o arquivo na tela do ShirNote e abra "Diagnóstico do
  cabeçalho"; a prévia mostra os primeiros 64 bytes em hexadecimal e ASCII.
