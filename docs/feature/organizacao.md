# Organização da biblioteca

- Versão: 1.0 (proposta, nada implementado)
- Data: 2026-11-08
- Requisitos: RFM-21, RFM-24, RFM-25, RFM-26 (PRD móvel v2.1)
- Decisões: [ADR 0010](../decisions/0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md)
  (organização sincroniza com a conta), [ADR 0012](../decisions/0012-exigir-nome-unico-na-biblioteca.md)
  (nomes únicos)
- Código: ainda não existe (Fase 9)

Pedido do owner (Q10): pastas, etiquetas, setlists e o que mais ajudar a achar a partitura. Tudo aqui
vale no app e na web, igual, para quem tem conta; sem conta, só no aparelho.

---

## 1. Pastas (RFM-21)

- Uma partitura fica em **uma pasta ou em nenhuma** ("Sem pasta").
- Pastas podem ter subpastas, até 3 níveis ("Repertório › Natal › Coral").
- Nome único dentro da mesma pasta-mãe (mesma comparação do ADR 0012).
- Mover: tocar e segurar no item, ou arrastar na web. Vários itens de uma vez.
- Excluir pasta: os itens voltam para "Sem pasta"; **nunca** são excluídos junto.

## 2. Etiquetas (RFM-24)

- Uma partitura pode ter **várias** etiquetas ("Flauta", "Natal", "Ensaio de sábado").
- Etiqueta nasce ao ser digitada pela primeira vez; o app sugere as que já existem.
- Nome único na biblioteca, sem diferenciar maiúscula e acento.
- Apagar uma etiqueta tira ela de todos os itens; os itens ficam.

## 3. Setlists (RFM-25)

Lista **ordenada** de partituras para um ensaio ou culto.

- Uma partitura pode estar em várias setlists e mais de uma vez na mesma (repetição na ordem).
- Reordenar arrastando. Nome único na biblioteca.
- **Modo setlist na leitura:** ao abrir uma partitura pela setlist, aparecem "anterior" e "próxima"
  e a posição ("3 de 8"). Chegar ao fim da partitura e deslizar abre a próxima.
- Excluir a setlist não exclui as partituras. Excluir uma partitura tira ela das setlists.

## 4. Navegar e filtrar (RFM-26)

- **Filtros** combináveis: pasta, etiqueta, tipo (Encore, MusicXML, PDF) e tom (original ou
  transposto).
- **Busca** procura em nome, título, autor e etiquetas.
- **Ordem:** mais recentes, nome, último aberto.
- **Recentes:** as 10 últimas abertas, no topo da biblioteca.
- **Favoritas:** marcar com estrela e filtrar.

## 5. Planos

Pastas, etiquetas, setlists, filtros e favoritas valem em **todos os planos**. O limite é só de itens
(grátis 8, Pro 50; PRD seção 7).

## 6. Dados (para o TECHSPEC na Fase 9)

Entram no protocolo de sincronização do ADR 0010 como metadados: `folders` (`id`, `parent_id`,
`name`), `tags` (`id`, `name`), `score_tags`, `setlists` (`id`, `name`), `setlist_items` (`setlist_id`,
`score_id`, `position`), e `scores.folder_id`, `scores.favorite`, `scores.last_opened_at`.
`last_opened_at` e `favorite` ficam também no aparelho sem conta.
