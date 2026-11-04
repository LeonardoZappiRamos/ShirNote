# Cronograma — Visualizador Web de Partituras Encore (.enc)

**Versão:** 2.2 · **Data:** 02/11/2026 · **Base:** `docs/PRD — Visualizador Web de Partituras Encore (.enc).md`
**Horizonte:** 03/11/2026 → 11/12/2026 (release do MVP), com limite em 06/01/2027 e reserva até 13/01/2027
**Decisões de origem:** G1 aprovado em 02/11/2026 ([ADR 0002](decisions/0002-aprovar-portao-g1-e-iniciar-fase-2.md)); régua de desempenho e compatibilidade ([ADR 0004](decisions/0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md))

---

## 0. Mudanças em relação à v1.0

A v1.0 (01/11/2026) previa 18 du para a Fase 1. A descoberta do formato terminou em 02/11/2026,
antes do início planejado, e o portão G1 foi aprovado com uma condição. Esta versão recalcula G2 a G5
como manda a seção 9 da v1.0.

| Item | v1.0 | v2.0 | Motivo |
| --- | --- | --- | --- |
| Fase 1 | 03/11 → 27/11 (18 du) | **concluída** em 02/11 | `docs/enc-format.md` v0.8; spike confere 27 de 27 amostras |
| Início da Fase 2 | 30/11/2026 | 03/11/2026 | G1 aprovado |
| RF-07 (partes e vozes) | Fase 4, tarefa 4.6 | Fase 2, tarefa 2.3 | segunda pauta e segunda parte já comprovadas |
| Folga da trilha paralela | — | absorvida pelo RF-07 | 2.1, 2.2 e 2.4 já existem desde o scaffold |
| Partituras reais | meta de 10–30 na Fase 1 | **≥ 10 até o G2** (24/11) | G1 aprovado com 3; condição do ADR 0002, cumprida em 02/11 com 14 |
| Versão do Encore | "1 versão de referência" | **`0xC4`** (Encore 5.0.2) | único valor em todas as amostras |
| G4 | 21/01/2027 | 28/12/2026 | sai de 24/12, meio período |
| Release (G5) | 29/01/2027 | 06/01/2027 | — |

## 0.2 Andamento em 04/11/2026

A Fase 4 foi concluída em 04/11/2026, antes da data-alvo de 27/11, e o **G4 fechou com 4 de 4 itens**.
A única ressalva é a do ADR 0004: o Safari fica pendente por falta de macOS.

| Item | Situação |
| --- | --- |
| 4.1 a 4.7 | feitas; detalhe na seção 4 e no G4 |
| Bugs achados no caminho | partitura anterior redesenhada ao redimensionar; mesmo arquivo travava em "Desenhando…"; partitura anterior visível depois de erro |
| Fase 5 | pode começar antes de 30/11; as datas da v2.2 continuam como limite |

## 0.1 Andamento em 02/11/2026

A Fase 2 foi executada em 02/11/2026, antes do início previsto (03/11), e o G2 está fechado. A Fase 3
também fechou no mesmo dia, com os três critérios do G3 verificados no navegador.

| Item | Situação |
| --- | --- |
| 2.1 a 2.6 | feitas; detalhe na seção 4 |
| G2 | **5 de 5** — MusicXML abre no OSMD e no Verovio (38 de 38 amostras, 02/11) |
| G3 | **3 de 3** — zoom/rolagem, arquivo inválido e Network verificados no navegador em 02/11 |
| 3.3, 3.5 | feitas: o OSMD renderiza o `.enc`, e os avisos do parser aparecem no status |
| 3.4 | parcial por decisão: pipeline no navegador sem Web Worker; a maior amostra leva 2,3 ms de mediana ([ADR 0003](decisions/0003-adiar-o-web-worker-do-parse.md)) |
| Além do plano | barras de repetição e casas, barras de colcheia, segno e coda |
| Avisos que restam nas partituras reais | dinâmicas (o próprio Encore exporta `<dynamics>` vazio) e textos (bloco `TEXT`) |

**As datas da seção 2 mudaram: esta é a v2.2.** Fechados G2 e G3 em 02/11, o replanejamento da seção 9
antecipou G4 e G5, mantendo 06/01/2027 como limite e sem mexer na reserva.

