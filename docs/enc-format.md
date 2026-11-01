# Formato `.enc` do Encore — v0.1

**Versão:** 0.1 (descoberta em andamento) · **Data:** 01/11/2026
**Base:** 1 amostra real · **Portão G1:** não atingido (ver seção 10)

Este documento registra o que foi **provado** por comparação binária e o que continua **hipótese**.
Nada aqui deve ser tratado como especificação até ter ao menos uma amostra que comprove o campo.

## 1. Amostra e método

| Item | Valor |
| --- | --- |
| Arquivo original | `docs/amostra/A JUSTIÇA - Flauta 2.enc` |
| Cópia de teste | `tests/fixtures/samples/justica-flauta2.enc` |
| Tamanho | 39.094 bytes (`0x98B6`) |
| Conteúdo | 1 parte (“Flauta C 02”), 38 compassos, 10 sistemas, 1 página |
| Origem | acervo do projeto; direitos de uso a confirmar |

Ferramenta: `scripts/enc-dump.mjs` (hexadecimal, strings, tags candidatas e reconstrução de blocos).

```bash
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --chunks
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --tags --length 39094
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --offset 0 --length 320
```

## 2. Resultado em uma frase

O arquivo é um **contêiner de blocos com tag ASCII de 4 letras e tamanho `uint32` little-endian**,
precedido por um cabeçalho `SCOW`; não há compressão nem criptografia, e os textos são UTF-16LE.

A cadeia de blocos reconstruída a partir de `PAGE` (offset `0x930`) fecha **exatamente** no fim do
arquivo (`0x98B6`), o que é a evidência mais forte de que o enquadramento está correto.

## 3. Enquadramento dos blocos

```
tag      : 4 bytes ASCII maiúsculos (ex.: "MEAS")
tamanho  : uint32 little-endian, bytes do payload
payload  : `tamanho` bytes
```

Exceção medida: **cada `MEAS` é seguido por um trailer fixo de 54 bytes**, fora do `tamanho`
declarado. A regra foi verificada nas 38 ocorrências da amostra: todas têm exatamente 54 bytes
entre o fim do payload e a próxima tag, e a cadeia só fecha exatamente no EOF com essa regra.

Com essa regra, a cadeia completa do arquivo é:

| # | Tag | Offset | Tamanho | Fim | Observação |
| --- | --- | --- | --- | --- | --- |
| 1 | `PAGE` | `0x930` | 26 | `0x952` | |
| 2–11 | `LINE` ×10 | `0x952` … | 56 cada | `0xBD2` | |
| 12–49 | `MEAS` ×38 | `0xBD2` … | 20–278 | `0x2C02` | +54 bytes de trailer cada |
| 50 | `PREC` | `0x2C02` | 5.420 | `0x4136` | configuração de impressão |
| 51 | `TITL` | `0x4136` | 21.242 | `0x9438` | metadados de texto |
| 52 | `TEXT` | `0x9438` | 8 | `0x9448` | payload todo zero |
| 53 | `FONT` | `0x9448` | 918 | `0x97E6` | fonte “Arial” |
| 54 | `COLR` | `0x97E6` | 142 | `0x987C` | paleta + “Times New Roman” |
| 55 | `DRUM` | `0x987C` | 0 | `0x9884` | bloco vazio |
| 56 | `WINI` | `0x9884` | 42 | `0x98B6` | estado de janela (hipótese) |

Total: 56 blocos. O primeiro bloco reconhecido começa em `0x930`; os 2.352 bytes anteriores são o
cabeçalho e uma área reservada (seção 4).

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
| Magic | `0x00` | `53 43 4F 57` = “SCOW” | **comprovado** (constante em toda abertura plausível) |
| `uint32` após o magic | `0x04` | `C4 00 00 00` = 196 | **não interpretado**; não é o tamanho do cabeçalho (a área vai até `0x930`) |
| Área estruturada | `0x28`–`0x6B` | contadores/valores | **não interpretado** |
| Área zerada | `0x6C`–`0x907` | zeros | reservada |
| Valores tipo paleta | `0x908`–`0x91D` | `20 20 20 … 40 40 40 40 40 40 40 40` | **hipótese**: cinzas da interface |
| `TK00` | `0xC2` | `54 4B 30 30` + `6E 08 00 00` | **não interpretado**; o valor `0x086E` (2.158) não casa com nenhum limite de bloco |

