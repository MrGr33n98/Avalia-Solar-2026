# Manual Operacional e Runbook de Produção
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Operations & Incident Response Runbook  
**Público:** Operações de Marketing, SRE e Engenharia de Automação  

---

## 1. Operação do Dia a Dia

### 1.1 Cadência de Geração
* **Disparo:** Segundas, Quartas e Sextas às 09:00 BRT (`America/Sao_Paulo`).
* **Notificação de Aprovação:** O revisor recebe e-mail/notificação contendo a prévia da imagem gerada, a legenda proposta, as hashtags e os botões de ação:
  * `[Aprovar Publicação]`: agenda a postagem para o horário homologado (ex: 18:30 BRT).
  * `[Rejeitar]`: descarta a sugestão e registra o motivo no log.
  * `[Ajustar Legenda]`: permite alterar o texto antes de liberar.

---

## 2. Procedimentos de Emergência e Resolução de Falhas

### 2.1 Acionamento do Kill Switch
Se houver qualquer comportamento imprevisto, instabilidade na Meta ou decisão editorial urgente de pausar publicações:
1. Acesse o n8n em `https://n8n.avaliasolar.com.br`.
2. Abra as variáveis de ambiente ou a configuração do workflow `WF-IG-05-publisher`.
3. Defina `INSTAGRAM_AUTOPUBLISH_ENABLED = false`.
4. Salve. Nenhuma postagem será enviada para a API da Meta até a reativação manual.

### 2.2 Token da Meta Expirado ou Revogado (Erro 190)
1. Acesse o Meta Business Manager da Avalia Solar.
2. Navegue até **Usuários do Sistema** → `Avalia Solar Social`.
3. Gere um novo token de acesso com as permissões `instagram_basic` e `instagram_content_publish`.
4. No n8n, acesse **Credentials** → `meta_instagram_api` e atualize o Bearer Token.
5. Execute manualmente o workflow `WF-IG-00-preflight` para confirmar o status `HTTP 200`.

### 2.3 Falha de Imagem no CDN da Meta (Status Code ERROR/EXPIRED)
* **Causa Comum:** A URL da imagem gerada pelo Next.js não pôde ser baixada pelos servidores da Meta dentro do timeout de 30s.
* **Diagnóstico:**
  * Teste a URL da imagem diretamente via curl: `curl -sI "<IMAGE_URL>"`.
  * Verifique se o servidor web do Next.js está respondendo com HTTP 200 e headers `Content-Type: image/jpeg` ou `image/png`.
* **Ação Corretiva:** Reexecutar o workflow `WF-IG-03-media-render` para regerar a imagem com novo cache e reiniciar a fila.
