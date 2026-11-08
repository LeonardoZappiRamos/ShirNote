# PDF para MusicXML (estudo)

- Versão: 1.0 (decidido: importação assistida, ADR 0013)
- Data: 2026-11-08
- Requisitos: RFM-03 (PRD móvel v2.1), questão Q8
- Decisão: [ADR 0013](../decisions/0013-converter-pdf-em-musicxml-como-importacao-assistida.md):
  conversão opcional, a cargo de quem importa, com aviso e o PDF original sempre disponível
- Scripts: `scripts/omr/render.py` (gera os PDFs de teste) e `scripts/omr/compare.py` (mede)

Pedido do owner (Q8): estudar se dá para transformar o PDF importado em MusicXML. Se der, o PDF entra
na biblioteca como qualquer partitura (transpõe, sincroniza, aparece na web).

---

## 1. Resumo

**O Audiveris lê bem as notas de um PDF limpo, mas erra o ritmo o bastante para exigir conferência.**

- PDF limpo (gerado por programa de partitura): **99,0% a 100% das alturas certas** nas 6 partituras
  reais; somando a duração, 88,7% a 98,1%.
- PDF "escaneado" (imagem a 200 dpi, torta, borrada e com ruído): 84,8% a 95,4% das alturas;
  79,7% a 89,5% com duração.
- ~5 s por página na máquina de desenvolvimento (Windows 11; o Audiveris não usa GPU).

Pelo critério proposto na v0.1 (≥ 98% das notas, contando a duração), **não passa**. Pela altura, passa
no PDF limpo. A recomendação está na seção 6.

## 2. O problema

Converter imagem de partitura em notas é **reconhecimento óptico de música** (OMR). Nenhuma
ferramenta acerta 100%: erros comuns são acidentes, ligaduras, quiálteras, texto e partituras
escaneadas tortas ou com baixa resolução.

## 3. Candidatas

| Ferramenta | Licença | Situação | Avaliada? |
| --- | --- | --- | --- |
| **Audiveris** 5.11.0 (jul/2026) | AGPL-3.0 | Mais madura; Java; linha de comando com exportação em lote | **sim** |
| homr | AGPL-3.0 | Sucessor do oemer, feito para foto de celular; ativo (nov/2026) | não; candidata para fotos |
| oemer | MIT | Foi mal em benchmark público (38% em página limpa) | não |
| Serviços comerciais | Proprietária | Custo por página; o arquivo vai para terceiro (fere RNFM-02) | não |

## 4. Como foi medido

1. **Gabarito:** 6 partituras reais e 4 amostras controladas, com o MusicXML exportado pelo Encore em
   `tests/fixtures/reference/`.
2. **PDFs:** gerados desses MusicXML pelo Verovio, vetoriais, A4 (`render.py`). Cada um também em
   versão "escaneada": página a 200 dpi, girada até 1,5°, borrada e com ruído.
3. **OMR:** `Audiveris -batch -export` em todos os 20 PDFs numa execução (102 s no total).
4. **Comparação** (`compare.py`): sequência de notas e pausas da 1ª parte, em ordem de pauta,
   compasso e tempo. Acerto = 1 − distância de edição ÷ notas do gabarito.
   - **altura:** só a altura de cada nota (pausas fora);
   - **completo:** altura ou pausa + duração.
   O gabarito comparado com ele mesmo dá 100%.

**Limite da medição:** os PDFs vêm do Verovio, não do Encore. A diagramação do Encore (fonte, espaços,
barras) é outra. Falta repetir com PDFs exportados pelo próprio Encore (seção 7).

## 5. Resultados

| Partitura | Notas | Limpo: altura | Limpo: completo | Escaneado: altura | Escaneado: completo |
| --- | --- | --- | --- | --- | --- |
| justica-flauta2 | 176 | 99,1% | 92,6% | 84,8% | 81,3% |
| tora-sax-tenor | 136 | 100% | 91,2% | 84,8% | 80,2% |
| ana-bekoach-clarinete (6/8) | 274 | 99,6% | 88,7% | 95,4% | 85,0% |
| meu-clamor-trompete | 200 | 99,4% | 95,5% | 93,3% | 89,5% |
| al-ze-flauta (2 páginas) | 417 | 99,5% | 98,1% | 85,3% | 82,5% |
| vontade-do-pai-trompete | 128 | 99,2% | 93,8% | 87,6% | 79,7% |
| controle-16 (duas pautas) | 30 | 100% | 100% | 100% | 100% |
| controle-23 (armaduras) | 7 | 100% | 100% | 85,7% | 85,7% |
| controle-20 (quiálteras + 4 trocas de clave) | 25 | 44,0% | 32,0% | 48,0% | 36,0% |
| controle-18 (duas vozes) | — | sem saída | sem saída | sem saída | sem saída |

