# Formato `.enc` do Encore — v0.11

**Versão:** 0.11 · **Data:** 02/11/2026
**Base:** 14 partituras reais (1.024 compassos, 2.945 notas) e 24 amostras controladas, todas com
**MusicXML de referência** exportado pelo próprio Encore · **Portão G1:** aprovado (seção 11)

Este documento separa o que está **comprovado** por amostra do que continua **hipótese**. Hipótese
não entra no parser de produto.

## 1. Amostras e método

| Item | justica | tora | alegrei |
| --- | --- | --- | --- |
| Arquivo original | `docs/amostra/A JUSTIÇA - Flauta 2.enc` | `docs/amostra/A TORÁ DE ADONAI - Sax tenor.enc` | `docs/amostra/ALEGREI-ME QUANDO ME DISSERAM (SALMO 122) - Sax Alto.enc` |
| Cópia de teste | `tests/fixtures/samples/justica-flauta2.enc` | `tora-sax-tenor.enc` | `alegrei-sax-alto.enc` |
| MusicXML de referência | `tests/fixtures/reference/justica-flauta2.xml` | `tora-sax-tenor.xml` | `alegrei-sax-alto.xml` |
| Tamanho | 39.094 B | 37.112 B | 42.198 B |
| Compassos / sistemas | 38 / 10 | 36 / 9 | 43 / 11 |
| Notas / pausas no MusicXML | 105 / 71 | 112 / 24 | 233 / 43 |
| Armadura / fórmula / clave | 1♯ / 4/4 / sol | 3♯ / 4/4 / sol | 2♯ / 4/4 / sol |

As outras 11 partituras reais, recebidas em 02/11/2026 do mesmo acervo, estão catalogadas em
[`tests/fixtures/README.md`](../tests/fixtures/README.md). Todas são `0xC4`. As amostras controladas estão catalogadas em
[`tests/fixtures/controlled/README.md`](../tests/fixtures/controlled/README.md).

O MusicXML de referência é a evidência central: `scripts/enc-spike.mjs --check` lê o `.enc` e compara
cada compasso e evento com ele. O teste `src/enc/container.test.ts` roda essa comparação no CI para
toda amostra com referência de mesmo nome-base.

As exportações de 02/11/2026 vieram em **UTF-16LE** (declarado no cabeçalho XML); as anteriores, em
UTF-8. O spike aceita as duas. O Encore também passa para a segunda pauta sem `<backup>`, então a
posição de cada evento na referência é contada por pauta.

## 2. Resultado

O arquivo é um cabeçalho `SCOW`, um registro `TK00` por parte e uma cadeia de blocos
`tag + uint32 + payload`. Não há compressão nem criptografia. Cada compasso é um cabeçalho fixo mais
uma lista de eventos de tamanho próprio, terminada em `FF FF`.

**Comprovado contra o MusicXML do Encore, sem nenhuma divergência:** 1.024/1.024 compassos,
2.945/2.945 notas (tick, nome, oitava, alteração, figura, ponto, acorde e ligadura), 460/460 pausas
(tick, figura e ponto), armadura, fórmula (inclusive 6/8), clave, título, barras de repetição, barra
final e casas de repetição nas 14 partituras reais. Duas diferenças são do exportador do Encore, não
da leitura (seção 7). Nas 24 controladas, mais 88 compassos e 141 notas, que acrescentam todas as
armaduras de 7♭ a 7♯, troca de armadura e de fórmula no meio do sistema, claves de dó na 3ª e na 4ª
linha e sol oitavada, troca de clave no meio da partitura, segunda pauta, segunda parte, voz 2,
quiálteras 3:2, barra dupla e autor.

**Ainda sem amostra ou sem referência:** vozes 3 a 8, quiálteras além de 3:2, mais de duas partes e a
versão do formato (seção 8).

## 3. Layout

```
0x00    SCOW   cabeçalho (seção 4)
0xC2    TK00   0x86E bytes × número de partes
0xC2 + partes × 0x86E
        PAGE
        LINE   × sistemas
        MEAS   × compassos
        PREC  TITL  TEXT  FONT  COLR  DRUM  WINI
EOF     a cadeia fecha exatamente no fim do arquivo
```