| Item | v2.1 | v2.2 | Motivo |
| --- | --- | --- | --- |
| Fase 3 | 25/11 → 10/12 | **concluída** em 02/11 | melodia, zoom, rolagem, erro e Network verificados |
| Fase 4 | 11/12 → 28/12 | **03/11 → 27/11** (G4 em 27/11) | 18 du disponíveis para 10 du de trabalho |
| Fase 5 | 29/12 → 06/01/2027 | **30/11 → 11/12** (G5 em 11/12) | 10 du disponíveis para 6 du de trabalho |
| Reserva | 07/01 → 13/01/2027 | **14/12/2026 → 06/01/2027** | 17 du de colchão antes do limite |
| Release | 06/01/2027 | **11/12/2026** (limite 06/01/2027) | antecipação decidida em 02/11 |

A antecipação não muda o escopo nem a definição de pronto dos portões: o que muda é a data-alvo, e o
limite de 06/01/2027 continua valendo se o G4 escorregar.

**Régua de desempenho e compatibilidade.** Como não existe notebook de referência e não há acesso a
macOS, o G4 passa a ser medido nesta máquina com CPU limitada a 4× e com a matriz de navegadores
incompleta no Safari — decisão e ressalvas no
[ADR 0004](decisions/0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md).

---

## 1. Premissas de planejamento

O cronograma é dimensionado em **dias úteis (du)** e assume:

| Premissa | Valor adotado | Efeito se mudar |
| --- | --- | --- |
| Equipe de desenvolvimento | 1 pessoa full-time (TypeScript/front-end) | 2 devs comprimem F2–F4 em ~30% |
| Apoio de domínio | 0,5 pessoa (música/Encore) para gerar amostras e validar | Sem esse apoio, a condição do G2 não fecha |
| Início da Fase 2 | terça, 03/11/2026 (02/11 é feriado) | — |
| Feriados considerados | 20/11, 25/12/2026 e 01/01/2027 | 24/12 fora da contagem; 31/12 contado como dia cheio |
| Versão do Encore | só `0xC4`; outras versões geram erro claro | Outra versão exige amostras e entra no backlog |
| Partituras reais | 14 do mesmo acervo, recebidas em 02/11/2026, direito de uso aprovado | Novas partituras só ampliam a cobertura |
| Restrição legal | análise do executável não foi necessária; Enc2MusicXML (GPL-3.0) só como pista | Parecer negativo não muda datas: o formato já está documentado |
| Régua de desempenho | máquina de desenvolvimento com CPU limitada a 4× ([ADR 0004](decisions/0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md)) | Notebook real muda o número; a régua é refeita |
| Navegadores | Chrome, Edge e Firefox na máquina local; Safari pendente | RNF-04 fica em 3 de 4 e o G4 registra a ressalva |
| Escopo | exatamente o MVP do PRD (12 RF, 8 RNF) | Qualquer RF extra entra no backlog pós-MVP |

**Regra de ouro:** o formato está comprovado para o MVP, e as 14 partituras reais conferem com o
spike. O risco passou a ser a **fidelidade do parser de produto** ao spike; o modo tolerante (RF-11)
continua sendo a defesa para casos sem amostra.

---

## 2. Resumo executivo

| Fase | Foco | Esforço | Início | Fim | Portão |
| --- | --- | --- | --- | --- | --- |
| **1. Descoberta do formato** | Engenharia reversa e `docs/enc-format.md` | concluída | 01/11/2026 | 02/11/2026 | **G1** ✓ |
| **2. Núcleo de conversão** | Parser → modelo → MusicXML, com RF-07 | 15 du | 03/11/2026 | 24/11/2026 | **G2** |
| **3. Interface e renderização** | Upload, status, OSMD, zoom | 12 du | concluída 02/11/2026 | concluída 02/11/2026 | **G3** ✓ |
| **4. Robustez e testes** | Fixtures, erros, desempenho, a11y | 18 du disponíveis para 10 | 03/11/2026 | 27/11/2026 | **G4** |
| **5. Homologação e release** | Aceite, docs, demo | 10 du disponíveis para 6 | 30/11/2026 | 11/12/2026 | **G5** |
| **Reserva** | Contingência até o limite | 17 du | 14/12/2026 | 06/01/2027 | — |

