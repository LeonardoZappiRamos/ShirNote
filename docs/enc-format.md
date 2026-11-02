# Formato `.enc` do Encore — v0.2

**Versão:** 0.2 (descoberta em andamento) · **Data:** 01/11/2026
**Base:** 3 amostras reais, 117 compassos · **Portão G1:** não atingido (ver seção 11)

Este documento registra o que foi **provado** por comparação binária e o que continua **hipótese**.
Nada aqui deve ser tratado como especificação até ter ao menos uma amostra que comprove o campo.

## 1. Amostras e método

| Item | justica | tora | alegrei |
| --- | --- | --- | --- |
| Arquivo original | `docs/amostra/A JUSTIÇA - Flauta 2.enc` | `docs/amostra/A TORÁ DE ADONAI - Sax tenor.enc` | `docs/amostra/ALEGREI-ME QUANDO ME DISSERAM (SALMO 122) - Sax Alto.enc` |
| Cópia de teste | `tests/fixtures/samples/justica-flauta2.enc` | `tora-sax-tenor.enc` | `alegrei-sax-alto.enc` |
| Tamanho | 39.094 B (`0x98B6`) | 37.112 B (`0x90F8`) | 42.198 B (`0xA4D6`) |
| Compassos (`MEAS`) | 38 | 36 | 43 |
| Sistemas (`LINE`) | 10 | 9 | 11 |
| Parte (texto em `TITL`) | `Flauta C 02` | `Sax tenor Bb` | `Sax alto Eb` |
| Título (texto em `TITL`) | `A2 - A JUSTIÇA (BASE BÍBLICA DE 2007)` | `A TORÁ DE ADONAI` | `ALEGREI-ME QUANDO ME D. (SALMO 122)` |

Ferramenta: `scripts/enc-dump.mjs` (hexadecimal, strings, tags candidatas e reconstrução de blocos).
As três amostras são de obras distintas; nenhuma foi produzida em ambiente controlado.

```bash
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --chunks
node scripts/enc-dump.mjs "tests/fixtures/samples/tora-sax-tenor.enc" --tags --length 37112
node scripts/enc-dump.mjs "tests/fixtures/samples/alegrei-sax-alto.enc" --offset 0 --length 320
```

## 2. Resultado em uma frase

O arquivo é um **contêiner de blocos com tag ASCII de 4 letras e tamanho `uint32` little-endian**,
precedido por um cabeçalho `SCOW`; não há compressão nem criptografia, e os textos são UTF-16LE.

Nas três amostras a cadeia de blocos começa **sempre em `0x930`**, com `PAGE`, e fecha **exatamente
no fim do arquivo**. É a evidência mais forte de que o enquadramento está correto.

O conteúdo musical ainda **não está decodificado**. A seção 6 registra a primeira hipótese
consistente para o registro de nota (`50 40`), com evidências e com o que falta para confirmá-la.

## 3. Enquadramento dos blocos

```
tag      : 4 bytes ASCII maiúsculos (ex.: "MEAS")
tamanho  : uint32 little-endian, bytes do payload
payload  : `tamanho` bytes
```

Exceção medida: **cada `MEAS` é seguido por um bloco fixo de 54 bytes**, fora do `tamanho`
declarado. A regra foi verificada nas **117 ocorrências das 3 amostras**: todas têm exatamente 54
bytes entre o fim do payload e a próxima tag, e os últimos dois bytes desse bloco são sempre
`FF FF`. Sem essa regra a cadeia não fecha no EOF em nenhum dos três arquivos.

Com essa regra, a cadeia de `justica-flauta2.enc` é:

| # | Tag | Offset | Tamanho | Fim | Observação |
| --- | --- | --- | --- | --- | --- |
| 1 | `PAGE` | `0x930` | 26 | `0x952` | |
| 2–11 | `LINE` ×10 | `0x952` … | 56 cada | `0xBD2` | um por sistema |
| 12–49 | `MEAS` ×38 | `0xBD2` … | 2–554 | `0x2C02` | +54 bytes de bloco fixo cada |
| 50 | `PREC` | `0x2C02` | 5.420 | `0x4136` | configuração de impressão |
| 51 | `TITL` | `0x4136` | 21.242 | `0x9438` | metadados de texto |
| 52 | `TEXT` | `0x9438` | 8 | `0x9448` | payload todo zero |
| 53 | `FONT` | `0x9448` | 918 | `0x97E6` | fonte “Arial” |
| 54 | `COLR` | `0x97E6` | 142 | `0x987C` | paleta + “Times New Roman” |
| 55 | `DRUM` | `0x987C` | 0 | `0x9884` | bloco vazio |
| 56 | `WINI` | `0x9884` | 42 | `0x98B6` | estado de janela (hipótese) |

