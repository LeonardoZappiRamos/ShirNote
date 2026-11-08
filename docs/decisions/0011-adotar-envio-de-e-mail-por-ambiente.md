# 0011 — Adotar um serviço de envio de e-mail por ambiente

- Status: Accepted
- Data: 2026-11-08
- Decisores: Leonardo (Zappi), owner do produto
- Consultados: —
- Informados: —

---

## Contexto e Problema

A conta ShirNote (ADR 0009) envia e-mail de verificação e de recuperação de senha. Em desenvolvimento
e em testes, esses e-mails não podem chegar a pessoas reais, mas precisam ser vistos para conferir
link, texto e layout. Em produção, precisam chegar na caixa de entrada, não no spam (PRD, Q7).

## Forças que guiam a decisão

- Nenhum e-mail de teste chega a destinatário real.
- Ver e testar os e-mails sem conta paga em desenvolvimento.
- Entrega confiável em produção, com SPF, DKIM e DMARC no domínio do ShirNote.
- Trocar de serviço sem mexer no código: só configuração.

## Opções consideradas

- **A — Um serviço por ambiente**, todos atrás de SMTP ou de uma interface única no backend.
- **B — O serviço de produção em todos os ambientes**, com domínio ou lista de teste.

## Decisão

**Opção escolhida: A — um serviço por ambiente.**

| Ambiente | Serviço | Para quê |
| --- | --- | --- |
| Desenvolvimento local | **Mailpit** (contêiner local) | Captura tudo; caixa web para inspecionar; nada sai da máquina |
| Staging / QA | **Mailtrap** (sandbox) | Validar templates e fluxos completos com a equipe |
| Produção | **Resend** ou **Brevo** | Entrega real por API ou SMTP |

1. O backend envia por uma interface única (`sendMail`); o ambiente escolhe o transporte por
   variável de ambiente. Desenvolvimento e staging usam SMTP; produção usa SMTP ou a API do serviço.
2. Os templates (verificação, recuperação de senha, aviso de exclusão de conta) ficam no código, em
   pt-BR, iguais nos três ambientes.
3. Produção só abre depois de SPF, DKIM e DMARC configurados no domínio de envio.
4. **Resend ou Brevo:** a escolha fica para a Fase 9, por preço da faixa inicial, entrega no Brasil e
   facilidade de DNS. Os dois atendem a este ADR sem mudança de código.

### Consequências positivas

- Desenvolvimento sem risco de mandar e-mail a usuário real e sem custo.
- Staging testa o fluxo inteiro com o mesmo template de produção.
- Trocar de serviço em produção é configuração.

### Consequências negativas

- Três serviços para configurar e uma conta paga a mais (Mailtrap) quando o volume de testes crescer.
- Diferenças sutis de entrega entre sandbox e produção só aparecem em produção.

### Confirmação

- Em desenvolvimento, criar conta mostra o e-mail no Mailpit e o link verifica a conta.
- Em staging, o fluxo de recuperação de senha aparece no Mailtrap e funciona.
- Em produção, o e-mail chega na caixa de entrada de Gmail e Outlook com SPF, DKIM e DMARC passando.

---

## Mais informações

- [ADR 0009](0009-adotar-conta-shirnote-com-senha-e-login-google.md) — contas.
- [`feature/contas.md`](../feature/contas.md) — quando cada e-mail é enviado.
- [Mailpit](https://mailpit.axllent.org/), [Mailtrap](https://mailtrap.io/), [Resend](https://resend.com/),
  [Brevo](https://www.brevo.com/)
- Supersede: —
- Supersedido por: —