**Total:** 43 du de execução. Com a antecipação, a execução termina em 11/12/2026 e sobram 17 du úteis
até o limite de 06/01/2027.

---

## 3. Linha do tempo

| Fase / trilha | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **1–3. Descoberta, núcleo e interface** | ██ | · | · | · | · | · | · | · | · | · | · |
| **4. Robustez e testes** | ██ | ██ | ██ | ██ | · | · | · | · | · | · | · |
| **5. Homologação e release** | · | · | · | · | ██ | ██ | · | · | · | · | · |
| **Reserva** | · | · | · | · | · | · | ██ | ██ | ██ | ██ | · |

G1, G2 e G3 fecharam em 02/11, antes da W1; a barra de 1–3 marca a entrega, não o esforço.

| Semana | Período | Semana | Período |
| --- | --- | --- | --- |
| W1 | 03–06/11 | W7 | 14–18/12 |
| W2 | 09–13/11 | W8 | 21–24/12 |
| W3 | 16–20/11 | W9 | 28–31/12 |
| W4 | 23–27/11 | W10 | 04–08/01 |
| W5 | 30/11–04/12 | W11 | 11–15/01 |
| W6 | 07–11/12 | | |

**Marcos:** G1 02/11 ✓ · G2 02/11 ✓ · G3 02/11 ✓ · G4 04/11 ✓ (Safari pendente) · **G5 11/12** · limite 06/01/2027.

---

## 4. Detalhamento por fase

### Fase 1 — Descoberta do formato `.enc` (concluída em 02/11/2026)

| # | Tarefa | Resultado |
| --- | --- | --- |
| 1.1 | Coletar 10–30 amostras reais | **3**; a meta passou a ser condição do G2 |
| 1.2 | Gerar amostras controladas | 24, todas com MusicXML de referência |
| 1.3 | Diff hexadecimal | `scripts/enc-diff.mjs` e `scripts/enc-dump.mjs` |
| 1.4 | Spike de parser | `scripts/enc-spike.mjs` confere 27 de 27 amostras com o MusicXML do Encore |
| 1.5 | `docs/enc-format.md` | v0.8, com comprovado e hipótese separados |
| 1.6 | Análise do executável | não foi necessária |

**Portão G1 — aprovado em 02/11/2026** (ADR 0002)
- [x] `docs/enc-format.md` cobre cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras, metadados.
- [x] Cada campo documentado tem ao menos uma amostra que o comprova.
- [x] O spike de parser abre ≥ 3 amostras simples sem erro.
- [x] Magic bytes e versão identificados (`SCOW`; versão `0xC4` como candidata).
- [x] Decisão go/no-go registrada e datas de G2–G5 recalculadas.

---

### Fase 2 — Núcleo de conversão (15 du · 03/11 → 24/11)

Objetivo: pipeline completo fora do navegador — `.enc` → modelo neutro → MusicXML válido, já com
várias partes, pautas e vozes.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 2.1 | Scaffold do projeto | feito | Repositório pronto |
| 2.2 | Ajustar o modelo musical para partes, pautas e vozes | feito | `src/music`: breve, quiáltera, acorde, pautas, barras, barra de colcheia, segno e coda |
| 2.3 | Parser Encore: magic, versão `0xC4`, metadados, compassos, claves, armaduras, notas, pausas, partes, pautas e vozes (RF-07); avisos do modo tolerante | feito | `src/enc/parser.ts` |
| 2.4 | Gerador MusicXML com várias partes e pautas + validação contra XSD | feito | `src/musicxml`; XSD oficial do MusicXML 4.0 em `tests/schema` |
| 2.5 | Harness de fixtures: o teste do spike passa a rodar contra o parser de produto | feito | `src/enc/parser.test.ts` |
| 2.6 | Conferir o parser com as 14 partituras reais, incluindo as diferenças do exportador do Encore (`enc-format.md`, seção 7) | feito | 38 amostras conferem com o MusicXML do Encore |

