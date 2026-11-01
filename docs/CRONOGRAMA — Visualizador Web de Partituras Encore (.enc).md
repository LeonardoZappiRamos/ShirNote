# Cronograma — Visualizador Web de Partituras Encore (.enc)

**Versão:** 1.0 · **Data:** 01/11/2026 · **Base:** `docs/PRD — Visualizador Web de Partituras Encore (.enc).md`
**Horizonte:** 03/11/2026 → 29/01/2027 (release do MVP) + reserva até 05/02/2027

---

## 1. Premissas de planejamento

O cronograma é dimensionado em **dias úteis (du)** e assume:

| Premissa | Valor adotado | Efeito se mudar |
| --- | --- | --- |
| Equipe de desenvolvimento | 1 pessoa full-time (TypeScript/front-end) | 2 devs comprimem F2–F4 em ~30%, mas não F1 |
| Apoio de domínio | 0,5 pessoa (música/Encore) para gerar amostras e validar | Sem esse apoio, F1 não fecha |
| Início | terça, 03/11/2026 (02/11 é feriado) | — |
| Feriados considerados | 02/11, 20/11, 25/12/2026 e 01/01/2027 | 24 e 31/12 tratados como meio período, absorvidos pela reserva |
| Acesso ao Encore | sim, para gerar amostras controladas | Sem acesso, F1 vira dependência externa bloqueante |
| Restrição legal à análise do executável | não confirmada — **questão em aberto do PRD** | Se houver, remover a tarefa 1.6 e aceitar +2 a +3 semanas em F2 |
| Escopo | exatamente o MVP do PRD (12 RF, 8 RNF) | Qualquer RF extra entra no backlog pós-MVP |

**Regra de ouro:** a Fase 1 governa todo o resto. As datas de G2 a G5 são **provisórias** até o portão G1, quando são recalculadas com o esforço real de engenharia reversa.

---

## 2. Resumo executivo

| Fase | Foco | Esforço | Início | Fim | Portão |
| --- | --- | --- | --- | --- | --- |
| **1. Descoberta do formato** | Engenharia reversa e `docs/enc-format.md` | 18 du | 03/11/2026 | 27/11/2026 | **G1** |
| **2. Núcleo de conversão** | Parser → modelo → MusicXML | 15 du | 30/11/2026 | 18/12/2026 | **G2** |
| **3. Interface e renderização** | Upload, status, OSMD, zoom | 12 du | 21/12/2026 | 07/01/2027 | **G3** |
| **4. Robustez e testes** | Fixtures, erros, desempenho, a11y | 10 du | 08/01/2027 | 21/01/2027 | **G4** |
| **5. Homologação e release** | Aceite, docs, demo | 6 du | 22/01/2027 | 29/01/2027 | **G5** |
| **Reserva** | Contingência de cronograma | 5 du | 01/02/2027 | 05/02/2027 | — |

**Total:** 61 du de execução + 5 du de reserva = 66 du (~13,2 semanas corridas).

---

## 3. Linha do tempo

| Fase / trilha | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 | W14 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **1. Descoberta do formato** | ██ | ██ | ██ | ██ | · | · | · | · | · | · | · | · | · | · |
| **2. Núcleo (parser → MusicXML)** | · | · | · | · | ██ | ██ | ██ | · | · | · | · | · | · | · |
| **3. Interface e renderização** | · | · | · | · | · | · | · | ██ | ██ | ██ | · | · | · | · |
| **4. Robustez e testes** | · | · | · | · | · | · | · | · | · | ██ | ██ | ██ | · | · |
| **5. Homologação e release** | · | · | · | · | · | · | · | · | · | · | · | · | ██ | · |
| **Reserva** | · | · | · | · | · | · | · | · | · | · | · | · | · | ██ |
| **Trilha paralela (scaffold/XML)** | · | ██ | ██ | ██ | · | · | · | · | · | · | · | · | · | · |

| Semana | Período | Semana | Período |
| --- | --- | --- | --- |
| W1 | 03–06/11 | W8 | 21–24/12 |
| W2 | 09–13/11 | W9 | 28–31/12 |
| W3 | 16–20/11 | W10 | 04–08/01 |
| W4 | 23–27/11 | W11 | 11–15/01 |
| W5 | 30/11–04/12 | W12 | 18–22/01 |
| W6 | 07–11/12 | W13 | 25–29/01 |
| W7 | 14–18/12 | W14 | 01–05/02 |

