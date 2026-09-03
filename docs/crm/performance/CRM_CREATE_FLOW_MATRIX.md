# CRM Create Flow Matrix

| Cenário de Teste | Entrada | Resultado Esperado | Status Backend | Code / Contrato Error |
| --- | --- | --- | --- | --- |
| A | Conta existente + Contato existente da mesma conta | 201 Created | Sucesso | N/A |
| B | Conta existente sem contato | 201 Created | Sucesso | N/A |
| C | Conta Inline | 201 Created (Conta criada atomicamente) | Sucesso | N/A |
| D | Conta Inline + Contato Inline | 201 Created (Ambos criados atomicamente) | Sucesso | N/A |
| E | Contato de OUTRA conta | 422 Unprocessable Entity | Tratado | `CONTACT_ACCOUNT_MISMATCH` |
| F | Estágio inválido / inexistente | 422 Unprocessable Entity | Tratado | `CRM_PIPELINE_NOT_CONFIGURED` |
| G | Submissão duplicada | Duplo clique bloqueado no botão + idempotência | Tratado | N/A |