O que os erros mostram:

- **Ritmo é o ponto fraco:** pausas pontuadas, figuras em 6/8 e ligaduras perdem duração mesmo
  com a altura certa.
- **Troca de clave no meio da pauta** derruba a altura (controle-20).
- **Pauta curta** (3 compassos ocupando 1/5 da largura, controle-18) não é reconhecida como sistema.
  Isso é artefato da amostra controlada; partitura real ocupa a largura toda.
- **Página escaneada sem clave reconhecida** divide a partitura em dois "movimentos" (al-ze). O
  backend teria que juntar as partes.
- **Título e letra:** o OCR (Tesseract) veio sem idiomas instalados e não leu texto. Não importa para
  a regra de nome (ADR 0012, nome do arquivo), mas a letra se perderia.

## 6. Recomendação do estudo

> **Decisão do owner (08/11/2026), no ADR 0013:** a conversão fica a cargo de quem importa; o
> ShirNote avisa que pode haver erro e mantém o PDF original no aparelho e, se conectado, no
> OneDrive/Google Drive. A recomendação abaixo foi aceita, com uma diferença: escaneado e foto também
> podem ser tentados, com o mesmo aviso (item 2 abaixo não vale).

1. **Converter só como "importação assistida", nunca em silêncio.** Ao importar um PDF, a pessoa
   escolhe entre "Guardar como PDF" (padrão, sem conversão) e "Tentar converter em partitura". O
   resultado abre lado a lado com o PDF original, com o aviso "Confira as notas e o ritmo antes de
   usar", e o PDF original continua guardado junto.
2. **Só PDF de programa de partitura** na primeira versão. Escaneado e foto ficam fora até um teste
   com o homr.
3. **Onde roda:** no backend, como processo separado e sem modificar o Audiveris (a AGPL-3.0 pede o
   código-fonte se o Audiveris for modificado e oferecido pela rede). Validar com jurídico antes do
   lançamento. A conversão exige enviar o PDF ao servidor: só para quem tem conta e confirma a ação
   (RNFM-02).
4. **Custo:** ~5 s e até 8 GB de memória por página. Fila de tarefas num serviço separado, nunca
   na requisição da API.
5. **Quando:** depois da Fase 9 (contas e servidor). Não muda nada no app antes disso.


## 7. Próximos passos do estudo

1. Repetir com **10 PDFs exportados pelo Encore** (5 do acervo e 5 com quiálteras, duas vozes e troca
   de clave), usando os mesmos `.enc` cujo MusicXML de referência já existe.
2. Testar o **homr** nos escaneados e em fotos de celular.
3. Instalar os idiomas do Tesseract (por, eng) e medir título e letra.

Para repetir a medição: `python scripts/omr/render.py <referencias> <saida> <nomes>`, depois
`Audiveris -batch -export -output <saida> -- <pdfs>` e
`python scripts/omr/compare.py <gabarito.xml> <saida.mxl>` (Python 3.12 com `verovio`, `pymupdf`,
`pillow`, `svglib` e `reportlab`).

## 8. Duplicados

Vale a regra do [ADR 0012](../decisions/0012-exigir-nome-unico-na-biblioteca.md) também para PDF:
nome único e o mesmo conteúdo avisado como duplicado.

## Fontes

- [Audiveris](https://github.com/Audiveris/audiveris) e [handbook](https://audiveris.github.io/audiveris/)
- [homr](https://github.com/liebharc/homr)
- [Benchmark de OMR da Sheetly](https://www.trysheetly.com/compare/omr-benchmark) (fornecedor
  comercial; usado só como indício sobre o oemer)