Contagem por arquivo:

| Arquivo | Blocos | `LINE` | `MEAS` | Primeiro `MEAS` | Primeiro bloco | EOF |
| --- | --- | --- | --- | --- | --- | --- |
| justica | 56 | 10 | 38 | `0xBD2` | `0x930` | `0x98B6` |
| tora | 53 | 9 | 36 | `0xB92` | `0x930` | `0x90F8` |
| alegrei | 62 | 11 | 43 | `0xC12` | `0x930` | `0xA4D6` |

O primeiro bloco reconhecido começa em `0x930` nos três arquivos; os 2.352 bytes anteriores são o
cabeçalho e uma área reservada (seção 4).

### 3.1 Anomalia: `MEAS` de 2 bytes em justica

O compasso 34 (índice 33, offset `0x261E`) declara **2 bytes** de payload; todos os outros 116
compassos das três amostras declaram entre 20 e 554 bytes. Mesmo assim a cadeia fecha: com o bloco
fixo de 54 bytes, o próximo `MEAS` cai exatamente em `0x265E`.

O conteúdo de `payload + bloco fixo` (56 bytes) é igual ao de um compasso vazio normal, exceto pelo
tamanho declarado:

```
0x2626  6B 00 00 00 F0 00 C0 03 04 04 00 00 00 00 00 00 99 00 00 00 C5 00 00 00 C8 ...
```

Ou seja: o prefixo de 11 bytes que aparece em **todos** os compassos está intacto, mas o campo de
tamanho diz 2. Não é possível decidir, com as amostras atuais, se é (a) um defeito de gravação do
Encore, (b) um registro especial (compasso de “sistema”/“quebra”) ou (c) um campo de tamanho com
outro significado nesse caso. O leitor do contêiner **não deve rejeitar** o arquivo; deve apenas
sinalizar o compasso anômalo para a camada de validação.

## 4. Cabeçalho `SCOW`

```
00000000  53 43 4F 57 C4 00 00 00 00 00 00 00 00 00 00 00 |SCOW............|
00000010  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 |................|
00000020  00 00 00 00 00 00 00 00 20 04 21 00 F0 00 0A 00 |........ .!.....|
00000030  01 00 01 01 26 00 00 00 00 00 00 01 00 01 04 EE |....&...........|
00000040  98 0B A9 00 20 00 00 00 00 00 28 00 00 00 00 00 |.... .....(.....|
00000050  00 00 04 00 00 00 01 00 00 00 00 00 00 00 00 00 |................|
00000060  A8 E9 AA 00 00 00 00 00 0C 00 00 00 00 00 00 00 |................|
```

| Campo | Offset | Bytes | Situação |
| --- | --- | --- | --- |
| Magic | `0x00` | `53 43 4F 57` = “SCOW” | **comprovado** (constante nas 3 amostras) |
| `uint32` após o magic | `0x04` | `C4 00 00 00` = 196 nas 3 amostras | **não interpretado**; não é o tamanho do cabeçalho (a área vai até `0x930`) |
| Área estruturada | `0x28`–`0x6B` | contadores/valores | **não interpretado** |
| `uint16` | `0x8C` | `C0 03` = 960 nas 3 amostras | **hipótese**: resolução temporal (divisões por compasso/semínima) |
| Área zerada | `0x6C`–`0x907` | zeros | reservada |
| Valores tipo paleta | `0x908`–`0x91D` | `20 20 20 … 40 40 40 40 40 40 40 40` | **hipótese**: cinzas da interface |
| `TK00` | `0xC2` | `54 4B 30 30` + `6E 08 00 00` | **não interpretado**; o valor `0x086E` (2.158) não casa com nenhum limite de bloco |

Os cabeçalhos das três amostras são **idênticos exceto por ~40 bytes** (offsets `0x2A`, `0x2E`,
`0x34`, `0x40`–`0x42`, `0x60`–`0x68`, `0x80`–`0x86`, `0x91`–`0x9A`, `0xA6`, `0xAC`–`0xC0`), o que
reforça que o layout é fixo e que esses campos carregam dados da sessão/arquivo (não música).

Nenhum campo do cabeçalho tem, por enquanto, significado comprovado além do magic. Não usar estes
bytes no parser.

## 5. Blocos conhecidos

### 5.1 `PAGE` e `LINE` — paginação

`PAGE` tem **26 bytes nas três amostras**. Os valores observados são `0A 00 00 00` repetidos,
compatíveis com contagens (hipótese).

