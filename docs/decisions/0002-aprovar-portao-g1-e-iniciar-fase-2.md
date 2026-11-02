# 0002 — Aprovar o portão G1 e iniciar a Fase 2 com o Encore `0xC4`

- Status: Accepted
- Data: 2026-11-02
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O cronograma v1.0 reservava 18 dias úteis (03/11 a 27/11/2026) para a engenharia reversa do `.enc`
e só permitia iniciar o parser de produto depois do portão G1. A descoberta terminou em 02/11/2026:
`docs/enc-format.md` v0.8 documenta cabeçalho, partes, pautas, compassos, notas, pausas, durações,
claves, armaduras e metadados, e o spike confere 27 de 27 amostras com o MusicXML do Encore. Quatro
dos cinco critérios do G1 estão marcados; falta a decisão.

Três pontos impedem uma aprovação simples:

- **Amostragem.** Há 3 partituras reais, todas do mesmo acervo, contra a meta de 10 a 30 da tarefa
  1.1. O cronograma trata menos de 10 como bloqueante.
- **Versão do Encore.** Todas as amostras têm `0x04 = 0xC4`. O
  [Enc2MusicXML](https://github.com/lvinken/Enc2MusicXML) lê também `0xC2` e `0xA6`, este com outro
  espaçamento de eventos, e o magic `SCO5` em big-endian. Nenhuma dessas variantes tem amostra.
- **Licença.** O Enc2MusicXML é GPL-3.0. Código copiado ou traduzido dele obrigaria o ShirNote a
  adotar a mesma licença.

## Forças que guiam a decisão

- Não desperdiçar os 18 du da Fase 1 que já não são necessários.
- Não construir o parser "no escuro" sobre um acervo pequeno demais.
- Manter o parser de produto restrito a campos comprovados (`AGENTS.md`).
- Falhar com mensagem clara em arquivo que o MVP não suporta (RF-03, RF-11).
- Preservar a liberdade de licença do ShirNote.

## Opções consideradas

- **A — GO, com partituras reais como condição do G2.**
- **B — GO com exceção formal**, aceitando 3 partituras reais.
- **C — NO-GO**, ficar na Fase 1 até ter 10 partituras reais.

## Decisão

Escolhida a **opção A**.

1. O portão G1 está **aprovado**. A Fase 2 começa em 03/11/2026, com as datas do cronograma v2.0.
2. **Condição:** pelo menos 10 partituras reais, do mesmo acervo e com direito de uso confirmado,
   chegam até 24/11/2026. O G2 só é aprovado se o parser conferir com elas.
3. **Versão de referência:** o MVP suporta só `0xC4`. Arquivo com outro valor em `0x04`, ou com outro
   magic, gera `EncoreFormatError` com mensagem clara. Outras versões vão para o backlog pós-MVP.
4. **Enc2MusicXML só como pista.** O código pode ser lido para formular hipóteses; toda regra usada
   no ShirNote é comprovada com amostra própria. Nenhum trecho é copiado ou traduzido.
5. **RF-07 sobe para a Fase 2.** Segunda pauta e segunda parte já estão comprovadas, e a folga da
   trilha paralela cobre o esforço.

### Consequências positivas

- O MVP fica previsto para 06/01/2027, contra 29/01/2027 na v1.0.
- A meta de amostras continua valendo, agora com prazo e efeito definidos.
- Arquivos não suportados falham cedo e com mensagem clara, sem leitura incorreta.
- A licença do ShirNote segue em aberto.

### Consequências negativas

- O parser é escrito antes de ver as partituras reais novas, e pode precisar de retrabalho.
- Quem usar outra versão do Encore não consegue abrir seus arquivos no MVP.
- Ler o Enc2MusicXML e não reaproveitar código custa mais tempo do que portá-lo.

### Consequências neutras / a monitorar

- Partituras recebidas por semana, na review de sexta. Menos de 7 no fim da W2 dispara escalonamento.
- Divergências que as partituras novas revelarem: cada uma vira amostra controlada ou aviso do modo
  tolerante.
- Valor de `0x04` em toda partitura recebida.

### Confirmação

- G2 com a comparação elementar passando em ≥ 10 partituras reais e nas 24 controladas.
- Teste com arquivo `0x04 ≠ 0xC4` esperando `EncoreFormatError`.
- Revisão de código: nenhum trecho derivado do Enc2MusicXML.

## Análise das opções

### A — GO, com partituras reais como condição do G2 (escolhida)

- Bom, porque aproveita o adiantamento e mantém a meta de amostras.
- Ruim, porque o retrabalho no parser fica possível se as partituras novas divergirem.

### B — GO com exceção formal

- Bom, porque não depende de ninguém conseguir arquivos.
- Ruim, porque 3 partituras de um acervo não sustentam a meta de 90% de abertura do G4.

### C — NO-GO

- Bom, porque o parser só começa com a amostragem completa.
- Ruim, porque deixa o desenvolvedor parado esperando arquivos, e o formato já está comprovado para
  o MVP.

## Mais informações

- `docs/CRONOGRAMA — Visualizador Web de Partituras Encore (.enc).md`, v2.0.
- `docs/enc-format.md`, seções 8 e 11.
