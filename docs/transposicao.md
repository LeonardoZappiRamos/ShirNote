# Transposição por grau

- Versão: 1.2
- Data: 2026-11-05 (v1.1: simplificar dobrados e oitava; v1.2: partitura escrita para instrumento transpositor)
- Código: `src/music/transpose.ts`
- Testes: `src/music/transpose.test.ts`, bloco "transposição por grau". Cada caso da seção 5 tem um
  teste com o mesmo ID.
- Requisito: RFM-06 (PRD móvel). O site usa o mesmo núcleo.

Este documento serve para **um músico conferir se a transposição está certa** sem ler código. Se
algum resultado da seção 5 estiver errado musicalmente, anote o ID do caso e o que deveria sair: o
teste é corrigido junto com o código.

---

## 1. A ideia em uma frase

Transpor é mover **todas as notas pelo mesmo intervalo**, contando duas coisas ao mesmo tempo:

- **o grau** (quantas letras andar: dó → ré é uma 2ª, dó → mi é uma 3ª);
- **o tamanho** (quantos semitons: dó → ré são 2, dó → ré bemol é 1).

Por isso cada nota mantém a sua **função na escala**: a tônica continua tônica, a terça continua
terça e um acidente de passagem continua acidente de passagem. É o que um músico faz ao transpor
no papel, e é o que o MuseScore e o Finale fazem.

Contar só semitons não basta: dó sustenido e ré bemol têm o mesmo som, mas em ré maior o grau certo
de um dó sustenido de dó maior é **ré sustenido** (segue a letra), não mi bemol.

## 2. Como a pessoa escolhe

Na tela (site) há três jeitos, que dão o mesmo intervalo:

| Controle | O que faz |
| --- | --- |
| **Escrita para** | Diz para qual instrumento a partitura está escrita: Dó (voz, piano...), Si bemol (clarinete, trompete, sax soprano e tenor), Mi bemol (sax alto e barítono) ou Fá (trompa). Muda só os nomes na tela: ao lado do tom escrito aparece o tom que soa (regra 6). |
| **Transpor para** + **Direção** | Escolhe o tom de destino. "Mais perto" pega o caminho mais curto. "Para cima" e "Para baixo" forçam o sentido. |
| **−½ / +½** | Anda meio tom por vez. O tom de destino é o de **menos acidentes** (regra 4.2); para a outra grafia (ex.: sol bemol em vez de fá sustenido), escolha em "Transpor para". |
| **8ª abaixo / 8ª acima** | Desloca tudo uma oitava, sem mudar o tom. Junto com os outros controles, o limite é de duas oitavas (24 semitons) para cada lado. |
| **Simplificar dobrados** | Troca dobrado sustenido e dobrado bemol pela nota simples de mesmo som (regra 7). Desligado por padrão. |
| **Tom original** | Volta ao arquivo. A partitura original nunca é alterada; a transposição é recalculada a partir dela. |

**Direção, oitava e grafia ficam a critério de quem toca.** A escolha certa depende da análise de
cada instrumento (extensão, leitura, afinação), então o ShirNote não decide sozinho: os padrões
abaixo são só o ponto de partida, e a pessoa ajusta com os controles.

O resultado aparece por extenso: "2ª maior abaixo (−2 semitons): Sol maior / Mi menor".

## 3. Nome do tom

O Encore não grava se a música é maior ou menor; só a armadura. Por isso a tela mostra os dois
nomes da mesma armadura: "Lá maior / Fá sustenido menor". Quando o arquivo traz o modo, só um nome
aparece.