**Portão G2 — Pipeline completo (24/11/2026)**
- [x] `.enc` → MusicXML válido via teste, sem tocar na UI (`src/musicxml/schema.test.ts`).
- [x] MusicXML abre no OSMD e em um segundo visualizador. **OSMD: sim**; **Verovio 6.4.0: sim**, com as
  38 amostras geradas por `scripts/export-musicxml.mjs` (todas renderizam; a justica sai com 105 grupos
  de nota, igual ao gabarito). Verificado em 02/11/2026.
- [x] Comparação elementar passando nas 24 controladas e nas **14 partituras reais** (condição do ADR 0002), inclusive barras e barras de colcheia.
- [x] Arquivo de outra versão do Encore gera `EncoreFormatError` com mensagem clara.
- [x] Módulos sem acoplamento (RNF-05): `src/enc` e `src/musicxml` só dependem de `src/music`.

---

### Fase 3 — Interface e renderização (12 du · 25/11 → 10/12)

Objetivo: primeira partitura visível no navegador, com os estados de UX do PRD.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 3.1 | `FileUploader`: seleção, arrastar e soltar, filtro de extensão | 2 du | RF-01 |
| 3.2 | `StatusBar`: vazio, lendo, validando, convertendo, renderizando | 2 du | Estados de UX |
| 3.3 | `ScoreViewer` com OSMD, zoom e rolagem horizontal/vertical | feito, verificado no G3 | RF-09, RF-10 |
| 3.4 | Integração do pipeline no navegador (`ArrayBuffer`, Web Worker para não travar a UI) | parcial por decisão: sem Web Worker ([ADR 0003](decisions/0003-adiar-o-web-worker-do-parse.md)) | RF-02, RNF-01, RNF-03 |
| 3.5 | Modo tolerante: avisos do parser chegam à UI sem derrubar a renderização | feito | RF-11 |
| 3.6 | Textos em pt-BR e mensagens de erro acionáveis | 1 du | RNF-08 |

3.1 e 3.2 já têm rascunho desde o scaffold; o esforço cobre a versão final.

**Portão G3 — MVP navegável (10/12/2026)**
- [x] Melodia de uma voz renderizada no navegador a partir de um `.enc` real (verificado em 02/11/2026 com 3 partituras).
- [x] Zoom e rolagem funcionando. Verificado em 02/11/2026 com a `justica-flauta2`: o `scale` vai de
  100% a 200% e para em 50% no mínimo, e o `.score` rola de verdade (900 px na vertical e 120 px na
  horizontal em 200%).
- [x] Arquivo inválido gera mensagem clara, sem recarregar a página. Verificado em 02/11/2026 com um
  `.enc` truncado (`O arquivo está corrompido: a cadeia de blocos não fecha no fim.`) e outro com a
  magia zerada (`O arquivo não é uma partitura do Encore.`): a partitura anterior continua na tela, o
  console fica sem erros e a aba não recarrega.
- [x] Nenhum arquivo sai do navegador (verificado na aba Network). Em 02/11/2026 a sessão inteira
  (carregar o app, abrir a partitura e os dois arquivos inválidos) fez 30 requisições, todas `GET` em
  `localhost:5199` — 1 documento, 28 módulos e o WebSocket do Vite. Nenhum `POST`, nenhum `multipart`
  e nenhum corpo com os bytes do `.enc`.

---

### Fase 4 — Robustez e testes (10 du · 11/12 → 28/12)

Objetivo: transformar a demo em produto que aguenta arquivo ruim e atende às métricas.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 4.1 | Cobertura de fixtures por recurso (todo RF suportado tem `.enc` de teste) | feito: censo de 29 recursos em `src/enc/coverage.test.ts`; fidelidade em `parser.test.ts` | RNF-06 |
| 4.2 | Robustez: arquivos truncados, corrompidos, outras versões e outros formatos | feito: fuzz determinístico em `src/enc/robustness.test.ts` | RNF-02, RF-03 |
| 4.3 | Desempenho: 50 compassos em ≤ 3 s + profiling | feito: 56 compassos em 494 ms com CPU a 4× (ver G4) | RNF-03 |
| 4.4 | Compatibilidade Chrome, Firefox, Edge e Safari | feito em 3 de 4: Chrome, Edge e Firefox aprovados; Safari pendente, sem macOS (ver G4) | RNF-04 |
| 4.5 | Acessibilidade: navegação por teclado, contraste, ARIA nos estados de erro | feito: checklist no G4; axe sem violação; sem leitor de tela real | RNF-07 |
| 4.6 | Título e autor na interface (RF-04) e partituras com várias partes no OSMD (RF-07) | feito: OSMD desenha título e autor do arquivo; sem título não exibe "Untitled Score"; nome de parte só com duas ou mais partes | RF-04, RF-07 |
| 4.7 | Arquivos de exemplo para demonstração (RF-12) | feito: três exemplos no painel de abertura — a melodia real `seu-tempo-melodia` (acervo com uso liberado) e as controladas de piano e duas vozes | RF-12 |

