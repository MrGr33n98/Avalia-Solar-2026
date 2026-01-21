# Implementação de Backup do ActiveStorage para DigitalOcean Spaces

## Passo 0 — Descobrir onde o ActiveStorage está salvando HOJE

### Arquivos Analisados

1. **AB0-1-back/config/storage.yml**
   - Configuração do ActiveStorage
   - Possui serviços: `test`, `local`, `amazon` (comentado), `google` (comentado), `microsoft` (comentado), `mirror` (comentado)

2. **AB0-1-back/config/environments/production.rb**
   - Linha 20: `config.active_storage.service = :local`
   - O ActiveStorage está configurado para usar armazenamento local

3. **Variáveis .env relacionadas a S3/Spaces**
   - Não foram encontradas variáveis de ambiente relacionadas a S3/Spaces no códigobase
   - O projeto usa armazenamento local por padrão

### Conclusão

O ActiveStorage está salvando os arquivos **localmente** no diretório `/opt/avalia/storage` (ou equivalente no servidor de produção).

## Passo 1 — Definir "backup target" no Spaces

### Buckets Criados/Recomendados

1. **avalia-assets** - Bucket principal para armazenamento de assets (espelho dos arquivos locais)
2. **avalia-backups** - Bucket para backups diários com versionamento

### Prefixos Usados

- `s3://avalia-assets/activestorage/` - Armazenamento principal (espelho)
- `s3://avalia-backups/activestorage/` - Backups diários com versionamento

## Passo 2 — Implementar script de sync + checksum

### Ferramenta Escolhida

**rclone** - Ferramenta de sincronização de arquivos que funciona muito bem com DigitalOcean Spaces.

### Script Implementado

**Arquivo**: `scripts/activestorage_backup.sh`

#### Funcionalidades

1. **Sincronização com bucket principal**: Usa `rclone sync` para manter um espelho dos arquivos locais no bucket `avalia-assets`
2. **Backup diário**: Usa `rclone copy` para criar um backup diário com data no bucket `avalia-backups`
3. **Verificação de integridade**: Usa `rclone check` para verificar se todos os arquivos estão sincronizados corretamente
4. **Limpeza de backups antigos**: Remove backups com mais de 30 dias
5. **Logging detalhado**: Registra todas as operações no arquivo `/var/log/activestorage_backup.log`

#### Configurações

- **Diretório de armazenamento local**: `/opt/avalia/storage`
- **Número de transferências**: 10 (ajustável)
- **Arquivo de configuração do rclone**: `/opt/avalia/.rclone.conf`

## Passo 3 — Agendar cron diário + log

### Cron Job

**Horário**: 03:30 (após o backup do Postgres)

**Comando**: `/opt/avalia/scripts/activestorage_backup.sh`

### Log

**Arquivo de log**: `/var/log/activestorage_backup.log`

**Formato do log**: `YYYY-MM-DD HH:MM:SS - Mensagem`

## Passo 4 — Testar restore

### Restauração de um Arquivo Específico

```bash
rclone copy --config /opt/avalia/.rclone.conf spaces:avalia-assets/activestorage/path/para/arquivo /opt/avalia/storage/path/para/destino
```

### Restauração Parcial para um Diretório Temporário

```bash
mkdir -p /tmp/activestorage_restore
rclone copy --config /opt/avalia/.rclone.conf spaces:avalia-assets/activestorage /tmp/activestorage_restore
ls -la /tmp/activestorage_restore
```

### Restauração Completa

```bash
# Pare a aplicação Rails
systemctl stop avalia.service

# Limpe o diretório de armazenamento local
rm -rf /opt/avalia/storage/*

# Restaure todos os arquivos do Spaces
rclone copy --config /opt/avalia/.rclone.conf spaces:avalia-assets/activestorage /opt/avalia/storage

# Inicie a aplicação Rails
systemctl start avalia.service
```

## Passo 5 — Versionar no Git + docs + PR

### Arquivos Adicionados

1. **Configuração do Spaces**
   - `config/storage_s3.yml.example` - Exemplo de configuração para usar Spaces diretamente

2. **Scripts**
   - `scripts/activestorage_backup.sh` - Script principal de backup
   - `scripts/.rclone.conf.example` - Exemplo de configuração do rclone
   - `scripts/setup_rclone.sh` - Script para configurar o rclone

3. **Documentação**
   - `scripts/README_ACTIVESTORAGE_BACKUP.md` - Documentação detalhada do backup
   - `IMPLEMENTACAO_BACKUP_ACTIVESTORAGE.md` - Este arquivo com o passo a passo completo

### Instruções para Deploy

1. **Copiar arquivos para o servidor**
   ```bash
   scp -r scripts/ root@servidor:/opt/avalia/
   scp config/storage_s3.yml.example root@servidor:/opt/avalia/config/
   ```

2. **Instalar e configurar o rclone**
   ```bash
   ssh root@servidor
   /opt/avalia/scripts/setup_rclone.sh
   nano /opt/avalia/.rclone.conf  # Editar com credenciais do Spaces
   ```

3. **Configurar permissões**
   ```bash
   chmod +x /opt/avalia/scripts/*.sh
   ```

4. **Agendar cron job**
   ```bash
   crontab -e
   # Adicionar linha:
   30 3 * * * /opt/avalia/scripts/activestorage_backup.sh
   ```

5. **Testar o backup**
   ```bash
   /opt/avalia/scripts/activestorage_backup.sh
   tail -f /var/log/activestorage_backup.log
   ```

## Monitoramento e Manutenção

### Verificar Status do Backup

```bash
tail -f /var/log/activestorage_backup.log
```

### Verificar Integridade dos Arquivos

```bash
rclone check --config /opt/avalia/.rclone.conf /opt/avalia/storage spaces:avalia-assets/activestorage
```

### Listar Backups Disponíveis

```bash
rclone lsd --config /opt/avalia/.rclone.conf spaces:avalia-backups/activestorage/
```

## Migração para Uso Direto do Spaces

Caso deseje migrar o ActiveStorage para usar diretamente o DigitalOcean Spaces (em vez de armazenamento local), siga estas etapas:

1. **Configurar o storage.yml**
   ```bash
   cp /opt/avalia/config/storage_s3.yml.example /opt/avalia/config/storage.yml
   ```

2. **Atualizar production.rb**
   ```ruby
   # Altere de :local para :spaces
   config.active_storage.service = :spaces
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   # Adicione ao arquivo .env
   SPACES_ACCESS_KEY_ID=your-access-key
   SPACES_SECRET_ACCESS_KEY=your-secret-key
   ```

4. **Reiniciar a aplicação**
   ```bash
   systemctl restart avalia.service
   ```

## Considerações Finais

- **Segurança**: Mantenha as credenciais do Spaces em segurança
- **Custo**: Monitore o uso de armazenamento no DigitalOcean
- **Desempenho**: Ajuste o número de transferências conforme a capacidade do servidor
- **Testes**: Realize testes periódicos de restauração
- **Alertas**: Configure alertas para monitorar o sucesso do backup

Este sistema de backup garante que os arquivos do ActiveStorage estejam sempre seguros e recuperáveis em caso de falha no armazenamento local.
