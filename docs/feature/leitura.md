# Leitura

- Versão: 1.0
- Data: 2026-11-08
- Requisitos: RFM-05, RFM-18, RNFM-07 (PRD móvel)
- Código: `apps/mobile/src/library/reading.ts`, `apps/mobile/src/app/score/[id].tsx`,
  `apps/mobile/src/viewer/` e `apps/mobile/viewer/main.ts` (OSMD na WebView)
- Testes: `reading.test.ts`, `viewer/protocol.test.ts`; o resto, teste de fumaça no tablet

Este documento diz como a partitura se comporta na tela de leitura. A ponte entre o app e a WebView
está no [TECHSPEC](../TECHSPEC%20—%20App%20Móvel%20ShirNote.md) (§5 e §6.2).

---

## 1. Abrir

- A partitura é desenhada no aparelho, sem rede (RFM-18). O desenho usa o mesmo motor do site
  (OSMD).
- Abre no zoom e na posição em que a pessoa parou da última vez (seção 3).
- Se a posição salva estiver corrompida, a partitura abre do começo com zoom 100%. Nunca deixa de
  abrir por causa disso.

## 2. Zoom

- De 50% a 300%.
- O zoom é guardado por partitura.
- Pendência medida no tablet em 06/11/2026: o zoom não refaz as quebras de sistema; acima de 100%
  os compassos saem pela direita.

## 3. Posição salva

- O app guarda, por partitura, quanto da partitura já foi rolado (0 = topo, 1 = fim) e o zoom.
- A posição sobrevive a entrar e sair da tela cheia, a fechar a partitura e a fechar o app.
- Excluir a partitura apaga a posição dela.

## 4. Tela cheia

- Esconde a barra de status e os controles; fica só a partitura.
- O botão "voltar" do Android sai da tela cheia antes de fechar a partitura.

## 5. Ações a partir da leitura

| Ação | Plano | Documento |
| --- | --- | --- |
| Transpor (± semitom, até ±12) | Pro | [transposicao.md](transposicao.md) |
| Editar título e autor | Pro | [biblioteca.md](biblioteca.md), seção 3 |
| Excluir | todos | [biblioteca.md](biblioteca.md), seção 5 |
| Exportar PDF/MusicXML e imprimir | Pro | planejado (TECHSPEC §6.5, Fase 8) |

No grátis, Transpor e Editar mostram o aviso do Pro em vez de agir.

## 6. Acessibilidade

Os controles têm nome para o TalkBack ("Entrar em tela cheia", "Sair da tela cheia", "Excluir
partitura"). Contraste e alvos de 48 dp seguem RNFM-07; a revisão completa com TalkBack ainda não foi
feita.