| Armadura | Maior | Menor relativa |
| --- | --- | --- |
| 7 ♭ | Dó bemol | Lá bemol |
| 6 ♭ | Sol bemol | Mi bemol |
| 5 ♭ | Ré bemol | Si bemol |
| 4 ♭ | Lá bemol | Fá |
| 3 ♭ | Mi bemol | Dó |
| 2 ♭ | Si bemol | Sol |
| 1 ♭ | Fá | Ré |
| nenhuma | Dó | Lá |
| 1 ♯ | Sol | Mi |
| 2 ♯ | Ré | Si |
| 3 ♯ | Lá | Fá sustenido |
| 4 ♯ | Mi | Dó sustenido |
| 5 ♯ | Si | Sol sustenido |
| 6 ♯ | Fá sustenido | Ré sustenido |
| 7 ♯ | Dó sustenido | Lá sustenido |

## 4. Regras

1. **Toda nota anda o mesmo intervalo**: mesmo número de graus e mesmo número de semitons. A oitava
   acompanha (si 4 + 2ª maior = dó sustenido 5).
2. **Semitons escolhem a armadura com menos acidentes.** Dó maior + 1 semitom = ré bemol maior
   (5 ♭), não dó sustenido maior (7 ♯). No empate de 6 (fá sustenido × sol bemol), subir dá
   sustenidos e descer dá bemóis. A pessoa pode trocar pela enarmônica em "Transpor para".
3. **Trítono (6 semitons) não tem lado mais perto.** "Mais perto" sobe e a tela avisa para escolher
   "Para cima" ou "Para baixo" conforme o instrumento.
4. **Armadura acompanha o intervalo.** Cada troca de armadura no meio da música é transposta pelo
   mesmo intervalo.
5. **Nunca mais de 7 acidentes na armadura.** Se uma modulação cair num tom de 8 ou mais acidentes
   (ex.: sol sustenido maior), aquele trecho é escrito na enarmônica (lá bemol maior), com o mesmo
   som. Só o trecho muda de grafia; o resto da música segue a regra 1.
6. **Partitura de instrumento transpositor já vem no tom do instrumento.** A parte de clarinete
   em si bemol de uma música em dó maior vem escrita em ré maior; a de sax alto, em lá maior. O
   arquivo `.enc` não diz para qual instrumento a partitura foi escrita, então a pessoa informa em
   **Escrita para**. A transposição continua igual (todas as notas e partes andam o mesmo
   intervalo); a tela só acrescenta o tom que soa: "Ré maior, soa Dó maior" (caso T20).

   | Escrita para | Soa | Exemplo: escrito em dó maior soa em |
   | --- | --- | --- |
   | Si bemol | um tom abaixo | Si bemol maior |
   | Mi bemol | uma 6ª maior abaixo | Mi bemol maior |
   | Fá | uma 5ª justa abaixo | Fá maior |

   Se as partes do arquivo forem de instrumentos diferentes, os nomes seguem a armadura da
   primeira parte.
7. **Dobrados: as duas grafias estão certas.** Seguir o grau pode gerar dobrado sustenido ou
   dobrado bemol (caso T10), que é a grafia da teoria. Com **Simplificar dobrados** ligado, a nota
   vira a simples de mesmo som que menos destoa da armadura (si dobrado bemol → lá; dó dobrado
   sustenido → ré). Só os dobrados mudam; sustenido e bemol simples (como mi sustenido em fá
   sustenido maior) ficam como estão (caso T18).
8. **Acidente triplo não existe na escrita.** Se o grau pedir um (só com dobrados no original), a
   nota é reescrita pelo som na armadura de destino (caso T17).
9. **Oitava é um intervalo como outro.** 2ª maior acima + 8ª abaixo = 7ª menor abaixo (caso T19).
10. Pausas, durações, ligaduras, vozes e pautas não mudam.

## 5. Casos de validação

Notação: nota + acidente + oitava científica (dó central = C4). `#` = sustenido, `b` = bemol,
`bb` = dobrado bemol.

