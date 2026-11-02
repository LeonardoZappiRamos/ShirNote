# Referência MusicXML

Aqui vão os **MusicXML exportados pelo próprio Encore** para as mesmas partituras do acervo `.enc`.

Um par `.enc` + `.xml` da mesma partitura é a melhor evidência possível para a Fase 1: o
MusicXML diz, nota por nota, altura, figura, acidente, voz, clave e armadura. Foi assim que o evento
de nota (seção 7 de [`docs/enc-format.md`](../../../docs/enc-format.md)) passou de hipótese a
comprovado, em 450 de 450 notas.

## O que colocar aqui

| Arquivo                | Origem                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `justica-flauta2.xml`  | exportação de `../samples/justica-flauta2.enc`                   |
| `tora-sax-tenor.xml`   | exportação de `../samples/tora-sax-tenor.enc`                    |
| `alegrei-sax-alto.xml` | exportação de `../samples/alegrei-sax-alto.enc`                  |
| `<nome>.xml`           | exportação de cada uma das outras 11 partituras de `../samples/` |
| `controle-NN-....xml`  | contraparte opcional de cada amostra de `../controlled/`         |

- Use **`.xml` (não comprimido)**. Se o Encore só exportar `.mxl`, descompacte antes de
  comitar (o `.mxl` é um zip).
- Mantenha o mesmo nome-base do `.enc` correspondente: o teste acha a referência por ele.
- O Encore exporta em UTF-16LE; não converta, o spike lê UTF-16LE e UTF-8. O `.gitattributes`
  guarda esses arquivos em UTF-8 no Git só para o diff; as 3 referências antigas já vieram em UTF-8.
- O exportador omite `<dot/>` em pausa pontuada e grafa pela armadura a nota que termina uma
  ligadura; o spike corrige os dois casos (seção 7 de `docs/enc-format.md`).
- Se a exportação puder incluir layout/paginação, prefira sem: interessa só o conteúdo musical.
- Amostras de obras de terceiros continuam sujeitas à checagem de direitos do PRD. Se a obra não
  puder ser comitada, guarde o MusicXML fora do repositório e registre o caminho no catálogo.

## Como será usado

`scripts/enc-spike.mjs --check` lê o `.enc` e compara cada compasso e evento com o MusicXML. O teste
`src/enc/container.test.ts` roda essa comparação. O que não casar vira pergunta para a próxima amostra
controlada.

Nada disso entra no parser do produto: o MusicXML de referência é **evidência de engenharia
reversa**, não dado de produção.
