@echo off
echo ========================================
echo CORRIGINDO CREDENCIAIS DIGITALOCEAN SPACES
echo ========================================
echo.

REM Conectar via SSH e configurar credenciais
ssh -o StrictHostKeyChecking=no root@138.197.80.63 "bash -s" << 'ENDSSH'
set -e

cd ~/Avalia-Solar-2026

echo "📋 Verificando credenciais atuais..."
docker compose exec -T backend printenv | grep SPACES || echo "Nenhuma credencial SPACES encontrada"

echo ""
echo "🔧 Atualizando .env.vm com credenciais corretas..."
cat > .env.vm << 'EOF'
# DigitalOcean Spaces Configuration (S3-Compatible)
ACTIVE_STORAGE_SERVICE=spaces
SPACES_ACCESS_KEY_ID=DO8013VUNPMR8VM9KVK8
SPACES_SECRET_ACCESS_KEY=fRKNnSyrPrOLG2xZBai1FuXuhjIffLyDp+GvvDNRXko
SPACES_REGION=nyc3
SPACES_BUCKET=avalia-solar-assets
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Database
POSTGRES_DB=ab0
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_prod_pass_secure_2024
DATABASE_URL=postgresql://postgres:postgres_prod_pass_secure_2024@ab0-postgres:5432/ab0

# Redis
REDIS_URL=redis://ab0-redis:6379/1

# Rails
RAILS_ENV=production
RAILS_MASTER_KEY=your_master_key_here
SECRET_KEY_BASE=your_secret_key_base_here

# API Configuration
APP_HOST=https://api.avaliasolar.com.br
FRONTEND_URL=https://avaliasolar.com.br

# Email (opcional - configure se quiser emails)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=avaliasolar.com.br
SMTP_USERNAME=
SMTP_PASSWORD=
EOF

echo ""
echo "✅ Credenciais atualizadas!"
echo ""
echo "🔄 Recriando containers com novas credenciais..."

# Para os containers
docker compose down

# Remove containers antigos
docker compose rm -f backend frontend

# Rebuilda e inicia com novas credenciais
docker compose up -d db redis

# Aguarda db/redis ficarem prontos
echo "⏳ Aguardando db/redis..."
sleep 10

# Inicia backend com novas credenciais
docker compose up -d backend

# Aguarda backend ficar pronto
echo "⏳ Aguardando backend..."
sleep 15

# Verifica se as credenciais foram carregadas
echo ""
echo "📋 Verificando credenciais no container:"
docker compose exec -T backend printenv | grep SPACES

# Testa conexão com o Spaces
echo ""
echo "🧪 Testando conexão com DigitalOcean Spaces..."
docker compose exec -T backend rails runner "
require 'aws-sdk-s3'

begin
  s3 = Aws::S3::Resource.new(
    access_key_id: ENV['SPACES_ACCESS_KEY_ID'],
    secret_access_key: ENV['SPACES_SECRET_ACCESS_KEY'],
    region: ENV['SPACES_REGION'],
    endpoint: ENV['SPACES_ENDPOINT']
  )
  
  bucket = s3.bucket(ENV['SPACES_BUCKET'])
  
  if bucket.exists?
    puts '✅ Conexão com Spaces bem-sucedida!'
    puts \"📦 Bucket: #{ENV['SPACES_BUCKET']}\"
    puts \"🌍 Região: #{ENV['SPACES_REGION']}\"
  else
    puts '❌ Bucket não encontrado. Criando...'
    bucket.create
    puts '✅ Bucket criado com sucesso!'
  end
rescue => e
  puts \"❌ Erro ao conectar com Spaces: #{e.message}\"
  puts \"   Access Key ID: #{ENV['SPACES_ACCESS_KEY_ID']}\"
  puts \"   Endpoint: #{ENV['SPACES_ENDPOINT']}\"
  exit 1
end
"

# Inicia frontend
echo ""
echo "🚀 Iniciando frontend..."
docker compose up -d frontend

echo ""
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "📊 Status dos containers:"
docker compose ps

ENDSSH

echo.
echo ========================================
echo CONCLUIDO!
echo ========================================
pause
