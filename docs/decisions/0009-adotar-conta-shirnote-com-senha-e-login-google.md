# 0009 — Adotar conta ShirNote com e-mail e senha e login com Google

- Status: Accepted
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: usuário de teste (Beit)
- Informados: —

---

## Contexto e Problema

Até aqui o ShirNote não tinha conta própria: a biblioteca vivia só no aparelho, a nuvem era a conta
OneDrive/Google Drive do usuário (ADR 0008) e o Pro era identificado pelo `purchaseToken` da Play
Store (ADR 0007, item 7).

Depois da revisão do owner em 08/11/2026, o produto passa a ter uma **versão web** que mostra e
organiza a mesma biblioteca do app, e o Pro precisa valer nos dois lugares. Uma compra da Play Store
não identifica ninguém no navegador, e a conta do OneDrive não serve para guardar a biblioteca no
servidor (ADR 0010). É preciso uma identidade do ShirNote.

O owner definiu: conta com **e-mail e senha**, com **login com Google** como alternativa, e conta
**opcional no plano grátis**.

## Forças que guiam a decisão

- O app continua funcionando sem conta e sem rede (RNFM-01, RFM-18).
- O Pro vale no app, na web e em outro aparelho, sem depender de a loja estar presente.
- Senha guardada com hash forte, recuperação de senha e verificação de e-mail, sem escrever
  criptografia própria.
- Os dados de conta ficam no banco do ShirNote, sem custo por usuário ativo.
- Mesma stack do backend de direitos (ADR 0007): Node 22, Fastify, PostgreSQL.
- Política da Play Store: app que cria conta precisa permitir excluir a conta no app e por um link
  na web.
- LGPD: guardar o mínimo de dados pessoais e explicar na política de privacidade.

## Opções consideradas

- **A — Better Auth dentro do backend próprio** (biblioteca open source, banco nosso).
- **B — Supabase Auth** (serviço gerenciado com Postgres e storage).
- **C — Firebase Authentication** (serviço gerenciado do Google).
- **D — Autenticação escrita à mão** no Fastify.

## Decisão

**Opção escolhida: A — Better Auth no backend próprio.**

1. **Métodos de login.** E-mail e senha; Google como login social. Uma pessoa pode ter os dois
   métodos na mesma conta (vínculo pelo e-mail verificado).
2. **Senha.** Hash pela própria biblioteca (scrypt por padrão), mínimo de 8 caracteres e limite de
   tentativas por IP e por conta.
3. **E-mail.** Verificação do e-mail e recuperação de senha por link enviado por e-mail. Conta de
   e-mail não verificado entra no app, mas **não sincroniza nem compra** até verificar. Login com
   Google já chega verificado. O serviço de envio de e-mail está em aberto (PRD, Q7).
4. **Sessão no app.** O plugin Expo da biblioteca guarda o token de sessão no `expo-secure-store`.
   Login com Google pelo navegador do sistema (OAuth com PKCE), redirect `shirnote://auth`.
5. **Sessão na web.** Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, no mesmo domínio da API.
6. **Conta opcional no grátis.** Sem conta, o app funciona como hoje: biblioteca só no aparelho.
   Com conta, o grátis sincroniza os mesmos 8 itens e lê na web (ADR 0010).
7. **Pro exige conta.** A compra só começa com sessão ativa. O app envia à Play Billing o
   `obfuscatedAccountId` (hash do id da conta) e o backend vincula o direito à conta. Isso
   substitui o item 7 do ADR 0007; o resto do ADR 0007 continua valendo.
8. **Excluir a conta.** No app (Configurações) e numa página da web. Apaga dados de conta, sessões e
   a biblioteca no servidor; os arquivos no aparelho e no OneDrive/Google Drive ficam. A compra
   continua sendo gerida na Play Store.
9. **Sair da conta.** Encerra a sessão no aparelho. O que fazer com as cópias locais está em
   [`feature/contas.md`](../feature/contas.md).

### Modelo de dados do backend (acréscimo ao ADR 0007)

As tabelas de usuário, sessão, conta vinculada (Google) e verificação são as do esquema da biblioteca.
O ADR 0007 ganha a ligação com a conta:

- `purchases.user_id` → usuário dono da compra; uma compra pertence a uma só conta.
- `entitlements.user_id` → o direito vale para a conta, não para o aparelho.
- O token assinado do direito (JWT Ed25519) passa a ter `sub` = id da conta.

### Consequências positivas

- O mesmo Pro vale no app, na web e em aparelho novo.
- Login com Google tira a fricção do cadastro no Android.
- Nenhuma cobrança por usuário ativo e nenhum dado de conta fora do nosso banco.
- Uma biblioteca mantida faz a parte delicada (hash, tokens, recuperação, OAuth).

### Consequências negativas

- O ShirNote passa a guardar dado pessoal (nome, e-mail) e responde por ele (LGPD).
- Passa a existir envio de e-mail transacional, com provedor, domínio e reputação a cuidar.
- Login e recuperação dependem da disponibilidade do backend.
- A Fase de cobrança passa a depender da Fase de contas.

### Consequências neutras / a monitorar

- Versão da biblioteca e do plugin Expo: conferir na documentação antes de codar e fixar no
  `package.json`.
- Compra feita numa conta e restaurada noutra: o backend recusa e o app explica (`purchases.user_id`
  único por compra).
- Tela de consentimento do Google e verificação do app para o escopo de login (não sensível).

### Confirmação

- Criar conta com e-mail e senha, verificar o e-mail e entrar no app e na web.
- Entrar com Google no app e na web e cair na mesma conta do e-mail verificado.
- Recuperar a senha pelo link do e-mail.
- Comprar o Pro logado no app e ver o Pro na web, sem nova compra.
- Excluir a conta no app; a web deixa de aceitar a sessão e a biblioteca some do servidor.
- Sem conta, em modo avião, o app importa e lê como antes.

---

## Análise das opções

### A — Better Auth no backend próprio (escolhida)

- **Bom:** dados no nosso Postgres, sem custo por usuário, mesma stack do ADR 0007.
- **Bom:** e-mail e senha, Google, verificação, recuperação e plugin Expo prontos.
- **Ruim:** atualizar a biblioteca e operar o envio de e-mail é tarefa nossa.

### B — Supabase Auth

- **Bom:** auth, banco e storage gerenciados num lugar só; menos operação.
- **Ruim:** troca a stack do ADR 0007 (Neon, Fly.io) e cria dependência de um fornecedor para três
  peças centrais.

### C — Firebase Authentication

- **Bom:** login com Google muito simples no Android.
- **Ruim:** a identidade fica num sistema e os dados no outro; dois painéis e duas contas de
  serviço para manter.

### D — Escrito à mão

- **Bom:** controle total.
- **Ruim:** hash, tokens, recuperação e OAuth são onde mais se erra em segurança. Não compensa.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — v2.0, seções 4, 5 e 7.
- [`feature/contas.md`](../feature/contas.md) — comportamento das contas.
- [ADR 0007](0007-validar-compra-no-backend-e-conceder-direito.md) — cobrança; o item 7 (identidade)
  é substituído por este ADR.
- [ADR 0010](0010-guardar-a-biblioteca-da-conta-no-backend-em-musicxml.md) — o que a conta sincroniza.
- [Better Auth](https://www.better-auth.com/docs)
- [Play Console — exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111)
- Supersede: ADR 0007, item 7 (identidade).
- Supersedido por: —
