/**
 * Validation Schemas using Zod
 * Type-safe validation for forms and data
 */

import { z } from 'zod';

// ============================================================================
// Company Schema
// ============================================================================

export const companySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
  phone_alt: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido').optional().or(z.literal('')),
  whatsapp: z.string().regex(/^\+?\d{10,15}$/, 'WhatsApp inválido').optional().or(z.literal('')),
  email_public: z.string().email('Email inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  working_hours: z.string().optional(),
  payment_methods: z.string().optional(),
  certifications: z.string().optional(),
  awards: z.string().optional(),
  founded_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  employees_count: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  minimum_ticket: z.number().positive().optional(),
  maximum_ticket: z.number().positive().optional(),
  financing_options: z.string().optional(),
  response_time_sla: z.string().optional(),
  languages: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// ============================================================================
// Product Schema
// ============================================================================

export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  short_description: z.string().max(500, 'Descrição curta muito longa').optional(),
  price: z.number().positive('Preço deve ser positivo'),
  sku: z.string().optional(),
  stock: z.number().int().nonnegative('Estoque não pode ser negativo').optional(),
  status: z.enum(['active', 'pending', 'inactive']),
  featured: z.boolean().optional(),
  seo_title: z.string().max(60, 'Título SEO muito longo').optional(),
  seo_description: z.string().max(160, 'Descrição SEO muito longa').optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ============================================================================
// Review Schema
// ============================================================================

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres').max(1000),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ============================================================================
// Lead Schema
// ============================================================================

export const leadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
  company: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// ============================================================================
// Campaign Schema
// ============================================================================

export const campaignSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  goal: z.number().positive('Meta deve ser positiva'),
  budget: z.number().positive('Orçamento deve ser positivo'),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['end_date'],
  }
);

export type CampaignFormData = z.infer<typeof campaignSchema>;

// ============================================================================
// CTA Config Schema
// ============================================================================

export const ctaConfigSchema = z.object({
  cta_primary_label: z.string().min(2, 'Label deve ter pelo menos 2 caracteres').max(30),
  cta_primary_url: z.string().url('URL inválida'),
  cta_secondary_label: z.string().min(2, 'Label deve ter pelo menos 2 caracteres').max(30).optional(),
  cta_secondary_url: z.string().url('URL inválida').optional(),
  cta_whatsapp_template: z.string().max(500, 'Template muito longo').optional(),
  cta_utm_source: z.string().optional(),
  cta_utm_medium: z.string().optional(),
  cta_utm_campaign: z.string().optional(),
});

export type CTAConfigFormData = z.infer<typeof ctaConfigSchema>;

// ============================================================================
// Category Schema
// ============================================================================

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  seo_url: z.string().regex(/^[a-z0-9-]+$/, 'URL SEO deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  featured: z.boolean().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ============================================================================
// Banner Schema
// ============================================================================

export const bannerSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  position: z.enum(['top', 'sidebar', 'bottom']),
  link: z.string().url('URL inválida').optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }).optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }).optional(),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

export const validateField = <T extends z.ZodType>(
  schema: T,
  value: unknown
): { success: boolean; error?: string } => {
  try {
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation error',
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};

export const validateForm = <T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: boolean; errors?: Record<string, string>; data?: z.infer<T> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _error: 'Unknown validation error' } };
  }
};
