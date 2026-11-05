# 0007 — Validar a compra no backend e conceder o direito de uso

- Status: Accepted
- Data: 2026-11-04
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O produto tem um plano grátis (8 itens, só leitura) e um plano Pro pago (PRD do app móvel, seção 7).
A cobrança acontece na Play Store, mas **quem libera o recurso é o app**. Se o app confiar apenas na
resposta local, qualquer alteração no banco ou no armazenamento libera o Pro sem pagamento.

O dono do produto definiu a arquitetura desejada em 04/11/2026: a loja processa o pagamento, o backend
valida a compra e controla o direito; o banco guarda usuário/produto/token/status/validade; notificações
em tempo real tratam renovação, cancelamento, carência e reembolso. Este ADR registra essa decisão e o
contrato mínimo para implementá-la.

## Forças que guiam a decisão

- Nunca liberar recurso pago com base em resposta do app (RNFM-09).
- Funcionar offline: o músico usa o app em ensaio, sem rede (RNFM-01).
- Tratar renovação, cancelamento, carência e reembolso sem depender de o usuário abrir o app.
- Custo e operação compatíveis com um desenvolvedor só.
- Poder acrescentar iOS depois sem refazer o modelo de direitos.
- Não criar conta ShirNote na v1 se a loja já identifica a compra.

## Opções consideradas

- **A — Backend próprio** com validação na Google Play Developer API, banco de direitos e RTDN.
- **B — Validar só no app**, com o token guardado localmente.
- **C — RevenueCat** (ou equivalente), terceirizando validação e entitlements.
- **D — Licença manual**, sem compra in-app.

## Decisão

**Opção escolhida: A — backend próprio, com a loja como fonte da verdade.**

1. **Compra no app.** O app usa a Play Billing Library (biblioteca compatível com Expo, em
   *development build*) para listar planos e iniciar a compra. O app **não** decide se o usuário é Pro.
2. **Validação no backend.** Ao concluir, o app envia `productId` e `purchaseToken` ao backend. O
   backend confere o pacote e o produto, chama a Google Play Developer API
   (`purchases.subscriptionsv2.get` para assinatura; `purchases.products.get` para compra única),
   confere o estado e grava o direito.
3. **Reconhecimento (acknowledge).** O backend faz o acknowledge da compra (obrigatório em até 3 dias),
   não o app.
4. **Direito de uso.** O backend devolve um **token assinado** (JWT Ed25519) com `plan`, `status`,
   `exp` e um identificador do direito. O app verifica a assinatura com a chave pública embutida e
   guarda o token no `expo-secure-store`. O banco local guarda só o necessário para exibir o estado.
5. **Offline.** O token vale por **14 dias** (carência). Sem rede, o app usa o token válido e continua
   Pro. Com rede, revalida no backend e renova. Vencida a carência sem revalidação, o app volta ao
   grátis, mas **não apaga nem bloqueia a leitura** do que já está na biblioteca.
6. **Tempo real.** O backend expõe `POST /v1/rtdn`, receptor das notificações do Google Pub/Sub
   (Real-time Developer Notifications), com verificação OIDC. Cada notificação atualiza o estado e
   dispara nova consulta à Google antes de gravar. Reembolso (`voidedPurchaseNotification`) revoga.
7. **Identidade.** Não há conta ShirNote na v1. O direito é identificado pelo `purchaseToken` (único,
   com índice exclusivo) e pode ser restaurado em outro aparelho porque a Play Billing devolve as
   compras da conta Google; o app reenvia o token e recebe o direito de novo.
8. **Stack de referência do backend:** Node 22 + Fastify + PostgreSQL (Neon), publicado em Fly.io,
   com segredos na plataforma. É uma escolha de referência: o contrato vale mesmo se a hospedagem
   mudar.
9. **iOS (v1.1).** O mesmo modelo com App Store Server API e App Store Server Notifications V2,
   `source: "app_store"`. Nada no app precisa mudar além do adaptador de loja.

### Contrato mínimo

| Rota | Uso | Regra |
| --- | --- | --- |
| `POST /v1/entitlements/verify` | App envia `platform`, `productId`, `purchaseToken`, `packageName` | Idempotente; valida na Google; devolve direito assinado |
| `GET /v1/entitlements/me` | Revalidar/renovar o token | Exige o token atual; devolve estado e novo token |
| `POST /v1/rtdn` | Notificação do Google | Verifica OIDC; atualiza o banco; responde 204 |

Modelo de dados do backend:

- `purchases`: `id`, `platform`, `product_id`, `purchase_token_hash` (único), `token_ciphertext`,
  `status` (`active`/`in_grace`/`on_hold`/`revoked`/`expired`), `expires_at`, `auto_renewing`,
  `acknowledged_at`, `last_verified_at`, `raw_state` (JSON), `created_at`, `updated_at`.
- `entitlements`: `purchase_id`, `plan` (`pro`), `status`, `valid_until`, `updated_at`.
- `events`: log append-only de transições, com origem (`verify`/`rtdn`) e payload.

### Consequências positivas

- O app não consegue liberar o Pro sozinho; a decisão fica no servidor.
- Renovação, carência e reembolso chegam mesmo com o app fechado.
- O token assinado permite 14 dias offline sem consultar a rede.
- O mesmo contrato serve para a App Store depois.

### Consequências negativas

- Existe um serviço a manter, monitorar e pagar (mesmo pequeno).
- A primeira compra depende de rede; sem ela, o app não libera o Pro.
- O backend precisa guardar tokens com cuidado (criptografia em repouso e hash para busca).
- A publicação do Pro só pode acontecer depois do backend no ar e do RTDN configurado.
- Um token assinado embutido pode ser extraído de um app modificado; a proteção é dissuasão, não DRM
  perfeito.

### Consequências neutras / a monitorar

- Latência da validação na primeira compra (meta: ≤ 3 s).
- Custos de hospedagem e do banco; o volume inicial é baixo.
- A política de privacidade precisa dizer quais dados de compra são guardados.
- A Play Console exige a conta de desenvolvedor e a configuração dos produtos antes do G10.

### Confirmação

- Sem token válido, o app não libera transpor, exportar nem sincronizar.
- Uma compra de teste libera o Pro; reinstalar e restaurar mantém o direito.
- Um reembolso de teste revoga o Pro após a notificação.
- Em modo avião, dentro da carência, o Pro continua; vencida a carência, volta ao grátis sem apagar
  a biblioteca.
- Nenhum segredo da loja ou do backend está no aplicativo.

---

## Análise das opções

### A — Backend próprio (escolhida)

- **Bom:** controle total, contrato claro e independência de terceiros.
- **Bom:** atende à exigência de validar no servidor e tratar RTDN.
- **Ruim:** operação e custo de um serviço a mais.

### B — Só no app

- **Bom:** zero backend.
- **Ruim:** qualquer edição local libera o Pro; não atende ao RNFM-09 nem às regras das lojas.

### C — RevenueCat

- **Bom:** validação, restauração e painel prontos.
- **Ruim:** custo recorrente e dependência de terceiro; o dono pediu backend próprio com banco de
  direitos. Pode ser reavaliado se a operação ficar cara.

### D — Licença manual

- **Bom:** simples.
- **Ruim:** fere as regras de conteúdo digital das lojas e não escala.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — seção 7.
- [ADR 0006](0006-adotar-sqlite-e-musicxml-como-formato-da-biblioteca.md) — onde o estado local é guardado.
- [Google Play Developer API — subscriptionsv2](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get)
- [Real-time developer notifications](https://developer.android.com/google/play/billing/rtdn-reference)
- Supersede: —
- Supersedido por: —
