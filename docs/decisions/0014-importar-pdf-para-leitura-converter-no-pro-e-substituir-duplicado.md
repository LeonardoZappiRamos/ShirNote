# 0014 — Importar PDF só para leitura, converter no Pro e permitir substituir duplicado

- Status: Accepted
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: —
- Informados: —

---

## Contexto e Problema

O ADR 0013 oferecia a conversão de PDF no momento da importação, para qualquer conta. O ADR 0012 dava
duas saídas para um duplicado: cancelar ou importar com número. O owner revisou os dois em 08/11/2026:

- PDF importado é **só para leitura** e continua PDF até a pessoa decidir converter.
- Converter é recurso do **Pro** (a conversão custa servidor: até 8 GB de memória e ~5 s por página).
- Quem corrige uma partitura fora do ShirNote e importa de novo precisa poder **substituir** o
  arquivo, sem criar "Nome 1".

## Decisão

1. **Importar PDF** sempre guarda como PDF, sem pergunta e sem rede. O PDF não é editável: não
   transpõe nem muda conteúdo. Nome, pasta, etiquetas e setlists funcionam como em qualquer item.
   Substitui o item 1 do ADR 0013.
2. **Converter é uma ação do item PDF**, a qualquer momento: "Converter em partitura (Pro)". No
   grátis, mostra o aviso do Pro. Exige conta Pro com e-mail verificado. Substitui o item 5 do ADR
   0013 na parte de quem pode converter; o resto (backend, fila, PDF apagado após a tarefa) continua.
3. **A conversão transforma o mesmo item**: mantém `id`, nome, pasta, etiquetas e setlists; passa a
   ser MusicXML, com o PDF original ligado a ele. Não conta como item novo no limite do plano.
   "Voltar a ser PDF" desfaz a conversão enquanto o PDF original estiver no aparelho ou na nuvem
   pessoal.
4. **Duplicado tem três saídas** (substitui o item 4 do ADR 0012):

   | Botão | Efeito |
   | --- | --- |
   | **Cancelar** (padrão) | Nada muda |
   | **Substituir** | O conteúdo novo entra no item existente: mesmo `id`, nome, pasta, etiquetas e setlists. O tom volta a "Tom original", porque o arquivo novo já vem como está |
   | **Importar como "*Nome* 1"** | Cria outro item, com o menor número livre |

   Substituir não conta como item novo no limite do plano. Na sincronização, é uma alteração comum
   do item (ADR 0010): outro aparelho com mudança local no mesmo item gera "(conflito)".
5. **Substituir confirma antes:** "O conteúdo de '*Nome*' será trocado pelo arquivo novo. Pasta,
   etiquetas e setlists continuam." Não há como desfazer na v1.

### Consequências positivas

- Corrigir fora do ShirNote e voltar não bagunça a biblioteca nem as setlists.
- O grátis lê PDF sem custo de servidor; a conversão, que custa, fica no plano pago.
- O PDF não muda de natureza sem a pessoa pedir.

### Consequências negativas

- Substituir apaga o conteúdo anterior sem lixeira.
- Converter depois da importação exige que o PDF original ainda esteja no aparelho ou na nuvem
  pessoal.

### Confirmação

- Importar PDF no grátis guarda como PDF; "Converter" mostra o aviso do Pro.
- No Pro, converter mantém nome, pasta e setlists, e "Ver PDF original" abre o PDF.
- Importar arquivo com nome existente oferece Cancelar, Substituir e Importar como "Nome 1".
- Substituir com a biblioteca no limite do grátis funciona; importar como "Nome 1" é recusado.

---

## Mais informações

- [ADR 0012](0012-exigir-nome-unico-na-biblioteca.md) — item 4 substituído por este ADR.
- [ADR 0013](0013-converter-pdf-em-musicxml-como-importacao-assistida.md) — itens 1 e 5 (quem
  converte) substituídos por este ADR.
- [`feature/biblioteca.md`](../feature/biblioteca.md), [`feature/pdf-para-musicxml.md`](../feature/pdf-para-musicxml.md).
- Supersede: ADR 0012 item 4; ADR 0013 itens 1 e 5 (quem converte).
- Supersedido por: —