Nenhum campo do cabeçalho tem, por enquanto, significado comprovado além do magic. Não usar estes
bytes no parser.

## 5. Blocos conhecidos

### 5.1 `PAGE` e `LINE` — paginação

`PAGE` (26 bytes) deve concentrar tamanho/margens da página; os valores observados são
`0A 00 00 00` repetidos, compatíveis com contagens (hipótese).

`LINE` tem sempre 56 bytes nesta amostra. O segundo byte do payload cresce de 64 em 64 entre as 10
ocorrências (`0x20`, `0x62`, `0xA2`, `0xE2`, …), o que sugere **posição vertical do sistema**
(hipótese). Cada payload contém ainda um índice sequencial (`00`, `01`, `02`, …), valores
`04 00 00 00`, e a cauda decrescente `FC F8 F4 F0 EC E8 E4 E0`, compatível com posições de linhas
de pauta (hipótese).

### 5.2 `MEAS` — compasso

- 38 blocos, um por compasso, na ordem do arquivo.
- `tamanho` varia de **20 a 278 bytes**: cresce com a quantidade de eventos do compasso.
- Os dois menores (`0x10B6` e `0x11F6`, 20 bytes) são candidatos a **compassos vazios** (hipótese
  ainda sem comprovação).
- O início do payload é idêntico nos três primeiros compassos:
  `6B 00 00 00 F0 00 C0 03 04 04 00`, sugerindo um **cabeçalho fixo de compasso** de ~11 bytes
  seguido de dados variáveis (hipótese).
- Trailer fixo de 54 bytes, sempre terminando em `FF FF`. O conteúdo varia (29 trailers distintos
  em 37), então **não é preenchimento**: carrega informação ainda desconhecida.

A codificação de notas (altura, duração, acidente) **não foi decodificada**. Os payloads mostram
padrões repetidos de ~40 bytes que podem ser registros de evento, mas sem amostras controladas não
é possível isolar campo por campo.

### 5.3 `PREC` — configuração de impressão

5.420 bytes, sem relação com música. Contém, em UTF-16LE:

- `Microsoft Print to PDF` (`0x2C0A`)
- GUID `{084F01FA-E634-4D77-83EE-074817C03581}` (`0x2F52`)
- `DocumentUserPassword`, `DocumentOwnerPassword`, `DocumentCryptSecurity` (`0x3072`–`0x30C8`)
- `PaperSize`, `Orientation`, `PORTRAIT`, `Resolution`, `ResOption1`, `ColorMode`, `Color`, `V4DM`
  (`0x2FB1`–`0x300E`)

É compatível com um blob **DEVMODE** do Windows (impressora, papel, resolução, cor) e pode ser
ignorado pelo parser.

### 5.4 `TITL` — metadados de texto

21.242 bytes, quase todo zero, com textos em UTF-16LE:

| Offset | Texto |
| --- | --- |
| `0x415E` | `A2 - A JUSTIÇA (BASE BÍBLICA DE 2007)` |
| `0x4580` | `lauta c 02` (trecho; provável continuação de “Flauta c 02”) |
| `0x4DBE` | `Flauta C 02` |

O tamanho fixo e a distribuição esparsa sugerem uma **área de tamanho fixo para textos e estilos**,
não uma lista compacta (hipótese). O título e o nome da parte estão, portanto, neste bloco — não
em `MEAS`.

### 5.5 `TEXT`, `FONT`, `COLR`, `DRUM`, `WINI`

| Bloco | Conteúdo observado |
| --- | --- |
| `TEXT` | 8 bytes, todos zero |
| `FONT` | 918 bytes; fonte `Arial` em UTF-16LE em `0x948A` |
| `COLR` | 142 bytes; paleta (`FF FF FF`, `C0 C0 C0`, `7F 7F 7F`, `FF 00 FF`, `00 FF FF`, …) e `Times New Roman` em `0x977E` |
| `DRUM` | bloco vazio (`tamanho = 0`) |
| `WINI` | 42 bytes finais; valores como `05 00 00 00` e coordenadas — compatível com estado de janela/zoom (hipótese) |

## 6. Inventário de tags