**Portão G4 — Robustez comprovada (fechado em 04/11/2026, com a ressalva do Safari)**
- [x] 90% das amostras simples abrem sem erro; 100% de fidelidade nas suportadas. **38 de 38** abrem e
  conferem com o MusicXML do Encore em `src/enc/parser.test.ts` (14 partituras reais e 24 controladas).
- [x] Zero travamentos com arquivos inválidos (teste com lote de arquivos ruins). Verificado em
  02/11/2026 por `src/enc/robustness.test.ts`: corte em 21 offsets por amostra, bytes aleatórios,
  magia/versão erradas, texto e PDF disfarçados, cabeçalho fora de faixa e **500 mutações de 1 a 3
  bytes por amostra**, todas terminando em `EncoreFormatError` ou partitura íntegra.
- [x] Renderização de 50 compassos ≤ 3 s na régua provisória: esta máquina com CPU a 4×
  ([ADR 0004](decisions/0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md)).
  Medido em 04/11/2026 no Chrome `156.0.8078.74`, build de produção (`vite preview`), do arquivo
  selecionado até o status "pronto" (OSMD desenhado); 5 execuções após 1 de aquecimento:

  | Partitura | Compassos | Bruto (mediana / pior) | CPU 4× (mediana / pior) |
  | --- | --- | --- | --- |
  | `adonai-adoneinu-melodia.enc` | 56 | 76 / 88 ms | **494 / 510 ms** |
  | `al-ze-flauta.enc` (maior do acervo) | 127 | 130 / 134 ms | 864 / 922 ms |

  Profiling: parse + MusicXML custa 2,3 ms de mediana na maior amostra
  ([ADR 0003](decisions/0003-adiar-o-web-worker-do-parse.md)); o resto é o
  OSMD. O gatilho do worker (100 ms de parse) segue longe.
- [x] Checklist de acessibilidade e matriz dos 4 navegadores preenchidos. **Safari fica pendente** por
  falta de macOS; a célula é marcada como "pendente", nunca como aprovada. Os dois preenchidos em
  04/11/2026.

  Roteiro igual nos três navegadores reais, sem cabeça, contra o build de produção: exemplo inicial,
  melodia com título e autor (`seu-tempo-melodia`), duas partes (`controle-17`), duas pautas
  (`controle-16`), 56 compassos (`adonai-adoneinu-melodia`), arquivo inválido com mensagem de erro,
  zoom pelos botões e console sem erro. Desenho conferido por print e pela contagem de elementos do SVG,
  que bate entre os navegadores.

  | Navegador | Versão | Resultado |
  | --- | --- | --- |
  | Chrome | 156.0.8078.74 | aprovado |
  | Edge | 156.0.4314.58 | aprovado |
  | Firefox | 159.0 (Microsoft Store) | aprovado |
  | Safari | — | **pendente — sem macOS** |

  O roteiro achou um bug, corrigido no mesmo dia: cada arquivo criava uma instância nova do OSMD, e a
  antiga redesenhava a partitura anterior por cima da nova quando a janela mudava de tamanho. Agora há
  uma instância por montagem (`src/components/ScoreViewer.test.tsx`).

  Checklist de acessibilidade (RNF-07), no Chrome 156 contra o build de produção:

  | Item | Resultado |
  | --- | --- |
  | axe-core 4 (WCAG 2.1 A/AA e boas práticas) no exemplo, em "pronto" com avisos e em erro | 0 violações |
  | Ordem do Tab: arquivo → diagnóstico → zoom − / + / original → área da partitura | ok |
  | Foco visível no botão de arquivo (o `<input>` real é invisível) | corrigido: contorno no botão |
  | Enter no botão de arquivo abre o seletor | ok |
  | Área da partitura rola pelas setas com zoom alto | corrigido: entra no Tab |
  | Nome acessível da partitura (o SVG do OSMD só tem números de compasso) | corrigido: "Partitura: título" |
  | Erro anunciado sem esperar a fala atual | corrigido: `aria-live="assertive"` no erro |
  | Erro não deixa a partitura anterior na tela | corrigido: área limpa, com "Nenhuma partitura aberta." |
  | Contraste de texto (menor: 7,4:1) e do contorno de foco (menor: 3,4:1) | ok |
  | Contraste da borda dos botões de zoom (WCAG 1.4.11) | corrigido: de 1,4:1 para 3,6:1 |
  | `lang="pt-BR"` no documento | ok |
  | Leitor de tela real (NVDA, VoiceOver) | **não testado**; a semântica foi conferida pelo axe |

  O roteiro também achou que abrir o mesmo arquivo duas vezes deixava o status preso em
  "Desenhando…", porque o MusicXML igual não redesenhava. Corrigido junto.

