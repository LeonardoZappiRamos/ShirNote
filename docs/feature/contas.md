# Contas

- Versão: 1.0 (proposta, nada implementado)
- Data: 2026-11-08
- Requisitos: RFM-14, RFM-19, RFM-20, RFM-23, RNFM-02, RNFM-09, RNFM-11, RNFM-12 (PRD móvel v2.0)
- Decisão: [ADR 0009](../decisions/0009-adotar-conta-shirnote-com-senha-e-login-google.md)
- Código: ainda não existe (Fase 9)

Este documento diz o que a pessoa vê e pode fazer com a conta ShirNote, no app e na web.

---

## 1. Conta é opcional no grátis

| Situação | O que funciona |
| --- | --- |
| Sem conta | Tudo do grátis de hoje, só no aparelho: importar, ler e excluir até 8 itens. Nada sai do aparelho. |
| Grátis com conta | O mesmo, e os 8 itens sincronizam com a conta e aparecem na web e em outro aparelho. |
| Pro | Exige conta. Tudo do Pro, no app e na web, em qualquer aparelho com a mesma conta. |

O app nunca obriga a criar conta para importar ou ler. O convite aparece em três momentos:
primeira abertura (com "Agora não"), ao tocar em algo que exige conta (sincronizar, abrir na web,
comprar) e nas Configurações.

## 2. Criar conta e entrar

Dois jeitos, no app e na web:

1. **E-mail e senha.** Nome, e-mail e senha (mínimo de 8 caracteres). O ShirNote manda um link de
   verificação. Sem verificar, a conta entra, mas não sincroniza nem compra; um aviso fixo lembra de
   verificar e permite reenviar o link.
2. **Continuar com Google.** Abre a escolha de conta do Google. Já chega verificada.

Regras:

- Mesmo e-mail nos dois jeitos é a **mesma conta**. Quem criou com senha e depois entra com Google
  (mesmo e-mail verificado) cai na conta existente.
- Esqueci a senha: link por e-mail que vale 1 hora. Trocar a senha encerra as outras sessões.
- Muitas tentativas erradas bloqueiam novas tentativas por alguns minutos, com mensagem clara.

Mensagens (RFM-17):

| Situação | Mensagem |
| --- | --- |
| E-mail ou senha errados | "E-mail ou senha incorretos." (não diz qual dos dois) |
| E-mail já cadastrado | "Este e-mail já tem conta. Entre ou recupere a senha." |
| Sem rede | "Sem conexão. Sua biblioteca continua disponível neste aparelho." |
| E-mail não verificado ao sincronizar | "Confirme seu e-mail para sincronizar. Reenviar link?" |

## 3. Primeira vez com conta num aparelho que já tem partituras

As partituras que já estavam no aparelho **sobem para a conta** (ver
[`sincronizacao.md`](sincronizacao.md)). Se for grátis e a soma passar de 8, sobem as 8 mais
recentes; as outras ficam só no aparelho, marcadas "não sincronizada", e continuam legíveis.

## 4. Sair da conta

- O app pergunta: **"Manter as partituras neste aparelho?"**
  - **Manter:** viram partituras locais, sem conta, como antes do login.
  - **Remover:** somem do aparelho; continuam na conta.
- Se houver alteração ainda não enviada (sem rede), o app avisa antes e oferece esperar.

## 5. Excluir a conta

- No app (Configurações → Conta → Excluir conta) e numa página da web, como a Play Store exige.
- Pede a senha (ou o Google de novo) e a confirmação por texto.
- Apaga no servidor: dados da conta, sessões e a biblioteca. **Não** apaga as partituras do aparelho
  nem os arquivos no OneDrive/Google Drive.
- Assinatura ativa: o app avisa que o cancelamento é feito na Play Store.

## 6. Pro e conta

- O botão de compra só aparece logado. Sem conta: "Crie uma conta para assinar o Pro e usar no app e
  na web."
- A compra fica presa à conta usada. Restaurar numa conta diferente é recusado: "Esta compra pertence
  a outra conta ShirNote."
- Offline, o Pro continua por até 14 dias desde a última confirmação (ADR 0007).

## 7. Dados guardados

Nome, e-mail, método de login, data de criação, sessões ativas (aparelho e data) e a ligação com a
compra. A senha só como hash. Nada disso aparece para outros usuários.

## 8. Em aberto

- Serviço de envio de e-mail (PRD, Q7).
- Login com Apple quando chegar o iOS (a App Store exige quando há login social).