Cada bloco:

```
tag      4 bytes ASCII maiúsculos
tamanho  uint32 little-endian
payload  `tamanho` bytes (em MEAS: 54 + `tamanho`)
```

Inteiros são little-endian, e textos são UTF-16LE terminados em zero.

## 4. Cabeçalho `SCOW` e registros `TK00`

| Offset | Tipo | Campo | Situação | Evidência |
| --- | --- | --- | --- | --- |
| `0x00` | 4 B | magic `SCOW` | comprovado | todas as amostras |
| `0x04` | uint32 | sempre 196 (`0xC4`) | hipótese: versão do formato | um único valor observado; o Enc2MusicXML trata `0xC4` como Encore 5.0.2 e lê também `0xC2` e `0xA6` (seção 8) |
| `0x28` | uint16 | sempre `0x0420` | desconhecido | um único valor observado |
| `0x2C` | uint16 | ticks por semínima, 240 | comprovado | `<divisions>` nas 3 referências |
| `0x2E` | uint16 | sistemas | comprovado | igual ao número de `LINE` em todas as amostras |
| `0x32` | uint8 | partes | comprovado | 1 em todas; 2 em `controle-11`, com 2 `TK00` |
| `0x33` | uint8 | pautas por sistema | comprovado | igual às entradas de pauta em `LINE` |
| `0x34` | uint16 | compassos | comprovado | igual ao número de `MEAS` em todas as amostras |

`TK00` tem `0x86E` bytes contando a própria tag e guarda o índice da parte em `+6` (uint16). Isso
explica por que a cadeia começa em `0x930` com uma parte (`0xC2 + 0x86E`) e em `0x119E` com duas. O
conteúdo restante de `TK00` não foi interpretado.

Parte dos bytes que variam entre arquivos parece ponteiro de memória, sem relação com música
(hipótese; ex.: `0x40`, `0x80` e `LINE +22`). Não os use.

## 5. Blocos

### 5.1 `PAGE`

26 bytes. Contém a contagem de sistemas da página em `+2` e `+12` (uint32), confirmada em 3/3
partituras reais. A semântica com várias páginas não tem amostra.

### 5.2 `LINE` — sistema

`26 + 30 × pautas` bytes: 56 com uma pauta e 86 com duas.

| Offset | Tipo | Campo | Situação |
| --- | --- | --- | --- |
| `+12` | uint32 | compassos no sistema | comprovado: a soma dá o total em todas as amostras |
| `+26` | 30 B | uma entrada por pauta | comprovado |

Entrada de pauta:

| Offset | Campo | Valores comprovados |
| --- | --- | --- |
| `+0` | sempre `02` | desconhecido |
| `+1` | clave | `00` = sol, `01` = fá, `02` = dó na 3ª linha, `03` = dó na 4ª linha, `04` = sol oitavada acima |
| `+2` | armadura | `00` = sem acidentes, `01`–`05` e `07` = 1–5♭ e 7♭, `08`–`0B`, `0D`, `0E` = 1–4♯, 6♯ e 7♯ |
| `+3` | contador de pautas na partitura | sequencial |

- **Clave:** sol e fá conferem com `controle-08`, `controle-15` e as referências reais; dó na 3ª linha
  e sol oitavada, com `controle-15` e `controle-20`; dó na 4ª linha, com `controle-22` (troca `0x10`
  para `03` e nota C5 com `y = 15`). `+1` é a clave em vigor no início do sistema; a troca dentro do
  sistema vem do evento `0x10` (seção 7).
- **Armadura:** a regra `01`–`07` = 1–7♭ e `08`–`0E` = 1–7♯ confere com 4♭ (`controle-13`), 6♯
  (`controle-14`), 2♯ (`controle-09`), 1♭, 2♭, 3♭, 5♭, 7♭, 4♯ e 7♯ (`controle-23`, um sistema por
  armadura) e 6♭ e 5♯ (`controle-24`). Todos os códigos têm amostra. A troca dentro do sistema vem do
  evento `0x20` (seção 7).
