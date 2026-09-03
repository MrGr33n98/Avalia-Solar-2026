# Email Security & Deliverability

## Security Controls
1. **Tenant Isolation**: Every `Sales::EmailAccount`, `Thread`, `Message`, and `Template` includes strict user/company tenant scoping.
2. **Token Encryption**: OAuth tokens and credentials encrypted using ActiveSupport::MessageEncryptor or Rails 7 `encrypts`.
3. **HTML Sanitization**: Strict URL protocols allowed (`http`, `https`, `mailto`, `tel`).

## Deliverability Controls
- SPF, DKIM, and DMARC verification headers logged.
- Automated hard-bounce suppression (emails sent to addresses with previous `bounce` events are automatically blocked).