**Marcos:** G1 27/11 · G2 18/12 · G3 07/01 · G4 21/01 · G5 29/01 · Reserva 05/02.

---

## 4. Detalhamento por fase

### Fase 1 — Descoberta do formato `.enc` (18 du · 03/11 → 27/11)

Objetivo: sair de "formato desconhecido" para "formato documentado e comprovado por amostras".

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 1.1 | Coletar 10–30 amostras reais, de complexidade crescente, e catalogar versão do Encore, SO e opções de salvamento | 3 du | `tests/fixtures/` + catálogo de amostras |
| 1.2 | Gerar amostras controladas com mudanças mínimas (1 nota, 1 compasso, outra tonalidade, outra clave, 2 vozes, piano) | 4 du | Matriz de amostras isoladas |
| 1.3 | Diff hexadecimal par a par: magic bytes, cabeçalho, contadores, offsets, campos | 6 du | Tabela offset/tamanho/tipo/significado/evidência |
| 1.4 | Spike de parser de prova (script descartável) lendo cabeçalho + notas de amostras simples | 3 du | Prova de que o formato é legível |
| 1.5 | Escrever `docs/enc-format.md` v0.1 com diagramas binários | 2 du | Documento do formato |
| 1.6 | *(Condicional)* Análise do executável com Ghidra/IDA Free/Radare2 em VM | até 5 du | Mapa de rotinas de leitura |

**Portão G1 — Formato comprovado (27/11/2026)**
- [ ] `docs/enc-format.md` v0.1 cobre cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras, metadados.
- [ ] Cada campo documentado tem ao menos uma amostra que o comprova.
- [ ] O spike de parser abre ≥ 3 amostras simples sem erro.
- [ ] Magic bytes e versão identificados (ou motivo documentado da ausência).
- [ ] Decisão go/no-go registrada e **datas de G2–G5 recalculadas**.

> Este é o único portão que pode alterar o cronograma inteiro. Se G1 atrasar, tudo atrasa na mesma proporção.

---

### Fase 2 — Núcleo de conversão (15 du · 30/11 → 18/12)

Objetivo: pipeline completo fora do navegador — `.enc` → modelo neutro → MusicXML válido.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 2.1 | Scaffold do projeto (Vite + TS + Vitest + ESLint/Prettier + CI) e estrutura `src/enc`, `src/music`, `src/musicxml` | 2 du | Repositório pronto |
| 2.2 | Modelo musical neutro (partes, compassos, notas, pausas, claves, tonalidade, vozes) + testes | 3 du | `src/music` |
| 2.3 | Parser Encore: magic bytes, versão, metadados, compassos, claves, tonalidade, notas/pausas | 6 du | `src/enc` |
| 2.4 | Gerador MusicXML `score-partwise` + validação contra XSD/parser XML | 3 du | `src/musicxml` |
| 2.5 | Harness de fixtures e comparação elementar (compassos, notas, alturas, durações) | 1 du | `tests/` |

**Portão G2 — Pipeline completo (18/12/2026)**
- [ ] `.enc` → MusicXML válido via CLI/teste, sem tocar na UI.
- [ ] MusicXML abre no OSMD e em um segundo visualizador (MuseScore ou Verovio).
- [ ] Comparação elementar passando em ≥ 3 amostras simples.
- [ ] Módulos sem acoplamento (RNF-05): parser não importa MusicXML e vice-versa.

---

### Fase 3 — Interface e renderização (12 du · 21/12 → 07/01)

Objetivo: primeira partitura visível no navegador, com os estados de UX do PRD.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 3.1 | `FileUploader`: seleção, arrastar e soltar, filtro de extensão | 2 du | RF-01 |
| 3.2 | `StatusBar`: vazio, lendo, validando, convertendo, renderizando | 2 du | Estados de UX |
| 3.3 | `ScoreViewer` com OSMD, zoom e rolagem horizontal/vertical | 3 du | RF-09, RF-10 |
| 3.4 | Integração do pipeline no navegador (`ArrayBuffer`, Web Worker para não travar a UI) | 2 du | RF-02, RNF-01, RNF-03 |
| 3.5 | Modo tolerante: avisos do parser chegam à UI sem derrubar a renderização | 2 du | RF-11 |
| 3.6 | Textos em pt-BR e mensagens de erro acionáveis | 1 du | RNF-08 |

