# Governança de badges

Schema observado: `badges` contém nome, descrição, posição, ano, edição, imagem, ativo, category_label e public_slug. `company_badges` liga empresa e badge com unicidade por par.

Badge é reconhecimento concedido. Não equivale a plano, verificação, destaque ou posição em ranking. Não emitir badge a partir de `priority_score`.

Fluxo de concessão, evidência, aprovador, validade/revogação e exposição de badges inativos precisam de decisão de produto/admin. Até então, não inventar metadados; preservar regras atuais de serialização.
