# 0010 — Guardar a biblioteca da conta no backend em MusicXML

- Status: Accepted; item 4 (Pro sem limite) substituído pelo PRD v2.1 (Pro com 50 itens)
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: usuário de teste (Beit)
- Informados: —

---

## Contexto e Problema

O owner pediu, em 08/11/2026, três coisas que o desenho atual não atende:

1. **Organizar as partituras** e ver a mesma biblioteca **na web e no app**.
2. Guardar a partitura num formato que permita, no futuro, **criar e editar** a partitura de forma
   avançada.
3. Manter OneDrive e Google Drive **como opção** de quem quiser.

O ADR 0008 escolheu sincronizar só com OneDrive e Google Drive e recusou guardar arquivos num
servidor do ShirNote (opção B, por privacidade e custo). Mas a web não lê a pasta do OneDrive de cada
pessoa de forma confiável, e organizar exige um índice comum que o app e a web consultem. Com
conta (ADR 0009), a biblioteca precisa de um lugar no servidor.

## Forças que guiam a decisão

- App e web veem a mesma biblioteca e as mesmas pastas, títulos e tons.
- O app continua offline-first: lê, importa e transpõe sem rede (RNFM-01).
- Formato aberto e editável no servidor, pronto para um editor futuro (ADR 0006 já usa MusicXML).
- Privacidade: só vai ao servidor a biblioteca de quem criou conta e sincroniza (RNFM-02, revisado).
- Custo baixo: um MusicXML típico tem dezenas a centenas de KB.
- Nada é perdido em conflito.
- OneDrive e Google Drive continuam disponíveis (ADR 0008 segue valendo).

## Opções consideradas

- **A — Backend guarda MusicXML e metadados no PostgreSQL**; app e web sincronizam com ele.
- **B — Backend guarda só metadados**; os arquivos continuam no OneDrive/Google Drive.
- **C — Arquivos em object storage (S3/R2)** e metadados no PostgreSQL.
- **D — Manter só o ADR 0008** e fazer a web ler a nuvem pessoal.

## Decisão

**Opção escolhida: A — MusicXML e metadados no PostgreSQL do backend.**

1. **Formato canônico: MusicXML.** O servidor guarda o MusicXML **original** de cada item (sem
   transposição) e o tom atual (`transposition`). Itens vindos de `.enc` levam também o modelo neutro
   (`score_json`), enquanto não houver leitor de MusicXML para o modelo neutro. Quando esse leitor
   existir, `score_json` deixa de ser sincronizado. O `.enc` original não vai ao servidor.
2. **Armazenamento.** Coluna de texto no PostgreSQL (o banco comprime valores grandes sozinho). Item
   acima de 5 MB é recusado com aviso. PDF fica fora do servidor nesta versão: continua no aparelho e
   no OneDrive/Google Drive (questão Q8 do PRD).
3. **Quem sincroniza.** Só quem tem conta com e-mail verificado e está logado. Sem conta, nada sai do
   aparelho.
4. **Limite do plano no servidor.** O grátis guarda até 8 itens também no servidor; o backend recusa o
   9º. O Pro não tem limite de itens; uma cota de proteção contra abuso fica em aberto (Q9).
5. **Fonte da verdade.** Para quem tem conta, o servidor é a fonte da verdade da biblioteca. O SQLite
   do app é a cópia de trabalho offline.
6. **Protocolo.** Cada item tem `id` (UUID gerado no aparelho ou na web) e `revision` (inteiro dado
   pelo servidor).
   - **Enviar:** o app manda a alteração com a `revision` em que se baseou. Se bater, o servidor
     grava e devolve a nova `revision`. Se não bater, é conflito (item 7).
   - **Receber:** o app pede as mudanças desde o último cursor (`GET /v1/library/changes?since=`).
   - **Excluir:** o servidor guarda uma marca de exclusão (tombstone) por 30 dias para que os outros
     aparelhos também removam.
   - **Quando:** ao abrir o app, ao voltar a ter rede e logo depois de cada alteração. Não depende de
     tocar em "Sincronizar".
7. **Conflito.** O mesmo princípio do ADR 0008: nada é sobrescrito. A versão do servidor fica com o
   `id`; a local vira um item novo com o sufixo "(conflito)" e o usuário é avisado (RFM-17).
8. **Organização.** Pastas e o que mais o owner definir para organizar (RFM-21) são metadados do
   servidor e entram no mesmo protocolo.