**Portão G3 — MVP navegável (07/01/2027)**
- [ ] Melodia de uma voz renderizada no navegador a partir de um `.enc` real.
- [ ] Zoom e rolagem funcionando.
- [ ] Arquivo inválido gera mensagem clara, sem recarregar a página.
- [ ] Nenhum arquivo sai do navegador (verificado na aba Network).

---

### Fase 4 — Robustez e testes (10 du · 08/01 → 21/01)

Objetivo: transformar a demo em produto que aguenta arquivo ruim e atende às métricas.

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 4.1 | Cobertura de fixtures por recurso (todo RF suportado tem `.enc` de teste) | 2 du | RNF-06 |
| 4.2 | Robustez: arquivos truncados, corrompidos, `.enc` criptografado e de outros formatos | 2 du | RNF-02, RF-03 |
| 4.3 | Desempenho: 50 compassos em ≤ 3 s + profiling | 1 du | RNF-03 |
| 4.4 | Compatibilidade Chrome, Firefox, Edge e Safari | 1 du | RNF-04 |
| 4.5 | Acessibilidade: navegação por teclado, contraste, ARIA nos estados de erro | 1 du | RNF-07 |
| 4.6 | Múltiplas partes/vozes (RF-07) e metadados título/autor (RF-04) | 2 du | RF-04, RF-07 |
| 4.7 | Arquivos de exemplo para demonstração (RF-12) | 1 du | RF-12 |

**Portão G4 — Robustez comprovada (21/01/2027)**
- [ ] 90% das amostras simples abrem sem erro; 100% de fidelidade nas suportadas.
- [ ] Zero travamentos com arquivos inválidos (teste com lote de arquivos ruins).
- [ ] Renderização de 50 compassos ≤ 3 s no notebook de referência.
- [ ] Checklist de acessibilidade e matriz dos 4 navegadores preenchidos.

---

### Fase 5 — Homologação e release (6 du · 22/01 → 29/01)

| # | Tarefa | Esforço | Saída |
| --- | --- | --- | --- |
| 5.1 | `docs/enc-format.md` v1.0 + README + diagrama de arquitetura | 1 du | Documentação final |
| 5.2 | Checklist dos 7 critérios de aceite + validação em visualizador externo | 1 du | Aceite assinado |
| 5.3 | Correções finais e polimento de mensagens | 2 du | Build candidato |
| 5.4 | Deploy estático da demo | 1 du | URL da demo |
| 5.5 | Retrospectiva e backlog pós-MVP | 1 du | Backlog priorizado |

**Portão G5 — Release do MVP (29/01/2027)**
- [ ] Os 7 critérios de aceite do PRD marcados.
- [ ] Demo no ar e acessível.
- [ ] `docs/enc-format.md` publicado e suficiente para outra pessoa dar manutenção.
- [ ] Nenhum item de prioridade Alta em aberto.

---

## 5. Mapa requisito → fase

| Requisito | Fase | Verificação |
| --- | --- | --- |
| RF-01, RF-02 | 3 | Teste manual + Network |
| RF-03 | 1 (magic bytes) e 4 (robustez) | Amostras inválidas |
| RF-04 | 2 (extração) e 4 (UI) | Fixture com título/autor |
| RF-05, RF-06 | 1 (formato), 2 (parser), 3 (render) | Comparação elementar |
| RF-07 | 4 | Amostra de piano e duas vozes |
| RF-08 | 2 | Validação XSD + 2º visualizador |
| RF-09, RF-10 | 3 | Render no navegador |
| RF-11 | 3 (UI) e 4 (cobertura) | Lote de arquivos ruins |
| RF-12 | 4 | Exemplos publicados |
| RNF-01, RNF-02 | 3 e 4 | Network + lote de corrompidos |
| RNF-03 | 4 | Cronometragem de 50 compassos |
| RNF-04 | 4 | Matriz de navegadores |
| RNF-05 | 2 | Revisão de imports entre módulos |
| RNF-06 | 1 e 4 | Fixture por recurso |
| RNF-07, RNF-08 | 3 e 4 | Checklist a11y + revisão de textos |

---

## 6. Cenários de prazo

As três hipóteses variam sobretudo no esforço da Fase 1 e no efeito dela sobre o parser.

| Cenário | Gatilho | F1 | F2 | F3 | F4 | F5 | Total | Release |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Otimista** | Formato simples, magic bytes na 1ª semana, sem análise de executável | 12 | 12 | 10 | 8 | 5 | 47 du | **11/01/2027** |
| **Base** | Formato legível com esforço moderado, 1 versão do Encore | 18 | 15 | 12 | 10 | 6 | 61 du | **29/01/2027** |
| **Pessimista** | Formato compactado/indireto, exige análise de executável e 2ª versão | 30 | 22 | 14 | 12 | 6 | 84 du | **03/03/2027** |

