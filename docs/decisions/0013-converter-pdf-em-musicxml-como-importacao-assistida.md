# 0013 — Converter PDF em MusicXML como importação assistida, com o PDF original local

- Status: Accepted; itens 1 e 5 (quem converte) Superseded by ADR-0014
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: —
- Informados: —

---

## Contexto e Problema

O estudo de PDF para MusicXML ([`feature/pdf-para-musicxml.md`](../feature/pdf-para-musicxml.md),
v0.2) mediu o Audiveris 5.11.0: em PDF limpo, 99,0% a 100% das alturas certas, mas 88,7% a 98,1%
somando a duração; em PDF escaneado, 84,8% a 95,4% das alturas. A conversão é útil, mas não é
confiável o bastante para acontecer sem a pessoa ver o resultado.

O owner decidiu em 08/11/2026: **a conversão fica a cargo de quem importa**, o ShirNote avisa que
pode haver erro, e o **PDF original continua disponível**, guardado no aparelho e, se a pessoa
conectou OneDrive ou Google Drive, sincronizado lá.

## Forças que guiam a decisão

- A pessoa decide e confere; o ShirNote não promete exatidão que não tem.
- O PDF original nunca se perde e está sempre a um toque da partitura convertida.
- PDF não é guardado no servidor do ShirNote (ADR 0010, item 2).
- O Audiveris precisa de Java e de até 8 GB de memória: não roda no Android.
- Licença AGPL-3.0 do Audiveris.

## Decisão

1. **Opcional.** Ao importar um PDF, o padrão é **"Guardar como PDF"**. A segunda opção é **"Tentar
   converter em partitura (pode ter erros)"**.
2. **Aviso antes e depois.** Antes: "A conversão reconhece as notas pela imagem e pode errar notas e
   ritmo. O PDF original fica guardado junto." Depois, no topo da partitura convertida, até a pessoa
   dispensar: "Convertida de PDF. Confira com o original." e o botão **"Ver PDF original"**.
3. **Resultado.** A partitura convertida é um item normal da biblioteca (MusicXML; transpõe,
   sincroniza com a conta, aparece na web), ligada ao PDF original.
4. **PDF original.** Fica no aparelho (`Paths.document/scores/<id>.pdf`) e, se houver nuvem pessoal
   conectada, na pasta do ShirNote no OneDrive/Google Drive (ADR 0008). **Não** é guardado no servidor.
   Em outro aparelho ou na web, "Ver PDF original" abre a cópia do OneDrive/Google Drive se existir;
   se não, diz "O PDF original está no aparelho onde foi importado."
5. **Onde converte.** No backend, numa fila separada da API, com o Audiveris como processo à parte e
   sem modificação. O PDF vai ao servidor **só para converter** e é apagado ao fim da tarefa (sucesso
   ou falha); o servidor guarda apenas o MusicXML resultante. Por isso a conversão exige conta com
   e-mail verificado.
6. **Ajustar.** Na v1, ajustar é: conferir com o original, descartar a conversão e ficar com o PDF, ou
   exportar o MusicXML, corrigir num programa externo e importar de novo (a regra de duplicados do ADR
   0012 vale). Corrigir nota a nota dentro do ShirNote depende do editor futuro (PRD, seção 2).
7. **Falha.** Se o Audiveris não reconhecer nada ou der erro, o PDF continua importado como PDF e a
   pessoa vê "Não foi possível converter este PDF. Ele continua na biblioteca como PDF."
8. **Escaneado e foto** podem ser tentados, com o mesmo aviso. Nenhum filtro de qualidade na v1.

### Consequências positivas

- Quem tem acervo só em PDF ganha transposição e web, sabendo o risco.
- O original nunca some, e comparar é um toque.
- O servidor não guarda PDF: custo e privacidade como no ADR 0010.

### Consequências negativas

- O PDF passa pelo servidor durante a conversão: precisa estar na política de privacidade.
- Servidor de conversão com bastante memória e uma fila para operar.
- Sem editor, corrigir erro de ritmo exige programa externo.
- A web e outros aparelhos sem nuvem pessoal não abrem o PDF original.

### Consequências neutras / a monitorar

- Tempo de fila e custo por página (medido: ~5 s por página na máquina de desenvolvimento).
- Uso de "Ver PDF original" e de "descartar conversão": se for alto, a conversão não está ajudando.
- Validar a AGPL-3.0 com jurídico antes de abrir a conversão ao público.
- Repetir o estudo com PDFs exportados pelo Encore (estudo, seção 7).

### Confirmação

- Importar PDF sem escolher nada guarda como PDF, sem chamar o servidor.
- Converter mostra o aviso antes; o resultado mostra a faixa e "Ver PDF original".
- Depois da conversão, o PDF não existe no servidor (conferir armazenamento e logs da tarefa).
- Com OneDrive conectado, outro aparelho abre o PDF original pela nuvem pessoal.
- Um PDF sem partitura (texto puro) termina como PDF, com a mensagem de falha.

---

## Mais informações

- [`feature/pdf-para-musicxml.md`](../feature/pdf-para-musicxml.md) — estudo e medições.
- [ADR 0008](0008-sincronizar-biblioteca-com-onedrive-e-google-drive.md) — nuvem pessoal.
- [ADR 0010](0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md) — PDF fora do servidor.
- [ADR 0012](0012-exigir-nome-unico-na-biblioteca.md) — duplicados.
- [Audiveris](https://github.com/Audiveris/audiveris) — AGPL-3.0.
- Supersede: —
- Supersedido por: [ADR 0014](0014-importar-pdf-para-leitura-converter-no-pro-e-substituir-duplicado.md): PDF entra só para leitura; converter é ação do Pro
