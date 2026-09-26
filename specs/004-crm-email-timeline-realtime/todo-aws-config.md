# TODO — Configuração AWS SES/SNS para Respostas de E-mail (Inbound CRM)

> **Lembrete:** Executar estes passos assim que recuperar o acesso ao telefone para verificação/2FA na AWS.

---

## 📋 Checklist de Passos na AWS

### 1. Acesso à Conta AWS
- [ ] Fazer login no [Console AWS](https://console.aws.amazon.com/).
- [ ] Confirmar o código de verificação 2FA via celular.

### 2. Verificar Domínio/Subdomínio no AWS SES
- [ ] Ir para **AWS SES (Simple Email Service)** ➔ **Verified Identities**.
- [ ] Garantir que o domínio `avaliasolar.com.br` (ou subdomínio `reply.avaliasolar.com.br`) está verificado (DKIM/SPF OK).

### 3. Registro DNS MX (Recebimento)
- [ ] No painel DNS (Cloudflare / Registro.br), confirmar registro **MX**:
  - **Tipo:** `MX`
  - **Nome:** `reply` *(ou `@` se for o domínio principal)*
  - **Prioridade:** `10`
  - **Valor:** `inbound-smtp.us-east-1.amazonaws.com` *(ajustar região se necessário)*

### 4. Criar Regra de Recebimento (Receipt Rule) no AWS SES
- [ ] No AWS SES, ir para **Email Receiving** ➔ **Rule Sets**.
- [ ] Selecionar o Rule Set ativo (ou criar um e definir como *Active*).
- [ ] Adicionar uma nova regra (**Create Rule**):
  - **Rule Name:** `crm-inbound-email-replies`
  - **Recipients:** Adicionar `reply.avaliasolar.com.br` ou `contato@avaliasolar.com.br`.
  - **Actions:** Selecionar **SNS**.
  - **SNS Topic:** Selecionar ou indicar o tópico `arn:aws:sns:us-east-2:431636668039:avaliasolar-ses-events` *(tópico configurado para a API)*.

### 5. Verificar Webhook SNS no Rails CRM
- [ ] No **AWS SNS**, confirmar que a assinatura (**Subscription**) para a URL abaixo está com status `Confirmed`:
  ```
  https://crm.avaliasolar.com.br/api/v1/sales/ses_webhooks
  ```

---

## 🧪 Teste Final de Validação
- [ ] Enviar um e-mail teste pelo CRM para uma caixa externa (ex: seu Gmail pessoal).
- [ ] Responder ao e-mail enviado.
- [ ] Abrir o modal do Lead/Oportunidade no CRM e verificar se a resposta apareceu automaticamente na linha do tempo.
