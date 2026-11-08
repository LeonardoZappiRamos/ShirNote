# Amostras controladas — `controle-*.enc`

Arquivos gerados **de propósito** no Encore para isolar um campo por vez. Diferente de `../samples/`,
aqui não há obra de terceiros: são partituras de teste criadas por nós.

## Como gerar

1. Abra o Encore e crie **uma partitura nova** com o mínimo de configuração: uma parte, uma pauta, 4/4,
   sem armadura, sem texto, sem título.
2. Faça **apenas** a alteração pedida e salve com o nome ASCII indicado.
3. Exporte também o **MusicXML** do mesmo arquivo para `../reference/`, com o mesmo nome-base e
   extensão `.xml`. Sem ele, o resultado só pode ser comprovado por coerência interna. Com ele, o
   arquivo entra sozinho na comparação de `src/enc/container.test.ts`.
4. Anote no catálogo a versão do Encore e o sistema operacional usados.

A lista dos próximos arquivos está na seção 9 de [`docs/enc-format.md`](../../../docs/enc-format.md).

## Catálogo

| Arquivo                                      | Conteúdo lido no arquivo                                         | Pautas | MusicXML | Comprova                               |
| -------------------------------------------- | ---------------------------------------------------------------- | ------ | -------- | -------------------------------------- |
| `controle-01-vazio.enc`                      | 1 compasso vazio, 4/4                                            | 2      | sim      | compasso sem eventos                   |
| `controle-02-c4-seminima.enc`                | C4 semínima                                                      | 2      | sim      | evento de nota                         |
| `controle-03-d4-seminima.enc`                | D4 semínima                                                      | 2      | sim      | `y` e altura                           |
| `controle-04-c4-minima.enc`                  | C4 mínima                                                        | 2      | sim      | figura e duração                       |
| `controle-05-cs4-seminima.enc`               | C♯4 semínima                                                     | 2      | sim      | alteração vem da altura, com `y` igual |
| `controle-06-c4-colcheia.enc`                | C4 colcheia                                                      | 2      | sim      | figura e duração                       |
| `controle-07-3por4.enc`                      | 1 compasso vazio, 3/4                                            | 2      | sim      | fórmula de compasso                    |
| `controle-08-clave-de-fa.enc`                | 3 compassos vazios, clave de fá                                  | 1      | sim      | código da clave                        |
| `controle-09-clave-fa-dois-sustenidos.enc`   | como o 08, com 2♯ e troca para sem acidentes no compasso 2       | 1      | sim      | código da armadura e evento `0x20`     |
| `controle-10-clave-fa-notas-simultaneas.enc` | como o 09, com B2+D3 e B2+E3 no compasso 1                       | 1      | sim      | clave de fá e flag de acorde           |
| `controle-11-duas-partes.enc`                | 2 partes vazias                                                  | 2      | sim      | `TK00` por parte; parte como pauta     |
| `controle-12-b3-colcheia.enc`                | B3 colcheia                                                      | 1      | sim      | `y` negativo                           |
| `controle-13-bemoi.enc`                      | 7 compassos em 4♭, uma colcheia em cada                          | 1      | sim      | armadura com bemol                     |
| `controle-14-sustenidos.enc`                 | 7 compassos em 6♯, uma colcheia em cada, barra dupla             | 1      | sim      | código de 6♯ e barra dupla             |
| `controle-15-claves.enc`                     | sol, fá, dó na 3ª linha e sol oitavada, trocadas no meio         | 1      | sim      | claves e evento de troca de clave      |
| `controle-16-duas-pautas.enc`                | piano, 15 compassos, uma nota em cada pauta                      | 2      | sim      | pauta do evento                        |
| `controle-17-duas-partes.enc`                | 2 partes, 2 compassos, uma nota por parte em cada                | 2      | sim      | nota em segunda parte                  |
| `controle-18-duas-vozes.enc`                 | voz 1 em semínimas e voz 2 em colcheias                          | 1      | sim      | voz                                    |
| `controle-19-mudancas.enc`                   | 5 compassos; troca para 5♯ e 3/4 no compasso 2, sem nova linha   | 1      | sim      | troca de armadura e de fórmula         |
| `controle-20-quialtera.enc`                  | como o 15, com tercinas de semínima e de colcheia                | 1      | sim      | quiáltera                              |
| `controle-21-autor.enc`                      | como o 20, com título e autor                                    | 1      | sim      | autor                                  |
| `controle-22-clave-tenor.enc`                | 1 compasso; 3 notas em sol, troca para dó na 4ª linha e C5       | 1      | sim      | código `03`                            |
| `controle-23-armaduras.enc`                  | 7 sistemas com 1♭, 2♭, 3♭, 5♭, 7♭, 4♯ e 7♯, uma semínima em cada | 1      | sim      | códigos de armadura e evento `0x20`    |
| `controle-24-armaduras.enc`                  | 2 partes; 6♭ no compasso 1 e troca para 5♯ no compasso 2         | 2      | sim      | códigos 6♭ e 5♯; `0x20` por pauta      |

- `controle-01` a `07` têm **2 pautas** (`LINE` de 86 bytes), embora o pedido fosse uma.
- `controle-08` a `12` são cópias de `tests/fixtures/originals/Experimento/` (6, 8, 9, 10 e 11). A correspondência
  e os nomes foram deduzidos dos bytes: não há registro de como cada arquivo foi criado.
- `controle-10` deveria ter duas vozes, mas o conteúdo não bate com o pedido (C4 e E4) e as notas vieram
  como acorde. Por isso **não** comprova voz; o `controle-18` comprova.
- `controle-13` e `14` usam uma armadura só nos 7 sistemas, não uma por sistema como pedido.
- O `controle-19-mudancas.xml` e `controle-22-clave-tenor.xml` foram gravados sobre XML anterior sem
  truncar: depois do primeiro `</part>` vem o resto do arquivo antigo. O spike lê só até ali. Ao
  reexportar, apague o `.xml` antes.
- Versão do Encore e sistema operacional: a confirmar em todos.

## Ferramentas

```bash
node scripts/enc-spike.mjs tests/fixtures/controlled/controle-20-quialtera.enc \
  --check tests/fixtures/reference/controle-20-quialtera.xml
node scripts/enc-dump.mjs tests/fixtures/controlled/controle-02-c4-seminima.enc --notes
node scripts/enc-diff.mjs tests/fixtures/controlled/controle-01-vazio.enc \
  tests/fixtures/controlled/controle-02-c4-seminima.enc --tag MEAS
```

Ao ler um diff, ignore `+38` a `+53` do cabeçalho de `MEAS`: são resíduos de memória (seção 6 de
`docs/enc-format.md`).
