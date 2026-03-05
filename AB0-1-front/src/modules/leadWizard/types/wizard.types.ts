export type FieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'currency' 
  | 'zipcode' 
  | 'slider' 
  | 'textarea';

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface FieldSchema {
  key: string;
  target?: 'lead' | 'wizard_answers';
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  errorMessage?: string;
  dependsOn?: {
    field: string;
    value: string | number | boolean;
  };
}

export interface StepSchema {
  id: string;
  title?: string;
  description?: string;
  fields: FieldSchema[];
}

export interface WizardSchema {
  source: 'category' | 'default' | 'company_custom';
  category_id: number;
  template_key: string;
  template_version: number;
  availability?: {
    preferred_company_id?: number | string | null;
    company_available: boolean;
    reason: string;
    message?: string;
  };
  schema: {
    steps: StepSchema[];
    ui_config?: {
      theme?: 'light' | 'dark' | 'auto';
      primary_color?: string;
      logo_url?: string;
      show_progress_bar?: boolean;
    };
  };
  thank_you_config?: {
    title?: string;
    message?: string;
    redirect_url?: string;
  };
}

export interface WizardSessionData {
  currentStepIndex: number;
  answers: Record<string, any>;
  lastUpdated: string;
}

export interface LeadCoreFields {
  full_name?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  city?: string;
  state?: string;
  consent: boolean;
  category_id?: number;
  preferred_company_id?: number | null;
  product_vertical?: string;
  project_profile?: string;
  quote_type?: string;
  system_size_band?: string;
  decision_timeline?: string;
  address_full?: string;
}

export interface WizardPayload {
  lead: LeadCoreFields;
  wizard_answers: Record<string, any>;
  utm?: Record<string, string>;
  attribution?: Record<string, any>;
}

export type WizardStateStatus = 
  | 'IDLE' 
  | 'LOADING_SCHEMA' 
  | 'SCHEMA_ERROR'
  | 'STEP_ACTIVE' 
  | 'VALIDATING' 
  | 'SUBMITTING' 
  | 'SUCCESS' 
  | 'ERROR';
