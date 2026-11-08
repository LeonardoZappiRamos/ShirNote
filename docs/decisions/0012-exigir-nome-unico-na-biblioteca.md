# 0012 — Exigir nome único na biblioteca e numerar duplicados aceitos

- Status: Accepted
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: —
- Informados: —

---

## Contexto e Problema

Com a biblioteca no servidor (ADR 0010), o mesmo arquivo pode entrar várias vezes: importado duas
vezes no app, enviado de novo pela web, copiado do OneDrive. O owner definiu em 08/11/2026 que **não
se aceitam arquivos duplicados**: além do `id`, o **nome** precisa ser único. Se a pessoa marcar que
quer enviar mesmo assim, o nome ganha um número no fim ("Nome do Arquivo 1").

Hoje o app mostra como nome o **título gravado no `.enc`**. Isso não serve como chave: partes de
instrumentos diferentes da mesma música têm o mesmo título dentro do arquivo. Medido no acervo:
`ana-bekoach-flauta.enc` e `ana-bekoach-clarinete.enc` têm título "ANA BEKOACH";
`alegrei-flauta.enc` e `alegrei-sax-alto.enc` têm "ALEGREI-ME QUANDO ME D. (SALMO 122)". Com o
título como chave, a segunda parte viraria "ANA BEKOACH 1".

## Forças que guiam a decisão

- Nenhum duplicado entra sem a pessoa decidir.
- Partes de instrumentos diferentes da mesma música convivem sem número no nome.
- A regra vale igual no app, na web, na sincronização e na cópia do OneDrive/Google Drive.
- O servidor garante a regra; o aparelho avisa antes, para não gastar rede.

## Decisão

1. **Nome do item.** Cada item tem um **nome**, que na importação é o nome do arquivo sem extensão
   ("ANA BEKOACH - Flauta"). Título e autor do `.enc` continuam como metadados e aparecem abaixo do
   nome.
2. **Nome único por biblioteca** (por conta, ou por aparelho sem conta). A comparação ignora
   maiúsculas, acentos e espaços nas pontas: "Ana Bekoach - Flauta" e "ANA BEKOACH – flauta " são o
   mesmo nome.
3. **Conteúdo repetido também é duplicado.** O mesmo conteúdo (`content_hash`) com outro nome é
   avisado como duplicado.
4. **Ao importar um duplicado**, o app e a web perguntam: "Já existe '*Nome*' na biblioteca." com
   **Cancelar** (padrão) e **Importar como '*Nome 1*'**. O número é o menor livre: 1, 2, 3...
5. **Importação em lote** (vários arquivos, pasta do OneDrive): os duplicados são listados no fim
   com a opção "Importar todos numerados" ou "Pular duplicados".
6. **Renomear** para um nome que já existe é recusado: "Já existe uma partitura com esse nome."
7. **Conflito de sincronização** (ADR 0010, item 7): a cópia recebe "*Nome* (conflito)"; se esse
   nome já existir, "*Nome* (conflito) 1".
8. **Servidor.** Índice único por `(user_id, nome normalizado)` entre os itens não excluídos. O
   backend responde 409 com o próximo nome livre sugerido.

### Consequências positivas

- Fim de biblioteca com o mesmo arquivo três vezes.
- Partes de instrumentos diferentes ficam lado a lado sem número.
- Regra única e testável em domínio puro (`library/`), sem `if` na tela.

### Consequências negativas

- Muda o que a biblioteca mostra como nome principal (antes, o título do `.enc`). Itens já
  importados precisam de migração: o nome passa a ser o título atual, numerado se repetir.
- Duas músicas diferentes com o mesmo nome de arquivo exigem renomear ou numerar.

### Confirmação

- Importar `ana-bekoach-flauta.enc` e `ana-bekoach-clarinete.enc` gera dois itens sem número.
- Importar o mesmo arquivo duas vezes pergunta; aceitar gera "*Nome* 1".
- Renomear para nome existente é recusado no app e na web.
- O servidor recusa um segundo item com o mesmo nome normalizado, mesmo vindo de outro aparelho.

---

## Mais informações

- [`feature/biblioteca.md`](../feature/biblioteca.md) — importar e renomear.
- [`feature/sincronizacao.md`](../feature/sincronizacao.md) — conflito.
- [ADR 0010](0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md) — biblioteca no servidor.
- Supersede: —
- Supersedido por: —