- **Identificador da pauta (`+8`):** repete-se no `+4` de cada evento da pauta (seção 7). Valores
  medidos: `00` na primeira pauta, `40` na segunda pauta da mesma parte (`controle-16`) e `01` na
  primeira pauta da segunda parte (`controle-17`, `controle-24`). Hipótese: pauta na parte nos bits
  6–7 e parte nos bits 0–5; o Enc2MusicXML usa `+4 & 0x3F` como parte.

### 5.3 `TITL` — textos

21.242 bytes em todas as amostras.

| Offset | Campo | Situação |
| --- | --- | --- |
| `+32` | título | comprovado: igual a `<work-title>` em 3/3 e em `controle-21` |
| `+1088` | primeiro texto livre | observado: nome do instrumento em 3/3 |
| `+6368` | autor | comprovado: igual a `<creator type="composer">` em `controle-21` |

Os textos caem em `+32 + 1056 × n`: `n = 0` título, `1` texto livre, `6` autor. Os outros campos não
têm amostra.

### 5.4 Demais blocos

| Bloco | Conteúdo observado | Uso |
| --- | --- | --- |
| `PREC` | configuração de impressão do Windows (`Microsoft Print to PDF`, DEVMODE) | ignorar |
| `TEXT` | tamanho variável; hipótese: textos dos eventos `0x50` de 86 bytes | ignorar no MVP |
| `FONT`, `COLR` | fontes e paleta | ignorar |
| `DRUM` | vazio | ignorar |
| `WINI` | hipótese: estado da janela | ignorar |

## 6. `MEAS` — compasso

```
+0   cabeçalho, 54 bytes fixos
+54  eventos, `tamanho` bytes, incluindo o terminador FF FF
```

O tamanho declarado conta só a lista de eventos. Por isso um compasso vazio declara 2 bytes: somente
o terminador. Percorrer os eventos pelo tamanho de cada um cai exatamente no terminador e no fim do
bloco em **141/141** compassos.

| Offset | Tipo | Campo | Situação |
| --- | --- | --- | --- |
| `+0` | uint32 | constante por arquivo (107, 116, 100) | hipótese: andamento |
| `+4` | uint16 | ticks por semínima, 240 | comprovado |
| `+6` | uint16 | duração do compasso em ticks | comprovado: 960 em 4/4, 720 em 3/4 |
| `+8` | uint8 | numerador da fórmula, em todo compasso | comprovado: `controle-07`, referências e troca para 3/4 no meio do sistema em `controle-19`, sem evento próprio |
| `+9` | uint8 | denominador da fórmula | comprovado |
| `+12` | uint8 | barra inicial: `02` = início de repetição | comprovado |
| `+13` | uint8 | barra final: `04` = fim de repetição, `05` = barra final, `06` = barra dupla | comprovado (`06`: `controle-14`) |
| `+14` | uint8 | `C0` quando há casa de repetição | comprovado (2 ocorrências) |
| `+15` | uint8 | número da casa | comprovado (2 ocorrências) |
| `+38` | 16 B | lixo de memória | ver abaixo |

**Lixo de memória:** `+38` a `+53` costuma trazer resíduos, como os textos UTF-16 `ata\Loca`,
`in\Encor` e `ograma`. Esses bytes geram ruído no `enc-diff`, não têm significado musical e podem
carregar **fragmentos de caminhos locais** de quem salvou o arquivo. Não os exiba nem os interprete.

## 7. Eventos

```
+0  uint16  tick no compasso (FFFF = fim da lista)
+2  uint8   tipo
+3  uint8   tamanho total do evento, contando o tick
```

Offsets abaixo contam a partir do tick. O `+0` das versões anteriores deste documento equivale ao
`+2` atual.

