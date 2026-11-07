# 0005 — Adotar Expo e WebView com OSMD no aplicativo móvel

- Status: Accepted
- Data: 2026-11-04
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O [ADR 0001](0001-adotar-react-e-react-native.md) escolheu React Native para o aplicativo móvel,
mas deixou explicitamente **fora do escopo** o renderizador de partitura: o OSMD depende de DOM/SVG e
não roda em React Native. Com o pivô para um app mobile-first (PRD do app móvel, seção 8), essa é a
primeira decisão que precisa ser fechada, porque ela define o custo de toda a interface.

O produto precisa de:

- biblioteca, leitura, edição e exportação **offline** (RNFM-01);
- renderização fiel do MusicXML que o núcleo já gera;
- um caminho viável para PDF paginado (RFM-08);
- distribuição na Play Store com compra in-app (RFM-14);
- um único desenvolvedor mantendo o produto.

O OSMD é a única biblioteca madura de engravação que o projeto já validou em 38 amostras, e é
**BSD-3-Clause**, então pode ir num app pago.

## Forças que guiam a decisão

- Reaproveitar o máximo do MVP web e do núcleo puro.
- Não reescrever a engravação da partitura.
- Ter interface nativa para a biblioteca e o editor, não um site embrulhado.
- Manter o núcleo (`src/enc`, `src/music`, `src/musicxml`) sem React Native, DOM ou plataforma.
- Conseguir gerar PDF e imprimir sem servidor.
- Não criar duas bases de código de domínio.

## Opções consideradas

- **A — Expo + React Native com a partitura numa WebView que carrega o OSMD.**
- **B — React Native com renderizador próprio em `react-native-svg`** (ou porte do OSMD/VexFlow).
- **C — Capacitor, empacotando o app web atual como aplicativo nativo.**
- **D — PWA/TWA**, sem app nativo de verdade.

## Decisão

**Opção escolhida: A — Expo + React Native, com o OSMD dentro de uma WebView.**

1. O app usa **Expo (SDK 58) + React Native + TypeScript**, Android primeiro (API 29+). A biblioteca,
   as telas, o editor de metadados, a compra e a sincronização são React Native nativo.
2. A partitura é desenhada numa **WebView** (`react-native-webview`) que carrega um HTML único com o
   OSMD empacotado no aplicativo. Nada é buscado na rede.
3. O HTML do visualizador é um build separado (`apps/mobile/viewer`) e entra como **asset** do app.
   A comunicação com o React Native é uma **ponte de mensagens tipada**:
   - app → visualizador: `load` (MusicXML + opções), `export-pages` (layout A4), `zoom`;
   - visualizador → app: `ready`, `rendered`, `error`, `pages` (um SVG por página).
4. O **PDF** é montado no app a partir dos SVGs de página devolvidos pelo visualizador e gerado com
   `expo-print`; a impressão usa o serviço do Android (RFM-08, RFM-10).
5. O núcleo é compartilhado **sem cópia**: `apps/mobile` importa `src/enc`, `src/music` e
   `src/musicxml` por caminho relativo, e o Metro é configurado com `watchFolders` na raiz do
   repositório e `disableHierarchicalLookup`.
6. O app não ganha um renderizador alternativo na v1. Se a WebView não atingir a régua de desempenho
   no G7, um novo ADR decide entre renderização incremental e renderizador nativo.

**Nível de confiança:** alto para a arquitetura; médio para o desempenho em tablet Android médio,
que só será medido no G7.

### Consequências positivas

- O MVP web e o app móvel compartilham o mesmo núcleo testado em Node.
- O OSMD continua sendo o renderizador, sem reescrever a engravação.
- A interface nativa permite biblioteca, gestos, compra e sincronização com a experiência esperada.
- O PDF sai do mesmo layout que o usuário vê, sem servidor.
- O app funciona offline: o visualizador é um asset local.

### Consequências negativas

- Existem dois ambientes na mesma tela (React Native + WebView) e uma ponte para manter.
- O bundle do visualizador carrega o OSMD e aumenta o tamanho do app.
- A acessibilidade da partitura dentro da WebView é limitada; o nome acessível e os controles ficam
  no React Native (RNFM-07).
- A WebView consome memória proporcional à partitura; partituras grandes exigem paginação/carregamento
  sob demanda.
- A Play Store pode questionar um app com WebView (regra 4.2); a resposta é a funcionalidade real
  offline, a edição, a exportação, a nuvem e a compra.

### Consequências neutras / a monitorar

- O build do visualizador precisa rodar antes do build do app; o CI deve falhar se o asset estiver
  desatualizado.
- O núcleo não pode importar React Native por conveniência: a checagem de camadas continua manual.
- O tempo até a primeira página desenhada é a métrica do G7 e pode mudar a decisão.

### Confirmação

- `src/enc`, `src/music` e `src/musicxml` não importam `react`, `react-dom`, `react-native`, OSMD nem
  APIs de DOM/plataforma.
- O app abre um `.enc` real e desenha a partitura sem rede.
- O visualizador só é carregado de um asset local; nenhuma URL externa é aberta para desenhar.
- O teste de fumaça no aparelho cobre abrir, transpor e exportar PDF.

---

## Análise das opções

### A — Expo + React Native + WebView com OSMD (escolhida)

- **Bom:** reaproveita o OSMD e o núcleo; interface nativa; um só domínio.
- **Bom:** o visualizador é isolado e pode ser trocado sem tocar no resto.
- **Ruim:** ponte, memória e acessibilidade da WebView; dois runtimes.

### B — Renderizador próprio em React Native

- **Bom:** uma única árvore de UI, sem WebView, com melhor integração de gestos e acessibilidade.
- **Ruim:** reescrever a engravação é um projeto à parte; nenhuma biblioteca nativa cobre o que o
  OSMD já cobre; o custo recai sobre um desenvolvedor só.

### C — Capacitor

- **Bom:** reaproveitaria 100% do app web e reduziria o tempo até a loja.
- **Ruim:** a interface continuaria web e o produto perderia a aposta em UI nativa; foi descartada
  pelo dono do produto na decisão de 04/11/2026.

### D — PWA/TWA

- **Bom:** o mais barato de publicar.
- **Ruim:** sem SQLite nativo, sem compra in-app confiável e sem iOS; não atende ao modelo pago.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — RFM-01 a RFM-18.
- [ADR 0001](0001-adotar-react-e-react-native.md) — decisão de React Native, com o renderizador adiado.
- [ADR 0006](0006-adotar-sqlite-e-musicxml-como-formato-da-biblioteca.md) — persistência local.
- Supersede: —
- Supersedido por: —