`LINE` tem **56 bytes nas três amostras** e sua quantidade é exatamente o número de sistemas
(10/9/11). O payload contém:

- posições verticais crescentes de ~64 em ~64 (`0x28`, `0x62`, `0xA2`, `0xE2`, …), compatíveis com
  a posição de cada sistema na página (hipótese);
- um índice sequencial em `+10` (`04`, `08`, `0C`, … = 4 × sistema);
- quatro valores `uint16` de coordenadas em `+40`–`+47`;
- a cauda fixa `FC F8 F4 F0 EC E8 E4 E0`, oito valores que decrescem de 4 em 4 — compatíveis com
  deslocamentos de linhas de pauta (hipótese).

A estrutura de `LINE` ainda não foi decodificada campo a campo; só o tamanho é comprovado.

### 5.2 `MEAS` — compasso

- Um bloco por compasso, na ordem do arquivo.
- `tamanho` varia de **20 a 554 bytes** (exceto a anomalia de 2 bytes da seção 3.1): cresce com a
  quantidade de eventos do compasso.
- Os compassos de 20 bytes têm **zero** ocorrências do marcador de nota da seção 6 e são os
  candidatos naturais a compasso vazio (hipótese forte, ainda sem amostra controlada).
- O payload começa com um **prefixo de 11 bytes** idêntico em **117/117 compassos**:

```
+0   uint32  constante por arquivo (justica 107 = 0x6B, tora 116 = 0x74, alegrei 100 = 0x64)
+4   F0 00   uint16 240
+6   C0 03   uint16 960  (mesmo valor do cabeçalho em 0x8C)
+8   04 04   hipótese: fórmula de compasso 4/4
+10  00
```