| ID | Origem | Pedido | Intervalo esperado | Resultado esperado |
| --- | --- | --- | --- | --- |
| T01 | Dó maior, escala C4–B4 | Ré maior, mais perto | 2ª maior acima (+2) | Armadura 2 ♯. D4 E4 F#4 G4 A4 B4 C#5 |
| T02 | Dó maior, escala C4–B4 | Si bemol maior, mais perto | 2ª maior abaixo (−2) | Bb3 C4 D4 Eb4 F4 G4 A4 |
| T03 | Sol maior: G4 B4 D5 | Mi bemol maior, mais perto | 3ª maior abaixo (−4) | Armadura 3 ♭. Eb4 G4 Bb4 |
| T04 | Dó maior | Fá maior | Mais perto ou para cima: 4ª justa acima (+5). Para baixo: 5ª justa abaixo (−7) | — |
| T05 | Dó maior | Fá sustenido maior, mais perto | 4ª aumentada acima (+6): empate sobe | — |
| T06 | Dó maior | Sol bemol maior, mais perto | 5ª diminuta acima (+6): empate sobe | — |
| T07 | Ré maior | Ré maior | Tom original | Partitura igual |
| T08 | Lá menor | Mi menor, mais perto | 4ª justa abaixo (−5) | Armadura 1 ♯ |
| T09 | Dó maior: C#4 Bb4 | Ré maior | 2ª maior acima | D#4 C5 (o acidente segue o grau) |
| T10 | Dó maior: Ab4 F#4 | Ré bemol maior | 2ª menor acima (+1) | Bbb4 G4 |
| T11 | Dó maior | +½ | 2ª menor acima (+1) | Armadura 5 ♭ (ré bemol maior) |
| T12 | Dó maior | −½ | 2ª menor abaixo (−1) | Armadura 5 ♯ (si maior) |
| T13 | Dó maior | +6 / −6 semitons | — | +6: 6 ♯ (fá sustenido). −6: 6 ♭ (sol bemol) |
| T14 | Lá maior | +12 semitons | 8ª justa acima | Mesma armadura, tudo uma oitava acima. −12 em dó maior: C4 → C3 |
| T15 | Dó maior com modulação para fá sustenido maior (6 ♯), nota F#4 | Ré maior (+2) | 2ª maior acima | Trecho modulado: armadura 4 ♭ (lá bemol maior, em vez de sol sustenido maior); F#4 → Ab4 |
| T16 | Voz em dó maior (C4) + clarinete em ré maior (D4) | Ré maior | 2ª maior acima | Voz: 2 ♯, D4. Clarinete: 4 ♯ (mi maior), E4 |
| T17 | Nota E##4, intervalo uníssono aumentado, destino dó sustenido maior | — | — | G4 (E### não existe; reescrita pelo som) |
| T18 | Dó maior: Ab4 C#4. Dó maior: A#4 | Ré bemol maior; mi maior | 2ª menor acima; 3ª maior acima | Sem simplificar: Bbb4 D4; C##5. Simplificando: A4 D4; D5 |
| T19 | Dó maior, escala C4–B4 | Ré maior + 8ª abaixo | 7ª menor abaixo (−10) | Começa em D3 |
| T20 | Armadura escrita: ré maior (Si bemol); lá maior (Mi bemol); sol maior (Fá); sol bemol maior (Si bemol e Mi bemol) | — | — | Soa dó maior; dó maior; dó maior; mi maior e lá maior (a enarmônica de fá bemol e si dobrado bemol, para não passar de 7 acidentes) |

## 6. Decisões de quem usa

Respostas de 05/11/2026:

- **Dobrados (T10, T18):** as duas grafias estão certas; vira a opção **Simplificar dobrados**,
  desligada por padrão.
- **Trítono, oitava e grafia do tom:** dependem da análise por instrumento, então ficam a critério
  de quem toca (seção 2). O padrão só existe para o primeiro clique.

- **Instrumento transpositor (regra 6):** a partitura de clarinete ou sax já vem no tom do
  instrumento. A pessoa informa em **Escrita para** e a tela mostra também o tom que soa.

## 7. Como mudar

1. Altere o caso na seção 5 (ou acrescente um com o próximo ID).
2. Altere o teste com o mesmo ID em `src/music/transpose.test.ts`.
3. Só então altere o código, e suba a versão deste documento.
