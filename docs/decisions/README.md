# Decisões arquiteturais (ADRs)

Registro das decisões que mudam estrutura, atributos de qualidade ou comportamento do ShirNote.
Formato: [MADR](https://adr.github.io/madr/) completo, em pt-BR.

| ADR                                                    | Status   | Data       | Assunto                                            |
| ------------------------------------------------------ | -------- | ---------- | -------------------------------------------------- |
| [0001](0001-adotar-react-e-react-native.md)             | Accepted | 2026-11-01 | React no web e React Native no mobile, núcleo TS puro |
| [0002](0002-aprovar-portao-g1-e-iniciar-fase-2.md) | Accepted | 2026-11-02 | G1 aprovado, Fase 2 com Encore 0xC4 e 10 partituras reais até o G2 |
| [0003](0003-adiar-o-web-worker-do-parse.md) | Accepted | 2026-11-02 | Web Worker do parse adiado, com medição e gatilho de revisão |
| [0004](0004-adotar-regua-provisoria-de-desempenho-e-compatibilidade.md) | Accepted | 2026-11-02 | Régua provisória: máquina de dev com 4× de CPU; Safari pendente |
| [0005](0005-adotar-expo-e-webview-com-osmd-no-app-movel.md) | Accepted | 2026-11-04 | Expo + React Native, partitura numa WebView com OSMD |
| [0006](0006-adotar-sqlite-e-musicxml-como-formato-da-biblioteca.md) | Accepted | 2026-11-04 | SQLite local e MusicXML como formato canônico |
| [0007](0007-validar-compra-no-backend-e-conceder-direito.md) | Accepted (item 7 → 0009) | 2026-11-04 | Compra validada no backend, direito assinado e RTDN |
| [0008](0008-sincronizar-biblioteca-com-onedrive-e-google-drive.md) | Accepted (item 10 → 0010) | 2026-11-04 | Sincronização direta com OneDrive e Google Drive |
| [0009](0009-adotar-conta-shirnote-com-senha-e-login-google.md) | Accepted | 2026-11-08 | Conta ShirNote com e-mail e senha e Google (Better Auth); Pro exige conta |
| [0010](0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md) | Accepted (item 4 → PRD v2.1) | 2026-11-08 | Biblioteca da conta no PostgreSQL em MusicXML; app e web sincronizam |
| [0011](0011-adotar-envio-de-e-mail-por-ambiente.md) | Accepted | 2026-11-08 | E-mail: Mailpit local, Mailtrap em staging, Resend ou Brevo em produção |
| [0012](0012-exigir-nome-unico-na-biblioteca.md) | Accepted | 2026-11-08 | Nome único na biblioteca (nome do arquivo); duplicado aceito vira "Nome 1" |

## Regras

- Um ADR aceito **não é editado**. Para mudar a decisão, escreva um novo ADR e marque o anterior
  como `Superseded by ADR-NNNN`.
- O título fica no infinitivo: "Adotar X para Y".
- O contexto explica o problema, não a solução.
- Consequências listam o que se ganha, o que se perde e o que precisa ser monitorado.