| Tipo | Tamanho | Significado | Situação |
| --- | --- | --- | --- |
| `0x90`–`0x97` | 28 | nota; nibble baixo = voz − 1 | comprovado para voz 1 e 2 (`controle-18`) |
| `0x80` | 18 | pausa | comprovado |
| `0x10` | 16 | troca de clave, código de `LINE +1` em `+5` | comprovado (`controle-15`, `controle-20`) |
| `0x30` | 18 | desenho da curva de uma ligadura de valor; a ligadura em si vem das flags da nota | comprovado: 289 eventos e 289 `<tie type="start">` nas 14 partituras reais, uma a uma por arquivo. O acervo não tem ligadura de expressão (`<slur>`), que segue sem amostra |
| `0x40`, `0x41` | 14 + 16n | barra de colcheia; nibble baixo = voz − 1; vai do tick do evento ao tick em `+20`; `n` em `+5` conta as entradas de 16 B a partir de `+14`, e as seguintes à primeira são barras secundárias, por posição `x` | comprovado (grupo principal): confere com `<beam number="1">` nas 38 amostras; só na nota principal do acorde. Barras secundárias: hipótese |
| `0x50` | 16 | símbolo, código em `+5` | hipótese forte: 13 em justica (segno/coda), 1 em alegrei (dinâmica) |
| `0x50` | 86 | texto | hipótese forte: 2 em tora, 1 em alegrei, como as `<words>` |
| `0x20` | 14 | troca de armadura, código de `LINE +2` em `+5` e o anterior em `+10` | comprovado (`controle-09`, `controle-10`, `controle-23`) |

**Troca de clave:** vale a partir do seu tick, inclusive para eventos do mesmo tick gravados antes dela
na lista (`controle-20`, compasso 3: C4 só sai certo com a clave nova). O MusicXML do Encore, nesse
caso, exporta a clave depois da nota.

**Voz:** em `controle-18`, a voz 2 vem como `0x91` e o feixe dela como `0x41`. A voz 2 traz `+6 = 10`.
Pausa em voz 2 não tem amostra; o spike aplica a mesma regra.

**Pauta:** o `+4` do evento é igual ao `+8` da entrada de `LINE` da pauta onde ele está (seção 5).
Em `controle-16` (piano), as notas da pauta inferior vêm como `0x94` com `+4 = 40` e são lidas com a
clave de fá da segunda entrada; `0x94` é a voz 5, como o Encore exporta a pauta 2. Confere com o
MusicXML: 15 compassos, 30 notas.

**Partes:** cada parte ocupa as pautas seguintes do mesmo sistema. Em `controle-17` e `controle-24`, as
notas da parte 2 trazem `+4 = 01`, voz 1, e conferem com a parte `P2` do MusicXML. A troca de armadura
`0x20` vem uma vez por pauta, cada uma com o seu `+4`.

### 7.1 Nota (`0x90`)

| Offset | Tipo | Campo |
| --- | --- | --- |
| `+0` | uint16 | tick |
| `+2` | 2 B | `9v 1C`, `v` = voz − 1 |
| `+4` | uint8 | pauta: igual a `LINE +8` da pauta (seção 5) |
| `+5` | uint8 | figura (7.3) |
| `+6` | uint8 | flags |
| `+10` | uint16 | posição horizontal (layout) |
| `+12` | int8 | `y`, posição na pauta |
| `+13` | uint8 | quiáltera: nibble alto = notas tocadas, baixo = normais; `00` = nenhuma |
| `+15` | uint8 | altura MIDI |
| `+16` | uint16 | duração tocada |
| `+18` | 2 B | `50 40` |

Flags:

| Bit | Significado | Evidência |
| --- | --- | --- |
| `0x01` | início de ligadura | 450/450 |
| `0x02` | fim de ligadura | 450/450; os dois juntos também ocorrem |
| `0x40` | nota de acorde: soa com a nota anterior | 450/450 |
| `0x10` | hipótese: nota em grupo de feixe | toda nota com `<beam>` tem o bit, mas o inverso não vale |
| `0x80` | desconhecido | |

**Altura.** `y` dá a nota escrita, e a altura MIDI dá a alteração:

```
base       = 28 (C4) sol; 16 (E2) fá; 22 (D3) dó na 3ª linha; 20 (B2) dó na 4ª linha;
             35 (C5) sol oitavada acima
diatonico  = base + y
grau       = diatonico mod 7      (C D E F G A B)
oitava     = floor(diatonico / 7)
natural    = [0 2 4 5 7 9 11][grau] + (oitava + 1) × 12
alteracao  = altura − natural
```

`y` tem sinal: em `controle-12`, B3 traz `FF` (−1). O campo depende da clave: `y = 0` fica seis graus
abaixo da linha central da pauta, então a base é a nota da linha central menos 6.

