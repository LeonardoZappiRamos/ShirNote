# 0006 — Adotar SQLite local e MusicXML como formato canônico da biblioteca

- Status: Accepted
- Data: 2026-11-04
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O app móvel precisa de uma biblioteca que funcione **offline** (RNFM-01), guarde até 8 itens no plano
grátis (RFM-13), permita transpor e editar metadados (RFM-06, RFM-07), exporte PDF e MusicXML
(RFM-08, RFM-09) e sincronize com OneDrive e Google Drive (RFM-11, RFM-12).

O MVP web não persiste nada: o arquivo é lido, convertido e desenhado. No app, o item precisa
sobreviver ao fechamento, ser listado, reaberto e sincronizado. Também é preciso decidir o que é
guardado: o `.enc` original, o MusicXML, o modelo neutro ou o PDF.

## Forças que guiam a decisão

- Offline-first: abrir a biblioteca sem rede e sem servidor.
- Reaproveitar o modelo neutro para transpor sem depender de um leitor de MusicXML.
- MusicXML é o formato de troca já gerado e validado contra o XSD (RF-08).
- PDFs importados podem ser grandes; não convém guardá-los como blob no banco.
- A sincronização precisa comparar versões sem baixar o arquivo inteiro.
- O limite do grátis precisa ser uma contagem confiável e local.
- Migrações futuras não podem perder a biblioteca do usuário.

## Opções consideradas

- **A — SQLite (`expo-sqlite`) para metadados e MusicXML, PDFs como arquivo no diretório do app.**
- **B — AsyncStorage/JSON por item**, sem banco relacional.
- **C — Banco embutido orientado a objetos** (Realm/WatermelonDB).
- **D — Guardar só o arquivo original** (`.enc`, `.xml`, `.pdf`) e converter a cada abertura.
- **E — Biblioteca na nuvem**, com o aparelho como cache.

## Decisão

**Opção escolhida: A — SQLite local, com MusicXML como formato canônico e PDFs como arquivos.**

1. O banco é o **SQLite do `expo-sqlite`**, com migrações versionadas e `PRAGMA journal_mode=WAL`.
2. A tabela `scores` guarda metadados e o conteúdo:
   - `kind`: `enc`, `musicxml` ou `pdf`;
   - `musicxml`: o XML canônico da partitura (nulo para PDF);
   - `score_json`: o modelo neutro serializado, **só** para itens vindos de `.enc`, que são os que
     podem ser transpostos na v1;
   - `file_uri`: caminho do PDF no diretório do app;
   - `transposition`: o deslocamento atual em semitons;
   - `created_at` e `updated_at` em UTC (ISO 8601).
3. O **`.enc` original não é guardado**. Depois da importação, a fonte de verdade é o MusicXML gerado;
   guardar o binário duplicaria o acervo e não acrescentaria nada à leitura.
4. **MusicXML importado** fica somente leitura na v1: transpor exigiria um leitor de MusicXML para o
   modelo neutro, que fica no backlog. A interface desabilita o controle e explica.
5. **PDF importado** é copiado para o diretório de documentos do app e indexado no banco; o conteúdo
   não entra no SQLite.
6. A sincronização usa `updated_at` + hash do conteúdo para decidir o que enviar e baixar.
7. O limite do grátis é `COUNT(*)` em `scores`; a regra de negócio fica na camada de domínio do app
   (`apps/mobile/src/library`), não na tela.
8. O banco guarda uma única linha de `entitlement` (ADR 0007) e uma tabela `settings` para preferências
   e última posição de leitura.

### Consequências positivas

- A biblioteca abre sem rede e sem servidor.
- Transpor é uma operação pura sobre `score_json`, sem reparsear MusicXML.
- Exportar MusicXML é devolver o texto já guardado; exportar PDF usa o mesmo XML.
- O banco não incha com PDFs; o sistema operacional cuida do arquivo.
- A sincronização compara metadados e hash antes de transferir.

### Consequências negativas

- Duas fontes para o mesmo item (`musicxml` e `score_json`) podem divergir; toda escrita precisa
  atualizar as duas na mesma transação.
- MusicXML importado não pode ser transposto até existir o importador.
- Migrações de esquema passam a ser um risco operacional.
- O `.enc` original não fica no aparelho; se o parser mudar, não há como reprocessar sem o arquivo
  original. O usuário pode reimportar.

### Consequências neutras / a monitorar

- O tamanho da biblioteca e o tempo de abertura entram na régua do G6/G7.
- Um backup/exportação da biblioteca inteira pode ser necessário antes da loja.
- Se o importador de MusicXML entrar, `score_json` passa a valer para os dois tipos e a limitação
  desaparece.

### Confirmação

- O app abre a biblioteca em modo avião.
- Um item `.enc` transposto e reaberto mantém o tom.
- Um PDF importado continua abrindo depois de reiniciar o app.
- O nono item no grátis é recusado com mensagem clara (RFM-13, RFM-17).
- `src/music` continua sem conhecer SQLite, React Native ou sistema de arquivos.

---

## Análise das opções

### A — SQLite + arquivos (escolhida)

- **Bom:** consultas, contagem do limite, migrações e sincronização por metadados.
- **Bom:** PDFs fora do banco; o conteúdo grande não pesa nas consultas.
- **Ruim:** exige migrações e cuidado com transações.

### B — AsyncStorage/JSON

- **Bom:** simples de começar.
- **Ruim:** sem consultas, sem transações, contagem e busca viram código manual; não escala para a
  biblioteca com PDFs e sincronização.

### C — Realm/WatermelonDB

- **Bom:** consultas reativas e sincronização pronta.
- **Ruim:** dependência grande, com histórico de manutenção irregular no Expo; o produto não precisa
  de reatividade de banco.

### D — Só o arquivo original

- **Bom:** nada se perde.
- **Ruim:** reparsear a cada abertura, sem transposição para MusicXML e sem metadados consultáveis;
  o `.enc` original voltaria a ser obrigatório.

### E — Biblioteca na nuvem

- **Bom:** vários aparelhos sem sincronização própria.
- **Ruim:** viola o offline-first e a privacidade (RNFM-01, RNFM-02); exige servidor de arquivos que o
  produto não quer manter.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — seções 7 e 9.
- [ADR 0005](0005-adotar-expo-e-webview-com-osmd-no-app-movel.md) — stack do app.
- [ADR 0007](0007-validar-compra-no-backend-e-conceder-direito.md) — direito de uso guardado no banco.
- Supersede: —
- Supersedido por: —