---

### Fase 5 — Homologação e release (6 du · 29/12 → 06/01)

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 5.1 | `docs/enc-format.md` v1.0 + README + diagrama de arquitetura | feito em 04/11/2026: formato v1.0 com mapa do formato ao código (seção 12); diagrama Mermaid no README | Documentação final |
| 5.2 | Checklist dos 7 critérios de aceite + validação em visualizador externo | feito em 04/11/2026: 7 de 7 (ver G5) | Aceite assinado |
| 5.3 | Correções finais e polimento de mensagens | feito em 04/11/2026: erro diz o motivo e o que fazer (PRD, seção 9); exemplo com título e autor reais | Build candidato |
| 5.4 | Deploy estático da demo | 1 du | URL da demo |
| 5.5 | Retrospectiva e backlog pós-MVP | feito em 04/11/2026: seções 10 e 11 | Backlog priorizado |

**Portão G5 — Release do MVP (alvo 11/12/2026, limite 06/01/2027)**
- [x] Os 7 critérios de aceite do PRD marcados. Conferidos em 04/11/2026 contra o build de produção:

  | Critério (PRD, seção 10) | Evidência |
  | --- | --- |
  | O usuário envia um `.enc` pelo navegador | seleção e arrastar no `FileUploader`; roteiro da 4.4 em Chrome, Edge e Firefox |
  | O app identifica se o arquivo é compatível | magia `SCOW` e versão `0xC4` em `parser.test.ts`; fuzz em `robustness.test.ts` |
  | Uma partitura simples é renderizada corretamente | exemplos e 38 amostras no OSMD; prints da 4.4 |
  | Notas, pausas, compassos, claves, tonalidades e fórmulas aparecem corretamente | 38 de 38 conferem com o MusicXML do Encore (`parser.test.ts`) |
  | Arquivos inválidos geram mensagem clara, sem travar a interface | `robustness.test.ts` (corte, mutação, outros formatos); mensagem e área limpa no navegador |
  | Cada recurso suportado tem ao menos um `.enc` de teste | censo de 29 recursos em `coverage.test.ts` |
  | O MusicXML abre no OSMD e em outro visualizador | OSMD no app; **Verovio 6.4.0: 38 de 38** abrem de novo em 04/11, `justica` com 105 notas, igual ao gabarito |

  RNF-01 conferido junto: abrir a maior amostra no Chrome não gera nenhuma requisição de rede.
- [ ] Demo no ar e acessível.
- [x] `docs/enc-format.md` publicado e suficiente para outra pessoa dar manutenção. v1.0 em 04/11/2026:
  comprovado e hipótese separados, lacunas na seção 8, passo a passo para comprovar um campo e mapa
  de cada parte do formato até o código na seção 12.
- [x] Nenhum item de prioridade Alta em aberto. RF-01, RF-02, RF-03, RF-05, RF-06, RF-08, RF-09 e RF-11
  estão cobertos pelos critérios acima e pelos portões G2 a G4.

---

## 5. Mapa requisito → fase