Contagem e primeiras ocorrências extraídas da amostra (`--tags`):

| Tag | Ocorrências | Primeiros offsets |
| --- | --- | --- |
| `MEAS` | 38 | `0x0BD2`, `0x0CE6`, `0x0DEA`, `0x0EEE` |
| `LINE` | 10 | `0x0952`, `0x0992`, `0x09D2`, `0x0A12` |
| `PAGE` | 1 | `0x0930` |
| `PREC` | 1 | `0x2C02` |
| `TITL` | 1 | `0x4136` |
| `TEXT` | 1 | `0x9438` |
| `FONT` | 1 | `0x9448` |
| `COLR` | 1 | `0x97E6` |
| `DRUM` | 1 | `0x987C` |
| `WINI` | 1 | `0x9884` |

`TK00` aparece uma vez (`0xC2`), dentro do cabeçalho, e ainda não é compreendido.

## 7. O que continua desconhecido

1. Significado dos campos do cabeçalho `SCOW` (inclusive o `uint32` 196 e o `TK00`).
2. Semântica do trailer fixo de 54 bytes de cada compasso.
3. Codificação de **notas**: altura, oitava, acidente, duração, ligadura, voz.
4. Codificação de **clave, tonalidade e fórmula de compasso** dentro de `MEAS` (ou em `LINE`).
5. Onde ficam **pausas**, articulações, dinâmica e letras.
6. Se múltiplas partes geram múltiplos fluxos de `MEAS`, ou um bloco por parte.
7. Se o tamanho de `TITL` é constante entre arquivos (21.242 bytes) ou proporcional ao conteúdo.
8. Se existe campo de **versão do Encore** e onde.
9. Por que `LINE` tem exatamente 56 bytes e como relaciona sistemas a compassos.

## 8. Próximos experimentos (amostras controladas)

A ordem abaixo isola um campo por vez. Cada arquivo deve ser gerado no Encore com o mínimo de
diferença em relação ao anterior, e comparado com `--chunks` mais um diff hexadecimal par a par.

| # | Experimento | O que deve mudar | Campo isolado |
| --- | --- | --- | --- |
| 1 | Partitura vazia (1 compasso, sem notas) | `MEAS` mínimo | cabeçalho de compasso |
| 2 | 1 nota C4 semínima, 4/4 | `MEAS` com 1 evento | registro de nota |
| 3 | 1 nota D4 semínima | idem ao 2 | altura |
| 4 | 1 nota C4 mínima | idem ao 2 | duração |
| 5 | 1 nota C#4 semínima | idem ao 2 | acidente |
| 6 | 1 compasso 3/4 | `LINE`/`MEAS` | fórmula de compasso |
| 7 | Clave de fá | `LINE`/`MEAS` | clave |
| 8 | Tonalidade com 2 sustenidos | `LINE`/`MEAS` | armadura |
| 9 | Duas vozes no mesmo compasso | `MEAS` maior | voz |
| 10 | Duas partes (piano) | novo fluxo de `MEAS` ou novo bloco | partes |

Sem os itens 1–5, o parser do MVP (RF-05, RF-06) não pode começar: são eles que revelam o registro
de nota, que é o coração do formato.

## 9. Como reproduzir

```bash
# cadeia de blocos completa
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --chunks

# inventário de tags
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --tags --length 39094

# cabeçalho
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --offset 0 --length 320

# região de compassos
node scripts/enc-dump.mjs "tests/fixtures/samples/justica-flauta2.enc" --offset 3026 --length 576
```

## 10. Status do portão G1

| Critério do G1 | Situação |
| --- | --- |
| `docs/enc-format.md` cobre cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras, metadados | **não** — contêiner e metadados sim; notas, claves e armaduras não |
| Cada campo documentado tem ao menos uma amostra que o comprova | parcial — 1 amostra, campos marcados como hipótese |
| Spike de parser abre ≥ 3 amostras simples sem erro | **não** — parser não iniciado |
| Magic bytes e versão identificados | magic sim (`SCOW`); versão não |
| Decisão go/no-go registrada e datas recalculadas | pendente |

**Conclusão:** o contêiner está resolvido o suficiente para escrever um leitor de blocos, mas o
conteúdo musical não. O próximo passo bloqueante é coletar as amostras controladas da seção 8.