**Quiáltera:** `+13 = 32` é tercina (3:2) em 13/13 notas de `controle-20`, tanto de semínima quanto de
colcheia. A duração tocada é a nominal × 2/3 × fator. Pausa em quiáltera não tem amostra.

**Armadilhas de leitura:**

- Percorra os eventos pelo tamanho. Procurar `50 40` no compasso gera falsos positivos.
- `+14` e `+21` variam e não foram decodificados. `controle-05` (C♯4) traz `+21 = 01`, compatível com
  acidente visível, mas isso não é necessário: a alteração vem de `altura`.

### 7.2 Pausa (`0x80`)

| Offset | Tipo | Campo |
| --- | --- | --- |
| `+0` | uint16 | tick |
| `+2` | 2 B | `80 12` |
| `+5` | uint8 | figura (7.3) |
| `+10` | uint16 | posição horizontal |
| `+16` | uint16 | duração nominal |

Um compasso **sem nenhum evento** é pausa de compasso inteiro implícita (justica, compasso 34). Em
alegrei, os compassos 26 e 34 trazem pausa com figura `0x20` e 1.920 ticks em 4/4. O MusicXML do Encore
os exporta como `breve`, o que excede o compasso; o modelo musical não tem esse valor ainda (Fase 2).

### 7.3 Figura e duração

| Figura | Nominal (ticks) | Comprovada |
| --- | --- | --- |
| `0x20` breve | 1.920 | só em pausa |
| `1` semibreve | 960 | sim |
| `2` mínima | 480 | sim |
| `3` semínima | 240 | sim |
| `4` colcheia | 120 | sim |
| `5` semicolcheia | 60 | sim |
| `6`, `7` (fusa, semifusa) | 30, 15 | extrapolação |

**A duração da nota é a tocada, não a escrita.** Ela é a nominal multiplicada por um fator de execução:
0,8 em justica e 0,9 em tora, alegrei e nas controladas. Isso explica por que a semínima parecia valer
192 ou 216. A duração da pausa é a nominal.

O ponto não tem bit: é deduzido de `duração / nominal / fator` (1 = sem ponto, 1,5 = um ponto,
1,75 = dois pontos). O fator é a razão mais frequente do arquivo; na pausa, o fator é 1. O ponto duplo
não tem amostra. Onde o fator fica gravado é desconhecido.

**Diferenças do exportador MusicXML do Encore.** O spike segue o `.enc`; o leitor de referência
corrige estes dois casos antes de comparar:

- **Pausa pontuada sem `<dot/>`:** em 54 pausas (ANA BEKOACH, 6/8, e A VONTADE DO PAI), o `.enc` grava
  duração de 1,5 × a figura, e o MusicXML mantém essa duração (`360` com `quarter`), mas omite o
  `<dot/>`. Musicalmente é pausa pontuada. A pausa de compasso inteiro vem sem `<type>` e fica de fora.
- **Grafia da nota que termina uma ligadura:** em ANA BEKOACH - Trombone (compassos 61 e 69), um C♯4
  ligado por cima da barra sai como D♭4 na continuação. No `.enc`, as duas notas têm o mesmo `y` e a
  mesma altura; só a primeira tem acidente visível (`+21`). O exportador grafa a continuação pela
  armadura (1♭), o que produz uma ligadura C♯–D♭.

**Não use a duração para posicionar eventos.** A posição vem do tick.

## 8. O que continua desconhecido

Afeta o MVP (RF-05, RF-06, RF-07):

1. Vozes 3, 4, 6 a 8, e voz em pausa.
2. Claves além de sol, fá, dó na 3ª e 4ª linha e sol oitavada acima (o Enc2MusicXML lista sol e fá
   oitavadas abaixo, percussão e tablatura).
3. Quiálteras além de 3:2.
4. Terceira parte em diante e segunda pauta de uma segunda parte (regra de `+4` extrapolada).

Não afeta o MVP: significado do evento `0x50`; codificação da ligadura de expressão (sem amostra); barras secundárias de `0x40`; bytes `+14`, `+21` da nota;
restante de `TK00` e do cabeçalho; `0x04`; versão do Encore.

