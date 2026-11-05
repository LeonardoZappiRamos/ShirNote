# Documentos do ShirNote

Leia nesta ordem e pare no que responde à sua pergunta.

| Pergunta | Documento | Estado |
| --- | --- | --- |
| O que o produto faz e por quê? | [PRD do app móvel](PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) | **vigente** |
| Como está construído e o que já existe no código? | [TECHSPEC do app móvel](TECHSPEC%20—%20App%20Móvel%20ShirNote.md) | **vigente** |
| Por que foi decidido assim? | [ADRs](decisions/README.md) | vigentes, salvo os marcados `Superseded` |
| O que se sabe do formato `.enc`? | [`enc-format.md`](enc-format.md) | **vigente**, fonte de verdade do formato |
| Como trabalhar no repositório? | [`AGENTS.md`](../AGENTS.md) | **vigente** |
| O que foi o MVP web? | [PRD web](PRD%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) e [cronograma web](CRONOGRAMA%20—%20Visualizador%20Web%20de%20Partituras%20Encore%20(.enc).md) | **arquivado**, só histórico |

## Precedência

Quando dois documentos discordarem:

1. **Código e testes** dizem o que existe.
2. **PRD móvel** diz o que o produto deve fazer (requisitos `RFM`/`RNFM`).
3. **ADR aceito** diz por que a arquitetura é assim; para mudar, escreva outro ADR.
4. **TECHSPEC** descreve o código e o plano técnico; corrija-o na mesma alteração que mudar o código.
5. **Arquivados** nunca orientam trabalho novo. Requisitos `RF-`/`RNF-` do PRD web só valem para o
   site de demonstração.

## Onde registrar cada coisa

| Mudou… | Atualize |
| --- | --- |
| Requisito, escopo, plano grátis/Pro | PRD móvel (suba a versão) |
| Estrutura, tabela, mensagem da ponte, fluxo implementado | TECHSPEC |
| Decisão de arquitetura ou de qualidade | novo ADR + índice em `decisions/README.md` |
| Campo comprovado do `.enc` | `enc-format.md` (seção 11) e tabela de estado do `README.md` da raiz |
| Fase ou portão concluído | tabela de estado do `README.md` da raiz e §1 do TECHSPEC |

Outras pastas: [`brand/`](brand/) (logo e ícone) e `amostra/` (arquivos originais, não versionar obra
de terceiros sem direito de uso).
