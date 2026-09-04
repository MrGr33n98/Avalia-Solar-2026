# PDR — Person 360 e e-mail

Decisão: preservar Sales como bounded context canônico; timeline será composição read-only de fontes existentes; SES/SNS permanece pipeline de entrega; UI adota primitives compactos sem alterar domínio por conveniência visual.

Sequência: provider safety, primitives, shell, timeline, composer, templates, engagement/suppression. Cada etapa exige testes focados e verificação tenant-safe.
