-- Verificar se existem empresas verificadas
SELECT COUNT(*) as verified_count FROM companies WHERE verified = true;

-- Listar algumas empresas
SELECT id, name, verified, slug FROM companies LIMIT 10;

-- Verificar empresa 794
SELECT id, name, verified FROM companies WHERE id = 794;

-- Verificar se tem attachments de verified_badge
SELECT COUNT(*) as badge_count FROM active_storage_attachments 
WHERE record_type = 'Company' AND name = 'verified_badge';