- O byte em `+11` é **não nulo exatamente no primeiro compasso de cada sistema** nas três amostras
  (30 inícios de sistema, valores `0x42`, `0x2A`, `0x45`, `0x3F`, `0x36`, `0x30`). Há duas exceções
  com valor `0x06` que **não** iniciam sistema (tora #29, alegrei #5), provavelmente outro
  significado (marcação/texto). A correlação é forte, mas a regra ainda não está confirmada.
- O bloco fixo de 54 bytes termina sempre em `FF FF` e **não é preenchimento**: o conteúdo varia
  entre compassos e frequentemente continua o registro iniciado no payload (por exemplo, um
  `99 00 00 00` cortado pelo fim do payload). O significado é desconhecido.
- A codificação de notas é tratada como hipótese na seção 6.

### 5.3 `PREC` — configuração de impressão

**5.420 bytes nas três amostras**, sem relação com música. Contém, em UTF-16LE:

- `Microsoft Print to PDF`
- GUID `{084F01FA-E634-4D77-83EE-074817C03581}`
- `DocumentUserPassword`, `DocumentOwnerPassword`, `DocumentCryptSecurity`
- `PaperSize`, `Orientation`, `PORTRAIT`, `Resolution`, `ResOption1`, `ColorMode`, `Color`, `V4DM`

É compatível com um blob **DEVMODE** do Windows (impressora, papel, resolução, cor) e pode ser
ignorado pelo parser.

### 5.4 `TITL` — metadados de texto

**21.242 bytes nas três amostras**, quase todo zero, com textos em UTF-16LE. É onde estão o título
e o nome da parte — não em `MEAS`:

| Amostra | Texto | Offset |
| --- | --- | --- |
| justica | `A2 - A JUSTIÇA (BASE BÍBLICA DE 2007)` | `0x415E` |
| justica | `Flauta C 02` | `0x4DBE` |
| tora | `A TORÁ DE ADONAI` | `0x3A7C` |
| tora | `Sax tenor Bb` | `0x3E9C` |
| alegrei | `ALEGREI-ME QUANDO ME D. (SALMO 122)` | `0x4E6C` |
| alegrei | `Sax alto Eb` | `0x528C` |

O tamanho fixo e a distribuição esparsa sugerem uma **área de tamanho fixo para textos e estilos**,
não uma lista compacta (hipótese).

### 5.5 `TEXT`, `FONT`, `COLR`, `DRUM`, `WINI`

| Bloco | justica | tora | alegrei | Conteúdo observado |
| --- | --- | --- | --- | --- |
| `TEXT` | 8 | 66 | 48 | varia; `TEXT` da justica é todo zero |
| `FONT` | 918 | 640 | 640 | fonte `Arial` em UTF-16LE em justica |
| `COLR` | 142 | 142 | 142 | paleta (`FF FF FF`, `C0 C0 C0`, `7F 7F 7F`, `FF 00 FF`, `00 FF FF`, …) + `Times New Roman` |
| `DRUM` | 0 | 0 | 0 | bloco vazio |
| `WINI` | 42 | 42 | 42 | valores como `05 00 00 00` e coordenadas — compatível com estado de janela/zoom (hipótese) |

`TEXT` e `FONT` têm tamanho variável; `COLR`, `DRUM` e `WINI` têm tamanho fixo nas três amostras.

## 6. Hipótese do registro de nota (`50 40`)

**Status: hipótese. Não usar no parser até uma amostra controlada confirmar.**

Dentro de `MEAS` (payload + bloco fixo) o par de bytes `50 40` aparece 110 vezes em justica, 112 em
tora e 233 em alegrei. Os compassos de 20 bytes têm **zero** ocorrências; todos os outros têm uma
ou mais. Isso é consistente com `50 40` marcando uma nota.

Os **8 bytes imediatamente antes** de cada `50 40` têm uma forma estável:

```
-8   uint16  x        posição horizontal (cresce dentro do compasso)
-6   uint16  y        posição diatônica na pauta (ex.: 1 = D4, 3 = F4, 4 = G4, 8 = D5)
-4   uint8   0        (zero em 109/110, 111/112 e 223/233 ocorrências)
-3   uint8   pitch    altura cromática compatível com MIDI (62–83 nas três amostras)
-2   uint16  duração  valores múltiplos de uma unidade por arquivo (ver abaixo)
```

Evidências a favor:

1. `y` e `pitch` são coerentes entre si e com a armadura: o mesmo `y` aparece com `pitch` vizinho
   (acidente), e a diferença de `y` acompanha a diferença de altura.
2. As sequências extraídas formam melodias plausíveis. Exemplos:
   - justica #12: `F#4 D4 G4 A4 B4 D5 E5 D5`
   - tora #5: `D5 C#5 B4 C#5 D5 F#5`
   - alegrei #2: `C#5 B4 A#4 B4 B4 B4 C#5 D5`
3. A faixa de alturas (D4–B5) é compatível com partes escritas de flauta e sax.
4. O campo de duração só assume valores com proporções exatas de figuras musicais:

| Amostra | unidade | valores observados | proporções |
| --- | --- | --- | --- |
| justica | 48 | 48, 96, 192, 288, 384, 768 | 1, 2, 4, 6, 8, 16 |
| tora | 108 | 108, 216, 432, 648, 864 | 1, 2, 4, 6, 8 |
| alegrei | 54 | 54, 108, 216, 324, 432, 648, 864 | 1, 2, 3, 4, 6, 8, 12, 16 |

As proporções 1, 2, 3, 4, 6, 8, 12 e 16 são exatamente as relações entre semicolcheia, colcheia,
colcheia pontuada, semínima, semínima pontuada, mínima, mínima pontuada e semibreve (ou entre
colcheia, semínima, … semibreve, conforme a unidade). A **unidade absoluta** (48/108/54) muda de
arquivo para arquivo e ainda não foi explicada.

O que **não** fecha e impede tratar isso como decodificado:

- Em alegrei há pares de notas com **o mesmo `x`** (ex.: compasso 7, 16 notas em 8 pares). Pode ser
  duas vozes no mesmo pentagrama, acordes, ou um erro de alinhamento do nosso recorte.
- Em 11 ocorrências o byte em `-4` não é zero (25 ou 29), o que sugere que o registro muda de forma
  em acordes/vozes múltiplas.
- A soma das durações por compasso **não fecha em 4/4** em vários compassos (ex.: justica #0 soma
  672 com unidade 48). Pode haver pausas não registradas, múltiplas vozes, ou o campo não ser
  duração.
- `50 40` pode ser um bitfield comum que coincide com notas; só uma amostra controlada elimina a
  dúvida.

Experimento decisivo: uma amostra com **uma única nota** de altura e figura conhecidas; depois uma
com duas notas de figuras diferentes; depois duas vozes explícitas. Comparar os 8 bytes antes de
`50 40` em cada caso.

## 7. Inventário de tags

Contagem e primeiras ocorrências (`--tags`):

| Tag | justica | tora | alegrei |
| --- | --- | --- | --- |
| `MEAS` | 38 | 36 | 43 |
| `LINE` | 10 | 9 | 11 |
| `PAGE` | 1 | 1 | 1 |
| `PREC` | 1 | 1 | 1 |
| `TITL` | 1 | 1 | 1 |
| `TEXT` | 1 | 1 | 1 |
| `FONT` | 1 | 1 | 1 |
| `COLR` | 1 | 1 | 1 |
| `DRUM` | 1 | 1 | 1 |
| `WINI` | 1 | 1 | 1 |

`TK00` aparece uma vez em cada arquivo (`0xC2`), dentro do cabeçalho, e ainda não é compreendido.

## 8. O que continua desconhecido

1. Significado dos campos do cabeçalho `SCOW` (inclusive o `uint32` 196, o `uint16` 960 em `0x8C` e
   o `TK00`).
2. Semântica do bloco fixo de 54 bytes de cada compasso.
3. Confirmação da codificação de **notas**: altura, oitava, acidente, duração, ligadura, voz.
4. Codificação de **clave, tonalidade e fórmula de compasso** dentro de `MEAS` (ou em `LINE`).
5. Onde ficam **pausas**, articulações, dinâmica e letras.
6. Se múltiplas partes geram múltiplos fluxos de `MEAS`, ou um bloco por parte.
7. Por que a unidade de duração muda por arquivo (48, 108, 54).
8. Se existe campo de **versão do Encore** e onde.
9. Como `LINE` relaciona sistemas a compassos (o índice em `+10` sugere 4 compassos por sistema,
   mas tora tem um sistema de 3 compassos).

## 9. Próximos experimentos (amostras controladas)

A ordem abaixo isola um campo por vez. Cada arquivo deve ser gerado no Encore com o mínimo de
diferença em relação ao anterior, e comparado com `--chunks` mais um diff hexadecimal par a par.
Nomear os arquivos como `controle-*.enc` e registrar no catálogo de `tests/fixtures/`.

| # | Experimento | O que deve mudar | Campo isolado |
| --- | --- | --- | --- |
| 1 | Partitura vazia (1 compasso, sem notas) | `MEAS` mínimo | cabeçalho de compasso |
| 2 | 1 nota C4 semínima, 4/4 | `MEAS` com 1 evento | registro de nota |
| 3 | 1 nota D4 semínima | idem ao 2 | altura |
| 4 | 1 nota C4 mínima | idem ao 2 | duração |
| 5 | 1 nota C#4 semínima | idem ao 2 | acidente |
| 6 | 1 nota C4 colcheia | idem ao 2 | unidade de duração |
| 7 | 1 compasso 3/4 | `LINE`/`MEAS` | fórmula de compasso |
| 8 | Clave de fá | `LINE`/`MEAS` | clave |
| 9 | Tonalidade com 2 sustenidos | `LINE`/`MEAS` | armadura |
| 10 | Duas vozes no mesmo compasso | `MEAS` maior | voz |
| 11 | Duas partes (piano) | novo fluxo de `MEAS` ou novo bloco | partes |

**Atalho de alto valor:** se o Encore instalado conseguir exportar **MusicXML** de uma das três
amostras reais, esse arquivo vira a “verdade de referência” para casar cada nota (altura, figura,
posição) com o registro binário correspondente. Vale mais que várias amostras controladas, porque
traz centenas de notas rotuladas de uma vez.

Sem os itens 1–6, o parser do MVP (RF-05, RF-06) não pode começar: são eles que revelam o registro
de nota, que é o coração do formato.

## 10. Como reproduzir

```bash
# cadeia de blocos completa
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --chunks

# inventário de tags
node scripts/enc-dump.mjs "tests/fixtures/samples/tora-sax-tenor.enc" --tags --length 37112

# cabeçalho
node scripts/enc-dump.mjs "tests/fixtures/samples/alegrei-sax-alto.enc" --offset 0 --length 320

# anomalia do compasso de 2 bytes
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --offset 0x261E --length 64

# testes do contêiner
npx vitest run src/enc/container.test.ts
```

## 11. Status do portão G1

| Critério do G1 | Situação |
| --- | --- |
| `docs/enc-format.md` cobre cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras, metadados | **não** — contêiner, metadados e uma hipótese de nota; claves e armaduras não |
| Cada campo documentado tem ao menos uma amostra que o comprova | parcial — 3 amostras; campos marcados como hipótese |
| Spike de parser abre ≥ 3 amostras simples sem erro | **não** — só o leitor de contêiner abre as 3 amostras |
| Magic bytes e versão identificados | magic sim (`SCOW`); versão não |
| Decisão go/no-go registrada e datas recalculadas | pendente |

**Conclusão:** o contêiner está resolvido o suficiente para escrever um leitor de blocos e já foi
validado em três arquivos reais, inclusive com uma anomalia de tamanho. O conteúdo musical continua
bloqueado. O próximo passo é coletar as amostras controladas da seção 9 (ou uma exportação MusicXML
de referência) antes de escrever o parser de notas.