| Requisito | Fase | Verificação |
| --- | --- | --- |
| RF-01, RF-02 | 3 | Teste manual + Network |
| RF-03 | 2 (magic e versão) e 4 (robustez) | Amostras inválidas e de outra versão |
| RF-04 | 2 (extração) e 4 (UI) | Fixture com título/autor (`controle-21`) |
| RF-05, RF-06 | 2 (parser) e 3 (render) | Comparação elementar |
| RF-07 | 2 (parser) e 4 (render) | `controle-16`, `17`, `18` e `24` |
| RF-08 | 2 | Validação XSD + 2º visualizador |
| RF-09, RF-10 | 3 | Render no navegador |
| RF-11 | 2 (avisos), 3 (UI) e 4 (cobertura) | Lote de arquivos ruins |
| RF-12 | 4 | Exemplos publicados |
| RNF-01, RNF-02 | 3 e 4 | Network + lote de corrompidos |
| RNF-03 | 4 | Cronometragem de 50 compassos |
| RNF-04 | 4 | Matriz de navegadores |
| RNF-05 | 2 | Revisão de imports entre módulos |
| RNF-06 | 2 e 4 | Fixture por recurso |
| RNF-07, RNF-08 | 3 e 4 | Checklist a11y + revisão de textos |

---

## 6. Cenários de prazo

Com a Fase 1 concluída e as 14 partituras reais conferindo com o spike, a incerteza está no parser de
produto e em partituras fora do acervo.

| Cenário | Gatilho | Efeito | Release |
| --- | --- | --- | --- |
| **Otimista** | O parser repete o spike nas 38 amostras | Reserva intacta | **06/01/2027** |
| **Base** | Partituras fora do acervo trazem casos sem amostra (vozes 3–8, quiálteras 5:4, outras claves) | Novas amostras controladas; consome até 3 du da reserva | **06/01/2027** |
| **Pessimista** | Parser exige retrabalho estrutural ou surge estrutura desconhecida | G2 escorrega; reserva consumida | **13/01/2027** ou depois |

---

## 7. Caminho crítico e dependências

**Caminho crítico:** 2.3 → 2.6 → G2 → 3.3 → 3.4 → 4.2 → 5.2 → G5.

**Dependências externas**
- ~~≥ 10 partituras reais do mesmo acervo até 24/11/2026~~ — cumprida em 02/11/2026, com 14.
- Acesso ao Encore para novas amostras controladas, se as partituras reais revelarem casos novos.
- ~~Notebook de referência definido antes de 4.3~~ — régua provisória em 02/11/2026
  ([ADR 0004](decisions/0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md)); notebook real
  segue pendente e não bloqueia o G4.
- Acesso a macOS/Safari para fechar o RNF-04 — **não disponível**; a linha do Safari fica pendente no G4.

---

## 8. Riscos de cronograma e gatilhos de ação

| Risco | Sinal de alerta | Ação imediata | Impacto |
| --- | --- | --- | --- |
| Parser diverge do spike numa partitura real | Falha no teste de referência na tarefa 2.6 | Comparar com o spike e com `enc-format.md`; corrigir o parser | +1 a +2 du |
| Partitura real com caso sem amostra | Divergência na tarefa 2.6 | Amostra controlada isolando o caso; enquanto isso, aviso do modo tolerante | +1 a +3 du |
| Acervo usa outra versão do Encore | `0x04` diferente de `0xC4` | Erro claro; versão nova vai para o backlog, salvo decisão em novo ADR | +5 du se entrar no MVP |
| OSMD não renderiza o MusicXML gerado | G2 falha na abertura | Spike de 3 du com Verovio como renderizador alternativo | +5 du |
| Contaminação de licença GPL | Código derivado do Enc2MusicXML | Usar só como pista; toda regra comprovada por amostra nossa | — |
| Atraso > 3 du em qualquer fase | Review de sexta | Cortar escopo na ordem: RF-12 → RF-10 → RF-07 → RF-04 | Protege G5 |

**Escopo de corte (nunca cortar):** RF-01, RF-02, RF-03, RF-05, RF-06, RF-08, RF-09, RF-11. São o núcleo do MVP.

---

## 9. Ritual de acompanhamento

