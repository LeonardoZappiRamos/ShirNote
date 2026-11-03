# 0004 — Adotar régua provisória de desempenho e compatibilidade

- Status: Accepted
- Data: 2026-11-02
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O RNF-03 mede a abertura de 50 compassos em até 3 s num "notebook comum", e o RNF-04 exige Chrome,
Firefox, Edge e Safari atuais. Os dois critérios dependem de uma régua que o projeto nunca definiu:
o cronograma lista "notebook de referência definido antes de 4.3" como dependência externa desde a
v1.0, e a tarefa 4.4 pressupõe acesso aos quatro navegadores.

Em 02/11/2026 a situação é:

- **Não existe notebook de referência.** A única máquina disponível é a de desenvolvimento: AMD Ryzen 7
  5700X (8 núcleos, 16 threads), 32 GB de RAM, GeForce RTX 4060, Windows 11. É bem acima de um
  "notebook comum", então medir só nela infla o resultado a favor do produto.
- **Não há acesso a macOS nem a Safari.** Chrome 156 e Edge 156 estão instalados; Firefox não está.
- As duas pendências travam o G4, cujo checklist exige a matriz dos quatro navegadores e a cronometragem
  na máquina de referência.

## Forças que guiam a decisão

- O G4 não pode ficar bloqueado esperando hardware que talvez não apareça no projeto.
- Número otimista é pior que número nenhum: a régua precisa errar para o lado conservador.
- Critério não verificado não pode ser marcado como verificado; a diferença fica explícita.
- A decisão precisa ser reversível quando houver máquina real.

## Opções consideradas

- **A — Esperar um notebook comum de verdade** antes de medir e de fechar o G4.
- **B — Usar a máquina de desenvolvimento crua** como régua.
- **C — Usar a máquina de desenvolvimento com limitação de CPU** (4× no DevTools) como aproximação de
  notebook comum, registrando os dois números.
- **D — Contratar uma Device Farm / BrowserStack** para hardware e Safari reais.

## Decisão

Escolhida a **opção C**, com declaração explícita do que fica pendente.

1. **Régua provisória de desempenho:** a máquina acima, com Chrome 156
   (`156.0.8078.74`) como navegador de medição.
2. **Cronometragem em dois modos:** bruta e com **CPU throttling de 4×** no DevTools. O critério
   "50 compassos ≤ 3 s" é avaliado no modo limitado, que é a aproximação de notebook comum; o número
   bruto vai junto, para comparação futura.
3. **Compatibilidade:** Chrome, Edge e Firefox medidos nesta máquina; o Firefox entra via `winget`
   quando a tarefa 4.4 rodar. **Safari não é verificável aqui** e a linha dele fica marcada como
   pendente no G4 — nunca como aprovada.
4. **Aproximação de engine:** se o WebKit do Playwright rodar nesta máquina, ele é usado como teste de
   fumaça do motor, em pasta temporária e fora do repositório. Isso **não** fecha o critério: Safari é
   mais que o motor, e a diferença fica registrada.
5. **Revisão:** aparecendo notebook comum ou acesso a macOS, a régua é refeita e registrada em novo ADR
   (este não é editado).

## Consequências positivas

- O G4 anda sem hardware externo e sem orçamento novo.
- O número limitado a 4× protege contra a conclusão otimista que a máquina de desenvolvimento induziria.
- A pendência de Safari fica visível no portão em vez de virar uma linha marcada por engano.
- Quando houver máquina real, a comparação já tem dois números para referência.

## Consequências negativas

- A régua é sintética: 4× de limitação não reproduz memória, disco, GPU nem o motor de um notebook real.
- O critério do RNF-04 fica cumprido em 3 de 4 navegadores.
- Medir duas vezes (bruto e limitado) custa mais tempo na tarefa 4.3.

## Consequências neutras / a monitorar

- Versões dos navegadores no dia da medição, registradas junto ao resultado.
- Diferença entre o número bruto e o limitado: se for pequena, o gargalo é o OSMD e não a máquina.
- Custo de instalar o Firefox na máquina de desenvolvimento.

### Confirmação

- Task 4.3 registra data, versões e os dois tempos (bruto e 4×) para a partitura de 50 compassos.
- Task 4.4 preenche a matriz com Chrome, Edge e Firefox; a célula do Safari diz "pendente — sem macOS".
- O checklist do G4 é assinado com essas duas ressalvas escritas.

## Análise das opções

### A — Esperar notebook comum (não escolhida)

- Bom, porque daria o número exato que o PRD pede.
- Ruim, porque bloqueia o G4 por tempo indeterminado e não há previsão de aquisição.

### B — Máquina de desenvolvimento crua (não escolhida)

- Bom, porque é imediata e simples.
- Ruim, porque um Ryzen 7 com 32 GB não representa "notebook comum" e o critério perderia o sentido.

### C — Máquina com 4× de limitação (escolhida)

- Bom, porque aproxima o pior caso sem esperar hardware e mantém o número bruto para comparar.
- Ruim, porque a limitação só mexe em CPU, que é justamente o recurso do OSMD — e deixa de fora
  memória, GPU e disco.

### D — Device Farm (não escolhida)

- Bom, porque resolveria Safari e hardware real de uma vez.
- Ruim, porque exige acesso e orçamento que o projeto não tem hoje.

## Mais informações

- `docs/PRD — Visualizador Web de Partituras Encore (.enc).md`, RNF-03 e RNF-04.
- `docs/CRONOGRAMA — Visualizador Web de Partituras Encore (.enc).md` v2.2, tarefas 4.3 e 4.4 e portão G4.
- Máquina medida em 02/11/2026: Windows 11 (build 10.0.26300), Ryzen 7 5700X, 32 GB, RTX 4060.