9. **OneDrive e Google Drive.** Continuam como no ADR 0008, como opção do Pro para quem quiser uma
   cópia na própria nuvem. Como o Pro exige conta (ADR 0009), a nuvem pessoal é sempre um
   **espelho** da biblioteca da conta: recebe o MusicXML e os PDFs, mas não decide conflito com o
   servidor.
10. **Web.** A web passa a ter área logada com a biblioteca da conta, usando o mesmo núcleo
    (`src/enc`, `src/music`, `src/musicxml`) e o mesmo OSMD. Sem login, o site continua abrindo
    `.enc` local, sem enviar nada (modo demonstração).

### Contrato mínimo (acréscimo ao ADR 0007)

| Rota | Uso |
| --- | --- |
| `GET /v1/library/changes?since=<cursor>` | Itens, pastas e exclusões alterados desde o cursor |
| `PUT /v1/library/scores/:id` | Cria ou altera um item; leva `baseRevision`; 409 em conflito |
| `DELETE /v1/library/scores/:id` | Exclui; leva `baseRevision` |
| `GET /v1/library/scores/:id/musicxml` | Conteúdo do item, separado da lista para a lista ficar leve |

Tabela principal: `library_scores` (`id`, `user_id`, `title`, `composer`, `kind`, `musicxml`,
`score_json`, `transposition`, `content_hash`, `revision`, `deleted_at`, `created_at`,
`updated_at`). Toda consulta filtra por `user_id` da sessão.

### Consequências positivas

- App e web veem a mesma biblioteca, com organização comum.
- O MusicXML no servidor é a base do editor futuro.
- Sincronização automática, sem o usuário lembrar de tocar num botão.
- Quem não quer conta continua com tudo no aparelho.

### Consequências negativas

- O ShirNote passa a guardar arquivos do usuário: custo, backup, responsabilidade e LGPD. A opção
  recusada no ADR 0008 (B) passa a valer para quem tem conta.
- O backend deixa de ser só de direitos: cresce em código, testes e operação.
- Dois caminhos de nuvem (servidor e OneDrive/Google Drive) para manter.
- Conflitos ainda geram duplicatas que o usuário resolve à mão.

### Consequências neutras / a monitorar

- Tamanho do banco: medir por usuário; se passar de algumas centenas de MB, avaliar a opção C.
- Backup do PostgreSQL e teste de restauração antes de abrir para usuários reais.
- Política de privacidade: dizer o que é guardado, por quanto tempo, e como excluir (ADR 0009, item 8).

### Confirmação

- Importar no app com conta; o item aparece na web sem ação manual.
- Mudar o título na web; o app recebe a mudança ao abrir.
- Editar o mesmo item offline no app e na web; sincronizar gera "(conflito)" sem perder versão.
- Grátis com conta: o 9º item é recusado no servidor, com a mensagem do limite.
- Sem conta, em modo avião, o app funciona e nenhuma chamada de biblioteca é feita.
- Excluir a conta remove a biblioteca do servidor.

---

## Análise das opções

### A — MusicXML no PostgreSQL (escolhida)

- **Bom:** uma peça só (o banco) para metadados, conteúdo e transação.
- **Bom:** volume pequeno; backup único.
- **Ruim:** banco cresce com conteúdo; PDF não cabe bem aqui.

### B — Só metadados no servidor

- **Bom:** arquivos continuam na nuvem do usuário.
- **Ruim:** quem não tem OneDrive/Google Drive não vê nada na web; a web depende de duas APIs de
  terceiros para abrir uma partitura.

### C — Object storage

- **Bom:** escala melhor e serve PDF.
- **Ruim:** mais uma peça, mais um segredo e consistência entre banco e arquivo. Fica para quando o
  volume ou o PDF exigir.

### D — Só ADR 0008

- **Bom:** nenhum arquivo no servidor.
- **Ruim:** não atende à web nem à organização comum pedidas pelo owner.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — v2.0.
- [`feature/sincronizacao.md`](../feature/sincronizacao.md) — comportamento da sincronização.
- [ADR 0006](0006-adotar-sqlite-e-musicxml-como-formato-da-biblioteca.md) — MusicXML como formato.
- [ADR 0008](0008-sincronizar-biblioteca-com-onedrive-e-google-drive.md) — continua valendo; com
  conta, a nuvem pessoal vira espelho.
- [ADR 0009](0009-adotar-conta-shirnote-com-senha-e-login-google.md) — contas.
- Supersede: —
- Supersedido por: —