| Quando | O quê | Saída |
| --- | --- | --- |
| Segunda, 30 min | Planejamento da semana e revisão do caminho crítico | Lista de tarefas da semana |
| Sexta, 30 min | Review: o que fechou, o que travou, desvio em du, partituras recebidas | Atualização do cronograma |
| Fim de cada fase | Demo de 15 min + checklist do portão | Portão assinado ou replanejamento |

**Regra de replanejamento:** desvio acumulado > 3 du em uma fase dispara corte de escopo (ordem da seção 8) ou consumo da reserva — nunca as duas coisas ao mesmo tempo.

**Definição de pronto por portão:** checklist 100% marcado, artefato versionado no repositório e demo executada ao vivo.

---

## 10. Fora deste cronograma (backlog pós-MVP)

Backlog priorizado na tarefa 5.5 (04/11/2026). P1 é o que mais aparece para quem usa ou o que protege
o que já funciona; P3 só entra com pedido ou amostra.

| Prioridade | Item | Por quê | Depende de |
| --- | --- | --- | --- |
| P1 | Textos (bloco `TEXT`) e dinâmicas (`0x50`) | são os avisos que as partituras reais mais mostram | amostras controladas com MusicXML |
| P1 | Versionar o roteiro de navegador da 4.4 e da 4.5 como teste ponta a ponta | os três bugs da Fase 4 só apareceram no navegador; os roteiros ficaram fora do repositório | escolher a ferramenta (Playwright) e o CI |
| P1 | Verificar no Safari | única célula pendente do RNF-04 | acesso a macOS (ADR 0004) |
| P2 | Lacunas da seção 8 do formato: vozes 3 e 4, quiálteras além de 3:2, três partes, sol oitavada abaixo | partituras maiores que o acervo atual | amostras controladas |
| P2 | Teste com leitor de tela real (NVDA no Windows) | o checklist da 4.5 conferiu a semântica, não a fala | — |
| P2 | Web Worker para o parse | só se o gatilho do ADR 0003 disparar | medição |
| P3 | Nome da parte ou instrumento | hoje sai "Parte 1"; o campo do `TK00` não está comprovado | amostras |
| P3 | Versões do Encore além de `0xC4` (`0xC2`, `0xA6`, magic `SCO5`) | nenhuma amostra recebida até agora | amostras de outra versão |
| P3 | App React Native reaproveitando `src/enc`, `src/music` e `src/musicxml` | o núcleo já não depende de DOM (RNF-05) | decisão de produto |

Itens do PRD declarados como não-objetivo, mantidos aqui para não virarem pressão silenciosa sobre as datas:

- Reprodução MIDI/áudio e exportação (PDF, MIDI, MusicXML).
- Edição de partitura e conversão em lote.
- Layout fiel ao Encore.
- Percussão avançada, tablatura, letras, cifras e articulações sofisticadas.
- Suporte a versões do Encore além de `0xC4` (`0xC2`, `0xA6`, magic `SCO5`).
- Internacionalização além de pt-BR.

## 11. Retrospectiva do MVP (tarefa 5.5, 04/11/2026)

**O que funcionou.** Exportar o MusicXML de cada amostra pelo próprio Encore e usar como gabarito fez o
formato ser comprovado, não adivinhado: 38 de 38 amostras conferem, e o parser de produto nasceu
testado. Amostras controladas, um campo por arquivo, isolaram cada byte. As fases 2 a 4 fecharam
semanas antes das datas, sem cortar escopo.

**O que não funcionou tão bem.**

- Os três bugs da Fase 4 (partitura anterior redesenhada no resize, mesmo arquivo travando em
  "Desenhando…" e partitura anterior visível depois de erro) passaram pelos testes de unidade e só
  apareceram no navegador real. Os roteiros que os acharam ficaram fora do repositório: virou P1 no
  backlog.
- A régua de desempenho e compatibilidade é provisória (ADR 0004): sem notebook comum e sem Safari.
- O disco do sistema cheio interrompeu a verificação de navegadores; perfis e arquivos temporários
  passaram para outra unidade.

**Para o próximo ciclo.** Toda verificação feita no navegador vira teste versionado antes de fechar a
tarefa; toda lacuna nova do formato começa por uma amostra controlada com MusicXML.
