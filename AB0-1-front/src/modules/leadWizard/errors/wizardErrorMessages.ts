export const WIZARD_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_VERIFIED: 'O código de verificação já foi confirmado.',
  EMAIL_DELIVERY_FAILED:
    'Não conseguimos enviar o código por e-mail. Você pode tentar reenviar na próxima etapa.',
  INTERNAL_ERROR: 'Ocorreu um erro interno. Tente novamente em instantes.',
  INVALID_OTP: 'Código de verificação inválido.',
  NOT_FOUND: 'Solicitação não encontrada.',
  OTP_ATTEMPTS_EXCEEDED: 'Limite de tentativas de verificação excedido.',
  OTP_EXPIRED: 'O código de verificação expirou. Solicite um novo código.',
  OTP_RESEND_COOLDOWN: 'Código enviado recentemente. Aguarde para solicitar outro.',
  VALIDATION_FAILED: 'Alguns campos estão incorretos ou faltando.',
};

export const WIZARD_FIELD_LABELS: Record<string, string> = {
  address_full: 'Endereço completo',
  company_id: 'Empresa selecionada',
  consent_at: 'Consentimento',
  decision_timeline: 'Prazo de decisão',
  email: 'E-mail',
  full_name: 'Nome completo',
  name: 'Nome completo',
  phone: 'Telefone',
  product_vertical: 'Vertical do projeto',
  project_profile: 'Perfil do projeto',
  quote_type: 'Tipo de orçamento',
  system_size_band: 'Tamanho do sistema',
};
