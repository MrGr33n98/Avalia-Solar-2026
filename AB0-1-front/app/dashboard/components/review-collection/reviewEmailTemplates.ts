/**
 * Presets de e-mail seguros e tipados para solicitação de avaliação.
 * Respeita QW-02 e QW-05: sem HTML inseguro, variáveis com fallback gracioso e encoding para compose externo.
 */

export type EmailTemplateKey = 'general' | 'post_installation' | 'maintenance' | 'commercial';

export interface EmailTemplatePreset {
  key: EmailTemplateKey;
  title: string;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
}

export const EMAIL_TEMPLATE_PRESETS: readonly EmailTemplatePreset[] = [
  {
    key: 'general',
    title: 'Convite Geral',
    description: 'Solicitação direta e cordial para clientes recentes.',
    subjectTemplate: 'Sua opinião é fundamental para a {company_name}',
    bodyTemplate:
      'Olá{client_salutation}!\n\n' +
      'Gostaríamos muito de saber como foi sua experiência com a {company_name}.\n\n' +
      'Sua avaliação leva menos de 2 minutos e ajuda outras pessoas a fazerem a melhor escolha em energia solar:\n' +
      '{review_link}\n\n' +
      'Agradecemos imensamente pela sua confiança e parceria!\n\n' +
      'Atenciosamente,\n' +
      'Equipe {company_name}',
  },
  {
    key: 'post_installation',
    title: 'Pós-Instalação',
    description: 'Ideal para envio logo após a conexão e homologação do sistema.',
    subjectTemplate: 'Como ficou a instalação do seu sistema solar? | {company_name}',
    bodyTemplate:
      'Olá{client_salutation}!\n\n' +
      'Parabéns pela ativação do seu sistema fotovoltaico com a {company_name}!\n\n' +
      'Como foi o atendimento da equipe técnica e a conclusão da sua obra?\n' +
      'Poderia compartilhar sua experiência conosco?\n\n' +
      'Acesse o link seguro abaixo para avaliar:\n' +
      '{review_link}\n\n' +
      'Seu depoimento é muito importante para nós!\n\n' +
      'Um abraço,\n' +
      'Equipe {company_name}',
  },
  {
    key: 'maintenance',
    title: 'Pós-Manutenção',
    description: 'Focado em revisões preventivas, suporte ou limpeza de módulos.',
    subjectTemplate: 'Avaliação do suporte e manutenção técnica | {company_name}',
    bodyTemplate:
      'Olá{client_salutation}!\n\n' +
      'Recentemente concluímos um atendimento técnico/manutenção para você.\n\n' +
      'Gostaríamos de saber se tudo ocorreu dentro das suas expectativas e com a agilidade que você merece:\n' +
      '{review_link}\n\n' +
      'Conte sempre com o nosso suporte!\n\n' +
      'Atenciosamente,\n' +
      'Suporte Técnico {company_name}',
  },
  {
    key: 'commercial',
    title: 'Atendimento Comercial',
    description: 'Para clientes que receberam estudo de viabilidade ou proposta.',
    subjectTemplate: 'Como foi seu atendimento com a equipe {company_name}?',
    bodyTemplate:
      'Olá{client_salutation}!\n\n' +
      'Obrigado pelo tempo dedicado à conversa com nosso consultor comercial.\n\n' +
      'Como avalia a clareza da proposta e a atenção prestada pela {company_name}?\n' +
      'Deixe sua impressão sincera no link:\n' +
      '{review_link}\n\n' +
      'Estamos à disposição para tirar qualquer dúvida!\n\n' +
      'Atenciosamente,\n' +
      'Equipe {company_name}',
  },
] as const;

export interface RenderTemplateParams {
  templateKey: EmailTemplateKey;
  companyName: string;
  clientName?: string;
  reviewLink: string;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

export function renderEmailTemplate({
  templateKey,
  companyName,
  clientName,
  reviewLink,
}: RenderTemplateParams): RenderedEmail {
  const preset =
    EMAIL_TEMPLATE_PRESETS.find((p) => p.key === templateKey) || EMAIL_TEMPLATE_PRESETS[0];

  const safeCompanyName = (companyName || '').trim() || 'Avalia Solar';
  const cleanClient = (clientName || '').trim();
  const clientSalutation = cleanClient ? `, ${cleanClient}` : '';

  const subject = preset.subjectTemplate
    .replace(/\{company_name\}/g, safeCompanyName)
    .replace(/\{client_name\}/g, cleanClient || 'Cliente');

  const body = preset.bodyTemplate
    .replace(/\{company_name\}/g, safeCompanyName)
    .replace(/\{client_salutation\}/g, clientSalutation)
    .replace(/\{client_name\}/g, cleanClient || 'Cliente')
    .replace(/\{review_link\}/g, reviewLink);

  return { subject, body };
}

export function buildComposeUrls(subject: string, body: string) {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${encSubject}&body=${encBody}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?subject=${encSubject}&body=${encBody}`,
    mailto: `mailto:?subject=${encSubject}&body=${encBody}`,
  };
}

