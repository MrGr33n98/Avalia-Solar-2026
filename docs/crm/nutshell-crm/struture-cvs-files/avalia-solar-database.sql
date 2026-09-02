-- ============================================================================
-- MASTER DATABASE SCHEMA - CRM AVALIA SOLAR (RECONSTRUÇÃO DO MODELO RELACIONAL)
-- Dialeto: PostgreSQL (Compatível com Rails ActiveRecord / PG 14+)
-- Data de Criação: 2026-09-02
-- Autor: Gemini Notebook / Principal Data Architect
-- ============================================================================

BEGIN;

-- Habilitar extensão para UUID, caso queira migrar chaves de string para UUID posteriormente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA: USERS (Controle de Usuários e Vendedores)
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Sales Rep' NOT NULL, -- e.g., 'Sales Admin', 'Sales Rep', 'Manager', 'Technical Engineer'
    avatar_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 2. TABELA: ACCOUNTS (Empresas / Organizações de Clientes)
-- ============================================================================
CREATE TABLE accounts (
    id VARCHAR(50) PRIMARY KEY, -- Usamos string para manter a compatibilidade direta com os IDs dos CSVs ('1-accounts', etc.)
    name VARCHAR(255) NOT NULL,
    legacy_id VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    website VARCHAR(255),
    industry VARCHAR(100), -- Setor de atuação, e.g., 'Aerospace', 'Environmental', 'Healthcare Providers'
    account_type VARCHAR(100) DEFAULT 'Standard Account' NOT NULL, -- e.g., 'Customer', 'Partner', 'Reseller', 'Vendor', 'Standard Account'
    territory VARCHAR(100),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 3. TABELA: CONTACTS (Contatos Individuais / Pessoas)
-- ============================================================================
CREATE TABLE contacts (
    id VARCHAR(50) PRIMARY KEY, -- ID compatível com CSV ('1-contacts', etc.)
    name VARCHAR(255) NOT NULL,
    legacy_id VARCHAR(100),
    phone_work VARCHAR(50),
    phone_mobile VARCHAR(50),
    phone_home VARCHAR(50),
    phone_fax VARCHAR(50),
    phone_other VARCHAR(50),
    email VARCHAR(150),
    website VARCHAR(255),
    account_id VARCHAR(50) REFERENCES accounts(id) ON DELETE SET NULL,
    territory VARCHAR(100),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    job_title VARCHAR(255), -- Cargo, e.g., 'Nutshell - VP of Customer Support', 'CEO', 'Sales Leader'
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    address_3 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100),
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 4. TABELA: PIPELINES (Funis de Vendas)
-- ============================================================================
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 5. TABELA: STAGES (Etapas do Funil de Vendas)
-- ============================================================================
CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Qualify', 'Pitch', 'Close'
    sequence_order INTEGER NOT NULL, -- Ordem sequencial da etapa
    probability INTEGER DEFAULT 0 NOT NULL, -- Probabilidade padrão de fechamento (0 a 100)
    color VARCHAR(20), -- Hexadecimal da cor para visualização gráfica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (pipeline_id, sequence_order)
);

