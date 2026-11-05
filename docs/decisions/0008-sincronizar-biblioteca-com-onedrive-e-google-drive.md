# 0008 — Sincronizar a biblioteca direto com OneDrive e Google Drive

- Status: Accepted
- Data: 2026-11-04
- Decisores: Leonardo (Zappi)
- Consultados: —
- Informados: —

---

## Contexto e Problema

O diferencial pedido pelo dono do produto é a **sincronização direta com o OneDrive**, com o Google
Drive como segundo provedor (PRD do app móvel, RFM-11 e RFM-12). O usuário quer o acervo no tablet e
no celular sem depender de um servidor do ShirNote, e o app precisa continuar funcionando offline.

Sincronizar arquivos não é só subir e baixar: é preciso escolher escopo de acesso, guardar tokens com
segurança, decidir o que acontece quando os dois lados mudaram e não perder partitura em conflito.

## Forças que guiam a decisão

- Privacidade: os arquivos ficam na conta do usuário, não num servidor nosso (RNFM-02).
- Custo: não manter armazenamento nem banda de arquivos.
- Offline-first: a sincronização é uma ação explícita, não um requisito para ler (RNFM-01).
- Escopo mínimo: o app só deve ver a própria pasta, não o drive inteiro.
- Um desenvolvedor só: menos infraestrutura para operar.
- Poder acrescentar outro provedor sem tocar na biblioteca.

## Opções consideradas

- **A — APIs dos provedores direto do app**, OAuth 2.0 com PKCE e pasta do aplicativo.
- **B — Backend próprio como intermediário**, com o app falando só com o ShirNote.
- **C — SDKs oficiais completos** (Microsoft Graph SDK, Google Drive SDK) no app.
- **D — Pasta local compartilhada** (SAF/armazenamento externo), sem nuvem.

## Decisão

**Opção escolhida: A — acesso direto às APIs dos provedores, sem servidor de arquivos.**

1. **OneDrive (foco).** Microsoft Graph com o escopo `Files.ReadWrite.AppFolder` e `offline_access`,
   na pasta especial do aplicativo (`/me/drive/special/approot`). O app não pede acesso ao drive
   inteiro. O cadastro é um aplicativo no Microsoft Entra ID, multi-tenant com contas pessoais.
2. **Google Drive.** Escopo `drive.file`, que só dá acesso aos arquivos criados pelo próprio app. O
   app cria a pasta "ShirNote" e trabalha dentro dela. OAuth com `expo-auth-session` e PKCE.
3. **OAuth.** Authorization Code + PKCE no navegador do sistema, com redirect para o esquema
   `shirnote://auth`. Nenhum *client secret* no aplicativo (cliente público). Tokens de acesso e de
   renovação ficam no `expo-secure-store`.
4. **Formato remoto.** Uma pasta por provedor, com:
   - `shirnote-manifest.json`: versão, data e a lista de itens (`id`, `title`, `kind`, `updatedAt`,
     `hash`, `size`, `file`);
   - `scores/<id>.musicxml` para partituras;
   - `pdfs/<id>.pdf` para PDFs.
5. **Sincronização manual na v1.** O usuário toca em "Sincronizar". O app compara o manifesto remoto
   com o banco local por `updated_at` + hash e envia/baixa o que mudou. Sincronização automática em
   segundo plano fica para a v1.1.
6. **Conflito.** Se o mesmo item mudou dos dois lados desde a última sincronização, **nada é
   sobrescrito**: a versão mais nova mantém o `id` e a mais antiga é copiada com o sufixo
   "(conflito)" e um `id` novo. O usuário vê o aviso e decide o que excluir (RFM-17).
7. **Exclusão.** Excluir no app não apaga automaticamente na nuvem na v1; o item removido é marcado
   como `deleted` no manifesto e o arquivo é apagado só depois de uma confirmação explícita na
   próxima sincronização. Isso evita perda por engano.
8. **PDFs.** A sincronização inclui PDFs por padrão, com opção "somente partituras" para economizar
   dados. Arquivos acima de 50 MB são recusados com aviso.
9. **Adaptadores.** `apps/mobile/src/cloud` define a interface `CloudProvider` (`connect`, `disconnect`,
   `list`, `download`, `upload`, `remove`) e cada provedor implementa. A biblioteca e a UI não conhecem
   Graph nem Drive.
10. **Sem conta ShirNote.** A conta é a do provedor. Desconectar apaga os tokens do aparelho e não
    apaga os arquivos na nuvem.

### Consequências positivas

- Nenhum arquivo passa por servidor do ShirNote.
- O custo de armazenamento e banda é do provedor do usuário.
- O escopo mínimo reduz o risco de a revisão do Google/Microsoft exigir auditoria pesada.
- Trocar de provedor é implementar a interface, sem mexer na biblioteca.

### Consequências negativas

- Sem sincronização automática na v1, o usuário precisa lembrar de tocar em "Sincronizar".
- Cada provedor tem regras, cotas e telas de consentimento próprias.
- O app precisa lidar com token revogado, conta trocada e arquivo removido por fora.
- Conflitos geram duplicatas até o usuário resolver.
- Testar exige contas reais nos dois provedores e um aparelho com o app assinado.

### Consequências neutras / a monitorar

- O tamanho do manifesto e a quantidade de chamadas entram na meta de 20 partituras em ≤ 30 s.
- A Microsoft pode exigir verificação do aplicativo para uso além do modo de teste.
- O Google pode exigir a tela de consentimento e a verificação do escopo `drive.file` (não sensível).
- Sincronização em segundo plano (WorkManager) e detecção de mudança remota ficam no backlog.

### Confirmação

- Conectar OneDrive cria a pasta do app e envia o manifesto e uma partitura.
- Outro aparelho com a mesma conta baixa e abre a partitura.
- Editar nos dois lados e sincronizar gera "(conflito)" sem perder nenhuma versão.
- Desconectar não apaga arquivos na nuvem.
- Em modo avião, a sincronização falha com mensagem clara e a biblioteca continua funcionando.

---

## Análise das opções

### A — APIs diretas com PKCE (escolhida)

- **Bom:** privacidade, custo e escopo mínimo.
- **Bom:** sem infraestrutura de arquivos para operar.
- **Ruim:** duas integrações de OAuth e tratamento de conflito no cliente.

### B — Backend intermediário

- **Bom:** uma integração só e sincronização mais fácil de evoluir.
- **Ruim:** o ShirNote passa a guardar os arquivos do usuário, com custo, responsabilidade e risco de
  privacidade; contraria o RNFM-02.

### C — SDKs oficiais completos

- **Bom:** menos código de protocolo.
- **Ruim:** peso e superfície de dependências no app; as chamadas REST necessárias são poucas.

### D — Pasta local compartilhada

- **Bom:** simples e offline.
- **Ruim:** não sincroniza entre aparelhos e não atende ao pedido do OneDrive.

---

## Mais informações

- [PRD do app móvel](../PRD%20—%20App%20Móvel%20de%20Partituras%20ShirNote.md) — seção 10.
- [ADR 0006](0006-adotar-sqlite-e-musicxml-como-formato-da-biblioteca.md) — o que é sincronizado.
- [Microsoft Graph — app folder](https://learn.microsoft.com/graph/api/drive-get-specialfolder)
- [Google Drive API — escopos](https://developers.google.com/drive/api/guides/api-specific-auth)
- Supersede: —
- Supersedido por: —
