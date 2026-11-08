# 0001 — Adotar React no web e React Native no aplicativo móvel

- Status: Accepted
- Data: 2026-11-01
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O ShirNote precisa renderizar partituras no navegador, com **todo o processamento no cliente**
(RNF-01), e o PRD prevê um **aplicativo móvel** mais adiante reaproveitando o mesmo núcleo de
leitura e conversão. O projeto tem um único desenvolvedor e a Fase 1 (engenharia reversa do `.enc`)
ainda nem terminou, então a escolha de framework precisa minimizar o custo de manter duas
plataformas e não pode contaminar as camadas de domínio com dependências de interface.

Restrições relevantes:

- O único renderizador de partitura maduro e pronto para uso é o
  [OSMD](https://opensheetmusicdisplay.org/), que é JavaScript de navegador e depende de DOM/SVG.
- O núcleo (`src/enc`, `src/music`, `src/musicxml`) manipula `Uint8Array` e tipos puros; ele
  **não deve** depender de React, DOM ou de qualquer detalhe de apresentação (RNF-05).
- A interface é em pt-BR (RNF-08) e precisa exibir erros claros sem quebrar (RF-11).
- O time precisa de uma base de testes automatizados que rode em Node, sem navegador.

## Forças que guiam a decisão

- Reaproveitar tipos, testes e regras de negócio entre web e mobile.
- Uma linguagem só (TypeScript) para reduzir troca de contexto de um time de uma pessoa.
- Ecossistema com o OSMD e bibliotecas de teste já conhecidas.
- Não acoplar o domínio à camada de apresentação.
- Poder trocar o renderizador do mobile sem reescrever o parser.
- Curva de aprendizado baixa para quem já escreve TypeScript.

## Opções consideradas

- **A — React + Vite no web, React Native no mobile, núcleo TypeScript puro compartilhado.**
- **B — Flutter para web e mobile**, com o núcleo reescrito em Dart.
- **C — Vue ou Svelte no web e React Native no mobile**, com dois frameworks de UI.
- **D — TypeScript puro com Web Components** no web e WebView no mobile.
- **E — Manter o status atual** (sem decidir, adiando o custo para a fase mobile).

## Decisão

**Opção escolhida: "A — React + Vite no web e React Native no mobile, com o núcleo em TypeScript
puro".**

O web usa React 19 + Vite, porque o OSMD é uma biblioteca de navegador com integração direta a
componentes React e porque o time já domina o modelo de componentes e hooks. O mobile usará React
Native, reaproveitando `src/enc`, `src/music` e `src/musicxml` **sem alteração**, já que essas
camadas só recebem `ArrayBuffer` e devolvem dados serializáveis. Essa separação é o que torna a
decisão reversível: se o React Native não servir para a renderização, o núcleo continua válido.

O renderizador de partitura do mobile fica **fora do escopo desta decisão**. O OSMD não roda em
React Native, então o app móvel vai precisar de uma camada de desenho própria (SVG nativo,
`react-native-svg`, ou WebView com o mesmo OSMD). Isso será decidido em um ADR separado, quando a
fase mobile começar.

**Nível de confiança:** alto para o web; médio para o mobile, porque a estratégia de renderização
do aplicativo ainda não foi escolhida.

### Consequências positivas

- Um só conjunto de tipos e regras de domínio serve web e mobile, com os mesmos testes.
- O time mantém uma linguagem e uma ferramenta de build.
- O OSMD integra direto ao React, o que encurta a Fase 3 do cronograma.
- O núcleo sem DOM pode ser testado em Node, o que mantém a suíte rápida.

### Consequências negativas

- O bundle do web carrega o OSMD e passa de 500 kB (aviso do Vite); é preciso code splitting ou
  carregamento sob demanda mais adiante.
- React Native não executa o OSMD: o app móvel exigirá um renderizador próprio, então a partitura
  **não** é reaproveitada de graça.
- Duas bases de componentes de interface (React DOM e React Native) não compartilham CSS nem
  layout; só a lógica e os tipos são comuns.
- Escolher React por causa do futuro mobile acopla a decisão do web a uma fase que ainda não
  começou.

### Consequências neutras / a monitorar

- Se o núcleo passar a importar React ou DOM por conveniência, o reuso no mobile morre: vale
  verificar isso no lint/revisão.
- O tamanho do bundle deve ser reavaliado quando a UI estabilizar.
- A escolha do renderizador mobile pode tornar parte desta decisão obsoleta; nesse caso, um novo
  ADR a supersede.

### Confirmação

- `src/enc`, `src/music` e `src/musicxml` continuam sem qualquer import de `react`, `react-dom` ou
  de APIs de DOM.
- A suíte roda em Node (`vitest`), sem navegador, cobrindo o núcleo.
- Ao criar o app móvel, os três diretórios são copiados sem alteração de código.

---

## Análise das opções

### A — React + React Native com núcleo TypeScript puro (escolhida)

- **Bom:** reaproveitamento real de domínio, testes e tipos; um só idioma; OSMD pronto para o web.
- **Bom:** permite adiar a decisão do renderizador mobile sem travar o web.
- **Ruim:** duas camadas visuais distintas e bundle grande por causa do OSMD.

### B — Flutter para web e mobile

- **Bom:** uma única base de UI para as duas plataformas, com desempenho previsível.
- **Ruim:** o núcleo teria de ser reescrito em Dart, e não existe um renderizador de partitura
  maduro equivalente ao OSMD para Flutter.
- **Ruim:** o web em Flutter tem custo de carregamento e acessibilidade piores para um visualizador
  de documentos.

### C — Vue/Svelte no web + React Native no mobile

- **Bom:** frameworks de UI mais enxutos no web.
- **Ruim:** dois paradigmas para manter, sem ganho no reaproveitamento: o que se compartilha é o
  TypeScript do núcleo, que é independente do framework.

### D — TypeScript puro com Web Components

- **Bom:** zero dependência de framework no web.
- **Ruim:** integração com o OSMD e com o estado da aplicação exigiria escrever à mão o que React
  já resolve; o custo de UI recai todo sobre o único desenvolvedor.

### E — Manter o status atual

- **Ruim:** o scaffold já está em React; adiar só transfere o custo para a fase mobile, quando a
  troca seria mais cara.

---

## Mais informações

- [`README.md`](../../README.md) — estrutura de pastas e fluxo `ArrayBuffer → src/enc → src/music → src/musicxml → OSMD`.
- [`archive/PRD — Visualizador Web de Partituras Encore (.enc).md`](../../archive/PRD%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) — RNF-01 (processamento local) e RNF-05 (camadas desacopladas).
- [`archive/CRONOGRAMA — Visualizador Web de Partituras Encore (.enc).md`](../../archive/CRONOGRAMA%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) — fases 1 a 5.
- Supersede: —
- Supersedido por: —