-- ============================================================================
-- 6. TABELA: LEADS (Negócios / Oportunidades Comerciais)
-- ============================================================================
CREATE TABLE leads (
    id VARCHAR(50) PRIMARY KEY, -- ID compatível com CSV ('1000-leads', etc.)
    lead_number INTEGER NOT NULL UNIQUE, -- Código de identificação sequencial do lead
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open' NOT NULL, -- 'Open', 'Won', 'Lost', 'Cancelled'
    confidence VARCHAR(10) DEFAULT '0%' NOT NULL, -- Porcentagem representada em string (ex: '20%', '50%', '100%')
    outcome VARCHAR(50), -- Resultado qualitativo, e.g., 'Won', 'Competitor', 'No-Decision', 'Price'
    stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL, -- Etapa atual do funil
    percent_complete INTEGER DEFAULT 0 NOT NULL, -- Progresso quantitativo
    value DECIMAL(15,2) DEFAULT 0.00 NOT NULL, -- Valor financeiro da proposta solar
    market VARCHAR(100), -- Mercado regional ou de cobertura (e.g., 'U.S.', 'Southeastern')
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    account_id VARCHAR(50) REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id VARCHAR(50) REFERENCES contacts(id) ON DELETE SET NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_closed_date TIMESTAMP WITH TIME ZONE,
    date_closed TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    products TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Array de produtos solares cotados
    competitors TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Concorrentes identificados no processo
    sources TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Origem do lead (Cold Call, Web, Referral, etc.)
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 7. TABELA: ACTIVITIES (Compromissos, Ligações e Agendamentos)
-- ============================================================================
CREATE TABLE activities (
    id VARCHAR(50) PRIMARY KEY, -- ID compatível com CSV ('1-activities', etc.)
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Phone Call', 'Meeting', 'Virtual Meeting', 'Voicemail', etc.
    status VARCHAR(50) DEFAULT 'Scheduled' NOT NULL, -- 'Scheduled', 'Logged', 'Cancelled'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    is_timed BOOLEAN DEFAULT TRUE NOT NULL,
    description TEXT,
    participants TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Lista de participantes
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note TEXT, -- Resumo / Nota da atividade concluída
    follow_up_activity_id VARCHAR(50) REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 8. TABELA: NOTES (Histórico e Notas Polimórficas / Timeline)
-- ============================================================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    notable_type VARCHAR(100) NOT NULL, -- 'Contacts', 'Activities', 'Leads', 'Accounts' (Polimórfico Rails)
    notable_id VARCHAR(50) NOT NULL, -- Chave estrangeira correspondente ao notable_type
    name VARCHAR(255),
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    associated_entity_id VARCHAR(50), -- Chave relacionada opcional
    associated_legacy_id VARCHAR(100),
    created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 9. TABELA: EMAILS (Comunicações de Correio Eletrônico)
-- ============================================================================
CREATE TABLE emails (
    id VARCHAR(50) PRIMARY KEY, -- ID compatível com CSV ('1-emails', etc.)
    subject VARCHAR(255) NOT NULL,
    headers TEXT, -- Cabeçalhos brutos de email (JSON ou texto estruturado)
    body TEXT NOT NULL,
    sent_time TIMESTAMP WITH TIME ZONE,
    created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zendesk_ticket_id VARCHAR(100),
    lead_ids VARCHAR(50)[] DEFAULT '{}'::VARCHAR(50)[] NOT NULL, -- Array de leads associados
    contact_ids VARCHAR(50)[] DEFAULT '{}'::VARCHAR(50)[] NOT NULL, -- Array de contatos associados
    account_ids VARCHAR(50)[] DEFAULT '{}'::VARCHAR(50)[] NOT NULL, -- Array de empresas associadas
    user_ids INTEGER[] DEFAULT '{}'::INTEGER[] NOT NULL, -- Usuários do CRM envolvidos (coproprietários / remetentes)
    first_contact_legacy_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 10. TABELA ADAPTADA (AVALIA SOLAR): SOLAR_PROJECTS (Dimensionamento Técnico)
-- ============================================================================
CREATE TABLE solar_projects (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    average_monthly_bill DECIMAL(10, 2) NOT NULL, -- Valor médio da conta de luz em R$
    monthly_consumption_kwh INTEGER NOT NULL, -- Consumo médio mensal em kWh
    roof_type VARCHAR(50) DEFAULT 'Ceramic' NOT NULL, -- 'Ceramic', 'Metal', 'Slab', 'Fiber_Cement', 'Ground'
    shading_factor VARCHAR(50) DEFAULT 'None' NOT NULL, -- 'None', 'Low', 'Medium', 'High'
    system_size_kwp DECIMAL(6, 2) NOT NULL, -- Potência dimensionada do sistema (kWp)
    panel_qty INTEGER NOT NULL, -- Quantidade estimada de placas solares
    panel_power_w INTEGER DEFAULT 550 NOT NULL, -- Potência nominal por painel (W)
    inverter_type VARCHAR(150), -- Fabricante / Modelo do Inversor
    payback_years DECIMAL(4, 2), -- Tempo estimado de retorno do investimento
    annual_generation_kwh INTEGER, -- Geração estimada anual (kWh)
    technical_notes TEXT, -- Observações do Engenheiro Técnico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- ÍNDICES RECOMENDADOS PARA PERFORMANCE (N+1 Avoidance & Fast Search)
-- ============================================================================
CREATE INDEX idx_accounts_owner ON accounts(owner_id);
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_stages_pipeline ON stages(pipeline_id);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_account ON leads(account_id);
CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_notes_polymorphic ON notes(notable_type, notable_id);
CREATE INDEX idx_solar_projects_lead ON solar_projects(lead_id);

-- ============================================================================
-- TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA DO timestamp updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_modtime BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_modtime BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_modtime BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stages_modtime BEFORE UPDATE ON stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_modtime BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_modtime BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emails_modtime BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_solar_projects_modtime BEFORE UPDATE ON solar_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SEED DATA (CARGA DE DADOS COM BASE NOS ARQUIVOS CSV DO CRM)
-- ============================================================================

-- 1. SEED: USERS (Felipe)
INSERT INTO users (id, name, email, role, active)
VALUES (1, 'Felipe', 'felipe@avaliasolar.com.br', 'Sales Admin', TRUE);

-- Ajuste do sequenciador de ID de users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. SEED: ACCOUNTS (Empresas)
INSERT INTO accounts (id, name, email, website, industry, account_type, territory, owner_id, address_1, city, state, postal_code, country)
VALUES 
('1-accounts', 'Nutshell', 'support@nutshell.com', '@nutshell', NULL, 'Standard Account', NULL, 1, '206 E Huron St', 'Ann Arbor', 'MI', '48103', 'US'),
('2-accounts', 'Skyline Technologies [Sample]', NULL, NULL, 'Aerospace', 'Customer', NULL, 1, '450 Golden Gate Ave', 'San Francisco', 'CA', '94102', 'US'),
('3-accounts', 'EcoTech Solutions [Sample]', NULL, NULL, 'Environmental', 'Standard Account', NULL, 1, '219 S Dearborn St', 'Chicago', 'IL', '60604', 'US'),
('4-accounts', 'Aquora Purifiers [Sample]', NULL, NULL, 'Healthcare Providers', 'Standard Account', NULL, 1, '515 Rusk Ave', 'Houston', 'TX', '77002', 'US'),
('5-accounts', 'NextCourt Techs [Sample]', NULL, NULL, 'Computer Services', 'Standard Account', NULL, 1, '99 Exchange Blvd', 'Rochester', 'NY', '14614', 'US');

-- 3. SEED: CONTACTS (Pessoas)
INSERT INTO contacts (id, name, phone_work, email, account_id, territory, owner_id, job_title, address_1, city, state, postal_code, country)
VALUES
('1-contacts', 'Quincy Herrold', NULL, NULL, '1-accounts', NULL, 1, 'Nutshell - VP of Customer Support', '206 E Huron St', 'Ann Arbor', 'MI', '48103', 'US'),
('2-contacts', 'Jamie Lee [Sample]', '+1 2125551212', 'jlee@example.com', '2-accounts', NULL, 1, 'Skyline Technologies [Sample] - CEO', NULL, NULL, NULL, NULL, NULL),
('3-contacts', 'Morgan Taylor [Sample]', '+1 4155551212', 'mtaylor@example.com', '3-accounts', NULL, 1, 'EcoTech Solutions [Sample] - Sales Leader', NULL, NULL, NULL, NULL, NULL),
('4-contacts', 'Casey Yost [Sample]', '+1 7345551212', 'cyost@example.com', '4-accounts', NULL, 1, 'Aquora Purifiers [Sample] - Senior VP of Marketing', NULL, NULL, NULL, NULL, NULL),
('5-contacts', 'Aaron Fletcher [Sample]', '+1 5175551212', 'afletcher@example.com', '5-accounts', NULL, 1, 'NextCourt Techs [Sample] - COO', NULL, NULL, NULL, NULL, NULL);

-- 4. SEED: PIPELINES
INSERT INTO pipelines (id, name, description, active)
VALUES (1, 'Default Pipeline', 'Funil padrão de acompanhamento comercial e conversão solar.', TRUE);

-- Ajuste do sequenciador de ID de pipelines
SELECT setval('pipelines_id_seq', (SELECT MAX(id) FROM pipelines));

-- 5. SEED: STAGES (Etapas do Funil)
INSERT INTO stages (id, pipeline_id, name, sequence_order, probability, color)
VALUES 
(1, 1, 'Qualify', 1, 20, '#3182ce'),
(2, 1, 'Pitch', 2, 50, '#dd6b20'),
(3, 1, 'Close', 3, 100, '#38a169');

-- Ajuste do sequenciador de ID de stages
SELECT setval('stages_id_seq', (SELECT MAX(id) FROM stages));

-- 6. SEED: LEADS (Oportunidades)
INSERT INTO leads (id, lead_number, name, description, status, confidence, outcome, stage_id, percent_complete, value, market, creator_id, owner_id, account_id, contact_id, date_created, expected_closed_date, last_modified_at)
VALUES
('1000-leads', 1000, 'Skyline Technologies [Sample]', NULL, 'Won', '100%', 'Won', 3, 100, 55000.00, 'U.S.', 1, 1, '2-accounts', '2-contacts', '2026-01-02 14:54:15-03', '2026-09-04 14:54:15-03', '2026-09-02 14:54:15-03'),
('1001-leads', 1001, 'EcoTech Solutions [Sample]', NULL, 'Open', '20%', NULL, 1, 0, 900.00, 'U.S.', 1, 1, '3-accounts', '3-contacts', '2026-08-02 14:54:15-03', '2026-09-08 14:54:15-03', '2026-09-02 14:54:15-03'),
('1002-leads', 1002, 'Aquora Purifiers [Sample]', NULL, 'Open', '50%', NULL, 2, 0, 31000.00, 'U.S.', 1, 1, '4-accounts', '4-contacts', '2026-04-02 14:54:15-03', '2026-09-12 14:54:15-03', '2026-09-02 14:54:15-03'),
('1003-leads', 1003, 'NextCourt Techs [Sample]', NULL, 'Open', '50%', NULL, 2, 0, 1500.00, 'U.S.', 1, 1, '5-accounts', '5-contacts', '2026-06-02 14:54:15-03', '2026-09-14 14:54:15-03', '2026-09-02 14:54:16-03');

-- 7. SEED: ACTIVITIES
INSERT INTO activities (id, name, type, status, start_time, end_time, is_all_day, is_flagged, is_timed, description, participants, lead_id, creator_id, created_time, note)
VALUES
('1-activities', 'Signed up for a trial', 'Phone Call', 'Logged', '2026-09-02 14:39:16-03', '2026-09-02 14:54:16-03', FALSE, FALSE, TRUE, NULL, '{"Quincy Herrold"}', NULL, 1, '2026-09-02 14:54:16-03', 'By signing up for a Nutshell trial you''re ready to start tracking sales and stay on top of communication with your customers. It''s simple to schedule activities like this one, and then mark them as logged when you''ve finished the meeting or phone call.

You can also sync the activities that you schedule with your Google or Microsoft Exchange calendar.

- https://support.nutshell.com/en/articles/8428897-how-do-i-sync-your-gmail-with-nutshell
- https://support.nutshell.com/en/articles/8428901-sync-your-office-365-calendar');

-- 8. SEED: NOTES
INSERT INTO notes (notable_type, notable_id, name, creator_id, content, created_time)
VALUES
('Contacts', '1-contacts', 'Quincy Herrold', 1, 'Quincy leads Customer Support at Nutshell. When you need help with your account, reach out to our team — and try ''@ mentioning'' your fellow Nutshell users, @[Users:1] - writing notes and roping in your colleagues helps everyone stay on the same page.', '2026-09-02 14:54:16-03'),
('Activities', '1-activities', 'Signed up for a trial', 1, 'By signing up for a Nutshell trial you''re ready to start tracking sales and stay on top of communication with your customers. It''s simple to schedule activities like this one, and then mark them as logged when you''ve finished the meeting or phone call.

You can also sync the activities that you schedule with your Google or Microsoft Exchange calendar.

- https://support.nutshell.com/en/articles/8428897-how-do-i-sync-your-gmail-with-nutshell
- https://support.nutshell.com/en/articles/8428901-sync-your-office-365-calendar', '2026-09-02 14:54:16-03');

-- 9. SEED: EMAILS
INSERT INTO emails (id, subject, body, sent_time, created_time, sender_id, user_ids)
VALUES
('1-emails', 'Welcome to Nutshell!', 'I''d like to say hello, and introduce you to your company''s feed! You see real-time information about what''s happening across your Nutshell account, including the email you send and receive.

Add email to Nutshell by BCC''ing the message to bcc@nutshell.com, tagging messages in your Google Apps account, or sending an email directly from Nutshell!

- https://support.nutshell.com/en/articles/8428953-how-to-bcc-your-emails-into-nutshell
- https://support.nutshell.com/en/articles/8428951-how-to-send-an-email-from-nutshell', NULL, '2026-09-02 14:54:16-03', 1, '{1}');

-- 10. SEED: SOLAR_PROJECTS (Dimensionamento Adaptado Avalia Solar)
-- Associa dados de dimensionamento solar aos Leads existentes
INSERT INTO solar_projects (lead_id, average_monthly_bill, monthly_consumption_kwh, roof_type, shading_factor, system_size_kwp, panel_qty, panel_power_w, inverter_type, payback_years, annual_generation_kwh, technical_notes)
VALUES
('1000-leads', 1500.00, 1800, 'Metal', 'None', 15.4, 28, 550, 'Fronius Symo 15.0', 3.2, 22176, 'Sistema de alta performance instalado em telhado metálico industrial. Retorno estimado rápido devido à excelente irradiação.'),
('1001-leads', 250.00, 300, 'Ceramic', 'Low', 2.2, 4, 550, 'Microinversor APsystems EZ1', 4.5, 3168, 'Dimensionamento residencial básico de baixa complexidade. Telhado cerâmico requer ganchos adequados.'),
('1002-leads', 1000.00, 1200, 'Slab', 'Medium', 11.0, 20, 550, 'Deye SUN-10K', 3.8, 15840, 'Laje comercial requer estrutura de alumínio com inclinação e fixação química. Sombreamento leve à tarde.'),
('1003-leads', 450.00, 540, 'Fiber_Cement', 'None', 4.4, 8, 550, 'Growatt MIN 4400', 4.1, 6336, 'Telhado de fibrocimento necessita de fixação de haste rosqueada diretamente na terça.');

COMMIT;
