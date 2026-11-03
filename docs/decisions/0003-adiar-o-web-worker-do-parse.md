# 0003 — Adiar o Web Worker do parse e medir antes de mover

- Status: Accepted
- Data: 2026-11-02
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

A tarefa 3.4 do cronograma pede o pipeline no navegador com **Web Worker** para não travar a interface
(RF-02, RNF-01, RNF-03). A implementação atual (`App.tsx`) lê o arquivo como `ArrayBuffer` e chama
`parseEncore` na thread principal, com um comentário assumindo o desvio.

Três fatos mudam o custo dessa decisão:

- **O parse é barato nas amostras.** A maior partitura real do acervo (`al-ze-flauta.enc`, 63 KB,
  417 notas) leva **2,26 ms de mediana** e 5,09 ms no pior caso para parse + geração do MusicXML,
  medidos em 20 execuções no Node 24 (mesmo código do navegador, sem o OSMD). A `justica-flauta2`,
  que a interface usa como referência, fica em 0,75 ms de mediana.
- **O gargalo visível é o OSMD, não o parser.** Renderizar a partitura no SVG domina o tempo de
  abertura; mover 2 ms para um worker não muda a percepção.
- **O RNF-03 não tem régua.** O “notebook de referência” que o cronograma exige (pré-requisito da
  tarefa 4.3) ainda não foi definido, então não há orçamento de tempo declarado para comparar.

## Forças que guiam a decisão

- Não pagar complexidade (worker, protocolo de mensagem, transferência de `ArrayBuffer`, estado de
  carregamento assíncrono) sem ganho medível.
- Manter o núcleo reaproveitável no React Native, onde Worker tem outra API.
- Não deixar o desvio invisível: quem retomar o projeto precisa saber por que a tarefa está aberta e
  quando ela volta.
- Cumprir RNF-03 de verdade quando houver uma máquina de referência.

## Opções consideradas

- **A — Implementar o Web Worker agora.**
- **B — Manter na thread principal, com medição registrada e gatilho de revisão.**
- **C — Worker só acima de um limite de tamanho** (híbrido), lendo o arquivo na thread principal.

## Decisão

Escolhida a **opção B**.

1. A tarefa 3.4 fica **parcial por decisão**, não por esquecimento: o pipeline roda no navegador, sem
   upload, e o parse continua na thread principal.
2. **Gatilho de revisão**, qualquer um dos três: uma partitura real passar de **100 ms** de
   parse + MusicXML; aparecer arquivo acima de **1 MB**; ou alguém relatar travamento perceptível ao
   abrir.
3. Quando o gatilho disparar, a opção A é a primeira tentativa. O núcleo já está pronto para isso:
   `parseEncore` recebe `Uint8Array` e devolve objetos simples, `generateMusicXml` devolve `string`, e
   nenhum dos dois toca em DOM. O worker vira um adaptador, sem mudança no parser.
4. A medição passa a ser feita com `performance.now()` em volta do parse e da geração, registrada na
   review; o ADR 0003 é reaberto se o número sair do orçamento.

## Consequências positivas

- Nenhuma complexidade nova numa área que a interface nem sente.
- O desvio fica documentado com número, não com “parece rápido”.
- O núcleo sem DOM continua evitando dependência de `Worker`/`window`, o que serve ao app React Native.

## Consequências negativas

- Partitura muito maior que o acervo atual ainda pode travar a thread principal.
- A tarefa 3.4 fica aberta no cronograma, e o G4 precisa aceitar esse desvio explicitamente.
- Sem o notebook de referência do RNF-03, o limite de 100 ms é uma estimativa, não um número do PRD.

## Consequências neutras / a monitorar

- Tempo de parse + MusicXML por arquivo novo que entrar no acervo.
- Tamanho das partituras reais recebidas: o maior hoje tem 63 KB.
- Comportamento do OSMD em partituras longas, que é o custo dominante real.

### Confirmação

- Revisão de código: `src/enc` e `src/musicxml` continuam sem `Worker`, `window`, DOM ou React.
- Medição reproduzível: 20 execuções por arquivo, mediana e pior caso, com o mesmo código do produto.
- Se a opção A for executada depois, o gatilho que a motivou fica registrado em novo ADR.

## Análise das opções

### A — Web Worker agora (não escolhida)

- Bom, porque elimina de vez o risco de travar a interface.
- Ruim, porque adiciona assincronia e um segundo caminho de erro para economizar 2 ms.

### B — Thread principal com gatilho (escolhida)

- Bom, porque é proporcional à medição e mantém o núcleo simples.
- Ruim, porque a garantia do RNF-03 fica condicionada ao acervo atual.

### C — Worker por tamanho (não escolhida)

- Bom, porque protege arquivos grandes sem custo nos pequenos.
- Ruim, porque são dois caminhos de execução para manter e testar, sem amostra que exercite o outro.

## Mais informações

- `docs/CRONOGRAMA — Visualizador Web de Partituras Encore (.enc).md`, tarefa 3.4 e portão G3.
- `src/components/App.tsx`, comentário no ponto do parse que aponta para este ADR.
- Medição de 02/11/2026: `al-ze-flauta` 2,26 ms (mediana) e 5,09 ms (pior); `ana-bekoach-flauta`
  1,36 ms e 2,34 ms; `justica-flauta2` 0,75 ms e 1,67 ms; `controle-20-quialtera` 0,17 ms e 0,46 ms.
