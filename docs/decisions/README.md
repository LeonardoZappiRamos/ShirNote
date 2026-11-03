# Decisões arquiteturais (ADRs)

Registro das decisões que mudam estrutura, atributos de qualidade ou comportamento do ShirNote.
Formato: [MADR](https://adr.github.io/madr/) completo, em pt-BR.

| ADR                                                    | Status   | Data       | Assunto                                            |
| ------------------------------------------------------ | -------- | ---------- | -------------------------------------------------- |
| [0001](0001-adotar-react-e-react-native.md)             | Accepted | 2026-11-01 | React no web e React Native no mobile, núcleo TS puro |
| [0002](0002-aprovar-portao-g1-e-iniciar-fase-2.md) | Accepted | 2026-11-02 | G1 aprovado, Fase 2 com Encore 0xC4 e 10 partituras reais até o G2 |
| [0003](0003-adiar-o-web-worker-do-parse.md) | Accepted | 2026-11-02 | Web Worker do parse adiado, com medição e gatilho de revisão |
| [0004](0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md) | Accepted | 2026-11-02 | Régua provisória: máquina de dev com 4× de CPU; Safari pendente |

## Regras

- Um ADR aceito **não é editado**. Para mudar a decisão, escreva um novo ADR e marque o anterior
  como `Superseded by ADR-NNNN`.
- O título fica no infinitivo: "Adotar X para Y".
- O contexto explica o problema, não a solução.
- Consequências listam o que se ganha, o que se perde e o que precisa ser monitorado.
