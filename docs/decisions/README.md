# Decisões arquiteturais (ADRs)

Registro das decisões que mudam estrutura, atributos de qualidade ou comportamento do ShirNote.
Formato: [MADR](https://adr.github.io/madr/) completo, em pt-BR.

| ADR                                                    | Status   | Data       | Assunto                                            |
| ------------------------------------------------------ | -------- | ---------- | -------------------------------------------------- |
| [0001](0001-adotar-react-e-react-native.md)             | Accepted | 2026-11-01 | React no web e React Native no mobile, núcleo TS puro |

## Regras

- Um ADR aceito **não é editado**. Para mudar a decisão, escreva um novo ADR e marque o anterior
  como `Superseded by ADR-NNNN`.
- O título fica no infinitivo: "Adotar X para Y".
- O contexto explica o problema, não a solução.
- Consequências listam o que se ganha, o que se perde e o que precisa ser monitorado.
