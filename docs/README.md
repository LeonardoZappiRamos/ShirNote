# Documentos do ShirNote

`docs/` guarda só o que está **vigente**. Documento finalizado sai daqui e vai para
[`archive/`](../archive/) na raiz do repositório.

Leia nesta ordem e pare no que responde à sua pergunta.

| Pergunta | Documento | Estado |
| --- | --- | --- |
| O que o produto faz e por quê? | [PRD do app móvel](PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) | **vigente** |
| Como está construído e o que já existe no código? | [TECHSPEC do app móvel](TECHSPEC%20—%20App%20Móvel%20ShirNote.md) | **vigente** |
| Como uma feature deve se comportar? | [`feature/`](feature/) | **vigente**, um arquivo por feature |
| Por que foi decidido assim? | [ADRs](decisions/README.md) | vigentes, salvo os marcados `Superseded` |
| O que se sabe do formato `.enc`? | [`enc-format.md`](enc-format.md) | **vigente**, fonte de verdade do formato |
| Como trabalhar no repositório? | [`AGENTS.md`](../AGENTS.md) | **vigente** |
| O que foi o MVP web? | [PRD web](../archive/PRD%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) e [cronograma web](../archive/CRONOGRAMA%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) | **arquivado**, só histórico |

## Features

Cada feature tem um arquivo em `feature/`, com nome curto em pt-BR (`transposicao.md`). O arquivo
diz como a feature se comporta: regras, casos de validação e requisitos (`RFM-`) que atende. O PRD
diz _o que_ e _por quê_; o TECHSPEC diz _onde_ está no código.

| Feature | Documento |
| --- | --- |
| Transposição por grau (RFM-06) | [`feature/transposicao.md`](feature/transposicao.md) |

## Precedência

Quando dois documentos discordarem:

1. **Código e testes** dizem o que existe.
2. **PRD móvel** diz o que o produto deve fazer (requisitos `RFM`/`RNFM`).
3. **ADR aceito** diz por que a arquitetura é assim; para mudar, escreva outro ADR.
4. **Documento de feature** detalha o comportamento dentro do que o PRD pede.
5. **TECHSPEC** descreve o código e o plano técnico; corrija-o na mesma alteração que mudar o código.
6. **Arquivados** nunca orientam trabalho novo. Requisitos `RF-`/`RNF-` do PRD web só valem para o
   site de demonstração.

## Onde registrar cada coisa

| Mudou… | Atualize |
| --- | --- |
| Requisito, escopo, plano grátis/Pro | PRD móvel (suba a versão) |
| Comportamento de uma feature | `feature/<nome>.md` (novo arquivo se a feature for nova) e a tabela acima |
| Estrutura, tabela, mensagem da ponte, fluxo implementado | TECHSPEC |
| Decisão de arquitetura ou de qualidade | novo ADR + índice em `decisions/README.md` |
| Regra de transposição | `feature/transposicao.md` (caso na seção 5) e o teste com o mesmo ID |
| Campo comprovado do `.enc` | `enc-format.md` (seção 11) e tabela de estado do `README.md` da raiz |
| Fase ou portão concluído | tabela de estado do `README.md` da raiz e §1 do TECHSPEC |
| Documento finalizado | mova para `archive/` e corrija os links |

Outra pasta: [`brand/`](brand/) (logo e ícone). Os arquivos originais das amostras ficam em
[`tests/fixtures/originals/`](../tests/fixtures/originals/) (não versionar obra de terceiros sem direito de uso).
