# Sincronização

- Versão: 1.0 (proposta, nada implementado)
- Data: 2026-11-08
- Requisitos: RFM-11, RFM-12, RFM-20, RFM-21, RFM-22, RNFM-01, RNFM-02 (PRD móvel v2.0)
- Decisões: [ADR 0010](../decisions/0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md)
  (conta) e [ADR 0008](../decisions/0008-sincronizar-biblioteca-com-onedrive-e-google-drive.md)
  (OneDrive e Google Drive)
- Código: ainda não existe (Fases 9 e 12)

Este documento diz como a biblioteca anda entre aparelho, web e nuvem pessoal.

---

## 1. Dois caminhos

| Caminho | Para quem | O que faz |
| --- | --- | --- |
| **Conta ShirNote** | Grátis com conta (até 8 itens) e Pro | Biblioteca igual no app, na web e em outro aparelho. Automática. |
| **OneDrive / Google Drive** | Pro, opcional | Cópia da biblioteca na nuvem da própria pessoa. Espelho da conta. |

Sem conta, nada sincroniza: a biblioteca fica só no aparelho.

## 2. Conta ShirNote

O que vai para o servidor, por item: título, autor, tipo, tom atual, pasta e o **MusicXML original**
(sem transposição). Itens de `.enc` levam também o modelo neutro, para transpor na web. O `.enc` e os
PDFs não vão: o PDF original fica no aparelho e, se conectado, no
OneDrive/Google Drive. Uma partitura convertida de PDF sincroniza o MusicXML; o PDF original segue
esse mesmo caminho (ADR 0013).

Quando sincroniza, sem tocar em botão:

- ao abrir o app;
- ao voltar a ter rede;
- logo depois de importar, transpor, renomear, mover de pasta ou excluir.

Na biblioteca, cada item mostra um estado discreto: **sincronizado**, **aguardando rede** ou **não
sincronizado** (fora do limite do grátis). Um toque no estado da conta força a sincronização.

Offline: tudo continua funcionando no aparelho; as alterações esperam a rede.

## 3. Conflito

Acontece quando o mesmo item mudou em dois lugares antes de um deles sincronizar (por exemplo:
transposto no tablet sem rede e renomeado na web).

- Nada é sobrescrito. A versão do servidor fica com o item original; a do aparelho vira um item novo
  "*Nome* (conflito)", ou "*Nome* (conflito) 1" se esse nome já existir (ADR 0012).
- Aviso: "Esta partitura mudou em outro aparelho. As duas versões foram mantidas."
- A pessoa abre as duas e exclui a que não quer.

Mudanças que não se chocam (título num lugar, pasta no outro) também geram conflito nesta versão:
o protocolo compara o item inteiro. Mesclar campo a campo fica para depois, se incomodar no uso.

## 4. Excluir

- Excluir num lugar exclui nos outros na próxima sincronização.
- O servidor lembra da exclusão por 30 dias. Um aparelho que ficar mais tempo sem sincronizar recebe
  a biblioteca inteira de novo e os itens excluídos somem dele.
- Não há lixeira nesta versão.

## 5. Limites do plano com conta

- O servidor guarda até 8 itens no grátis e 50 no Pro. O item além do limite é recusado no
  aparelho, antes de importar, com a mesma mensagem de hoje ([`biblioteca.md`](biblioteca.md),
  seção 4).
- Quem volta do Pro para o grátis com mais de 8 itens: tudo continua legível no app e na web; nada é
  apagado. Só importar e criar ficam bloqueados até voltar a menos de 8.

## 6. Web

- Logado, a web mostra a mesma biblioteca: buscar, ordenar, abrir, organizar em pastas e, no Pro,
  transpor, editar e exportar PDF.
- Importar `.enc` ou MusicXML na web cria o item na conta e ele aparece no app.
- Sem login, a web continua sendo o modo demonstração: abre `.enc` do computador e não envia nada.

## 7. OneDrive e Google Drive (Pro, opcional)

Como no ADR 0008 (pasta do app, escopo mínimo, OAuth com PKCE), com uma mudança: com conta, a nuvem
pessoal é **espelho** da biblioteca da conta.

- O app envia para a pasta do ShirNote o MusicXML e os PDFs de cada item.
- Arquivo `.enc`, `.musicxml` ou `.pdf` colocado na pasta por fora entra como **importação** na
  próxima sincronização.
- Conflito entre a conta e a nuvem pessoal não existe: a conta decide.
- Desconectar não apaga nada na nuvem.

## 8. Organização e duplicados

- Pastas, etiquetas, setlists e favoritas sincronizam como metadados: ver
  [`organizacao.md`](organizacao.md).
- O servidor recusa nome repetido na biblioteca da conta e sugere o próximo número livre
  ([ADR 0012](../decisions/0012-exigir-nome-unico-na-biblioteca.md)). Arquivo que chega pela pasta do
  OneDrive com nome repetido entra na lista de duplicados da importação em lote.
