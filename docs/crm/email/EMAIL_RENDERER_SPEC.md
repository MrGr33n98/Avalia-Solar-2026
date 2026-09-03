# Email Renderer Specification & Fail-Closed Policy

## TipTap JSON Schema Canonical Representation
Canonical editable emails are stored in `body_json` using structured node trees:
- `paragraph`, `heading`, `text`, `bold`, `italic`, `underline`, `strike`, `link`, `button`, `image`, `divider`, `bullet_list`, `ordered_list`, `section`.

## Fail-Closed Rules
Before dispatching any email, `Sales::Messaging::Renderer` validates:
1. `body_html` is not blank or whitespace.
2. `body_text` is present.
3. No unhandled rendering exceptions occurred.
4. Recipients (`to`) list contains at least 1 valid email address.
5. Subject line is present.

If validation fails, the renderer raises `EmailRenderError` and halts delivery immediately.
