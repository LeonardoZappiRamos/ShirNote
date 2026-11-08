# Biblioteca

- Versão: 1.0
- Data: 2026-11-08
- Requisitos: RFM-01, RFM-02, RFM-04, RFM-07, RFM-13, RFM-16, RFM-17 (PRD móvel)
- Código: `apps/mobile/src/library/` (`importFile.ts`, `importScore.ts`, `format.ts`, `plan.ts`,
  `repository.ts`) e as telas `app/index.tsx`, `app/score/[id].tsx`, `app/edit/[id].tsx`
- Testes: `format.test.ts`, `importFile.test.ts`, `plan.test.ts` na mesma pasta

Este documento diz o que a pessoa vê e pode fazer na biblioteca do app. Como os dados são gravados
está no [TECHSPEC](../TECHSPEC%20—%20App%20Móvel%20ShirNote.md) (§4 e §6.1).

---

## 1. Importar

| Arquivo | O que acontece | Estado |
| --- | --- | --- |
| `.enc` | Convertido no aparelho para o modelo neutro e para MusicXML. Pode ser transposto. | feito |
| `.musicxml`, `.xml` | Guardado como está. Abre para leitura, mas não transpõe. | feito |
| `.pdf` | Leitura com paginação e zoom. | planejado (TECHSPEC §6.4) |
| "Abrir com" do Android | Importar direto de outro app. | planejado |

Regras:

1. O título vem do próprio arquivo. Se o `.enc` não tiver título, vale o nome do arquivo sem
   extensão; se nem isso existir, "Partitura sem título". **Muda na Fase 9 (ADR 0012):** o nome
   principal do item passa a ser o nome do arquivo, único na biblioteca; o título do `.enc` vira
   metadado, porque partes de instrumentos diferentes trazem o mesmo título.
2. O autor vem do `.enc` quando existe. MusicXML entra sem autor.
3. Nada sai do aparelho: a conversão é local (RNFM-02).
4. No grátis, o limite é conferido **antes** de abrir o seletor (seção 4).
5. **Duplicados (Fase 9, ADR 0012):** mesmo nome ou mesmo conteúdo pergunta antes; o padrão é
   cancelar, e aceitar importa como "*Nome* 1". Renomear para nome existente é recusado.

Mensagens de erro (RFM-17):

| Situação | Mensagem |
| --- | --- |
| Limite do grátis | "O plano grátis guarda até 8 partituras. Exclua um item ou conheça o ShirNote Pro…" |
| Extensão desconhecida | "Formato não suportado. Escolha um arquivo .enc, .musicxml ou .xml." |
| `.enc` inválido | A mensagem do leitor do `.enc`, ou "O arquivo .enc não pôde ser convertido em partitura." |
| MusicXML inválido | "O arquivo não parece ser um MusicXML válido." |
| Falha ao ler o arquivo | "Não foi possível ler o arquivo selecionado." |

Avisos do modo tolerante (trecho do `.enc` lido por aproximação) não impedem a importação. Hoje só
são contados; a tela ainda não mostra o detalhe.

## 2. Listar, buscar e ordenar

- Cada item mostra título, autor, tipo (Encore, MusicXML ou PDF), tom ("Tom original" ou "+2
  semitons") e data da última alteração (`dd/mm/aaaa`).
- A busca procura o texto em título **e** autor, sem diferenciar maiúsculas.
- Duas ordens: **mais recentes** (última alteração primeiro) e **título** (ordem alfabética do
  português, sem diferenciar acento nem maiúscula).
- Capa com a primeira página: planejada junto com o PDF (RFM-04).

## 3. Editar título e autor (Pro)

- Título é obrigatório; sem ele: "A partitura precisa de um título para aparecer na busca."
- Autor é opcional. Os dois aceitam até 200 caracteres e perdem os espaços das pontas.
- No grátis, o botão mostra o aviso do Pro em vez de abrir a edição.

## 4. Limite do plano

| Regra | Comportamento |
| --- | --- |
| Grátis guarda até 8 itens | O 9º não entra; a mensagem sugere excluir um item ou o Pro |
| O limite conta itens, não importações | Excluir libera vaga |
| Quem volta do Pro com mais de 8 | Tudo continua legível e excluível; só a importação fica bloqueada |
| Pro | Até 50 itens (PRD v2.1). **Hoje o código ainda trata o Pro como ilimitado** (`plan.ts`) |

Toda regra de plano mora em `plan.ts`. Tela nenhuma decide sozinha o que é Pro (ADR 0006, 0007).

## 5. Excluir

- Pede confirmação: "*título* será removida da biblioteca", com **Cancelar** e **Excluir**.
- Apaga o item e a posição de leitura dele juntos. Não tem lixeira.
- Disponível no grátis e no Pro.

## 6. Fora desta versão

Pastas e a biblioteca compartilhada com a web chegam com a conta (Fase 9, RFM-21): ver
[`sincronizacao.md`](sincronizacao.md), seções 6 e 8. Etiquetas e setlists dependem da Q10 do PRD.