A reserva de 5 du (01–05/02) cobre apenas o cenário base. No pessimista, a reserva é consumida e o release escorrega para março.

---

## 7. Caminho crítico, paralelismo e dependências

**Caminho crítico:** 1.1 → 1.2 → 1.3 → 1.4 → G1 → 2.3 → 2.4 → 3.3 → 4.2 → 5.2 → G5.

| Trilha paralela | Janela | Por quê |
| --- | --- | --- |
| Scaffold + tooling + CI (2.1) | W2–W3 | Não depende do formato |
| Modelo musical neutro (2.2) | W3–W4 | Pode ser desenhado a partir do MusicXML, não do `.enc` |
| Gerador MusicXML com dados sintéticos (2.4) | W2–W4 | Permite testar OSMD antes de o parser existir |
| Rascunho dos componentes de UI (3.1, 3.2) | W4 | Independentes do parser |

> Essas frentes usam o tempo em que a Fase 1 está bloqueada esperando amostras. Elas **não encurtam o calendário de F2** — o ganho é consumido por integração, retrabalho do modelo e pela incerteza do parser. O benefício real é reduzir a chance de G2 escorregar e evitar que a Fase 2 vire a primeira vez que alguém vê o MusicXML gerado.

**Dependências externas**
- Amostras reais em mãos até o fim da W1 (1.1) — sem isso, F1 para.
- Acesso ao Encore para amostras controladas (1.2) — premissa do PRD.
- Parecer sobre análise de executável antes da W3 (1.6).
- Notebook de referência definido antes de 4.3.

---

## 8. Riscos de cronograma e gatilhos de ação

| Risco | Sinal de alerta | Ação imediata | Impacto |
| --- | --- | --- | --- |
| Magic bytes não identificados | Fim da W2 sem hipótese de cabeçalho | Acionar 1.6 (Ghidra em VM) na W3 | +5 a +10 du |
| Formato varia por versão do Encore | Diferenças estruturais entre amostras do mesmo tipo | Congelar suporte em 1 versão e documentar as demais | +5 du |
| Menos de 10 amostras reais | Fim da W1 com acervo incompleto | Bloquear F1 e escalar; não iniciar F2 "no escuro" | Bloqueante |
| OSMD não renderiza o MusicXML gerado | G2 falha na abertura | Spike de 3 du com Verovio como renderizador alternativo | +5 du |
| Análise de executável proibida juridicamente | Parecer negativo | Remover 1.6 e aceitar parser mais lento por tentativa e erro | +10 a +15 du |
| Atraso > 3 du em qualquer fase | Review de sexta | Cortar escopo na ordem: RF-12 → RF-10 → RF-07 → RF-04 | Protege G5 |

**Escopo de corte (nunca cortar):** RF-01, RF-02, RF-03, RF-05, RF-06, RF-08, RF-09, RF-11. São o núcleo do MVP.

---

## 9. Ritual de acompanhamento

| Quando | O quê | Saída |
| --- | --- | --- |
| Segunda, 30 min | Planejamento da semana e revisão do caminho crítico | Lista de tarefas da semana |
| Sexta, 30 min | Review: o que fechou, o que travou, desvio em du | Atualização do cronograma |
| Fim de cada fase | Demo de 15 min + checklist do portão | Portão assinado ou replanejamento |
| G1 | Recalcular G2–G5 com o esforço real medido | Cronograma v2.0 |

**Regra de replanejamento:** desvio acumulado > 3 du em uma fase dispara corte de escopo (ordem da seção 8) ou consumo da reserva — nunca as duas coisas ao mesmo tempo.

**Definição de pronto por portão:** checklist 100% marcado, artefato versionado no repositório e demo executada ao vivo.

---

## 10. Fora deste cronograma (backlog pós-MVP)

Itens do PRD declarados como não-objetivo, mantidos aqui para não virarem pressão silenciosa sobre as datas:

- Reprodução MIDI/áudio e exportação (PDF, MIDI, MusicXML).
- Edição de partitura e conversão em lote.
- Layout fiel ao Encore.
- Percussão avançada, tablatura, letras, cifras e articulações sofisticadas.
- Suporte a múltiplas versões do Encore além da versão de referência.
- Internacionalização além de pt-BR.