**Versão:** não há como comprovar o campo com uma versão só (seção 4). Falta uma amostra salva em outra
versão, ou em versão conhecida. O [Enc2MusicXML](https://github.com/lvinken/Enc2MusicXML) (GPL-3.0)
lê `0x04` como versão: `0xC4` (Encore 5.0.2), `0xC2` e `0xA6`, este com outro espaçamento de eventos.
Também aceita o magic `SCO5`, em big-endian. É pista, não evidência: vale como hipótese até termos
amostra.

## 9. Próximos experimentos

Salvar cada um no Encore em `tests/fixtures/controlled/` e exportar também o MusicXML para
`tests/fixtures/reference/` com o mesmo nome-base. O MusicXML é o que torna o resultado comprovável.

Os experimentos 13 a 24 e os MusicXML de 09, 10, 11 e 16 foram gerados em 02/11/2026; o resultado
está nas seções 5 a 7. Todos conferem com a referência.

Os `controle-19-mudancas.xml` e `controle-22-clave-tenor.xml` foram gravados sobre XML anterior sem
truncar: depois do primeiro `</part>` vem o resto do arquivo antigo. O spike lê só até ali; para
limpar, apague o `.xml` antes de reexportar.

Nenhum experimento pendente decide o MVP. Os próximos, se forem úteis, cobrem a seção 8: vozes 3 e 4,
pausa em voz 2, quiáltera 5:4, sol oitavada abaixo, três partes, uma segunda parte com duas pautas
e ligadura de expressão entre notas diferentes.

## 10. Como reproduzir

```bash
# compara o .enc com o MusicXML do Encore, compasso a compasso
node scripts/enc-spike.mjs tests/fixtures/samples/alegrei-sax-alto.enc \
  --check tests/fixtures/reference/alegrei-sax-alto.xml

# resumo de uma amostra sem referência
node scripts/enc-spike.mjs tests/fixtures/controlled/controle-10-clave-fa-notas-simultaneas.enc

# cadeia de blocos e notas
node scripts/enc-dump.mjs tests/fixtures/samples/justica-flauta2.enc --chunks
node scripts/enc-dump.mjs tests/fixtures/samples/justica-flauta2.enc --notes

# comparação bloco a bloco entre duas amostras controladas
node scripts/enc-diff.mjs tests/fixtures/controlled/controle-02-c4-seminima.enc \
  tests/fixtures/controlled/controle-04-c4-minima.enc --tag MEAS

# testes, incluindo a comparação com as referências
npx vitest run src/enc/container.test.ts
```

## 11. Status do portão G1

| Critério | Situação |
| --- | --- |
| Documento cobre cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras e metadados | **sim, com lacunas declaradas** (seção 8) |
| Cada campo documentado tem amostra que o comprova | **sim** para os marcados como comprovados; o resto está marcado como hipótese |
| Spike abre ≥ 3 amostras simples sem erro | **sim**: 14 partituras reais e as 24 controladas conferem com a referência |
| Magic bytes e versão identificados, ou motivo da ausência | **sim**: magic `SCOW`; versão só tem candidato (`0x04` = `0xC4`), porque só há um valor observado |
| Decisão go/no-go registrada e datas recalculadas | **sim**: GO em 02/11/2026 ([ADR 0002](decisions/0002-aprovar-portao-g1-e-iniciar-fase-2.md)); cronograma v2.0 |

Fora do portão, mas na Fase 1:

- **Tarefa 1.1 concluída:** 14 partituras reais do mesmo acervo, todas `0xC4`, com MusicXML e direito
  de uso aprovado (o acervo é liberado para o projeto, que será open source). A condição do ADR 0002
  está cumprida pelo spike; no G2, o parser de produto precisa repetir o resultado.
- **Tarefa 1.2 parcial:** experimentos 13 a 24 gerados, todos com MusicXML e conferidos.
- **Tarefa 1.6 não acionada:** a análise do executável não foi necessária, e a questão legal segue
  aberta.

**Decisão: GO**, com as condições do ADR 0002: Encore `0xC4` como versão de referência, RF-07 na
Fase 2 e pelo menos 10 partituras reais até o G2. As datas estão no cronograma v2.0: G2 24/11/2026,
G3 10/12/2026, G4 28/12/2026, G5 06/01/2027.
