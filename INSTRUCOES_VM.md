# Instruções para Configuração do S3/DigitalOcean Spaces na VM

## 📋 Pré-requisitos

1. **Acesso à VM DigitalOcean** via SSH
2. **Credenciais do DigitalOcean Spaces** (obtenha em: [https://cloud.digitalocean.com/spaces](https://cloud.digitalocean.com/spaces))
3. **IP da VM**: `143.198.181.94`
4. **Usuário SSH**: `root`
5. **Diretório do projeto na VM**: `/root/Avalia-Solar-2026`

## 🛠️ Método 1: Script Automático (Recomendado)

### Passo 1: Executar o script PowerShell local

Abra o PowerShell como Administrador no diretório `c:\Users\Bobi\Desktop\AB0-1-main` e execute:

```powershell
.un-script-vm.ps1
```

### Passo 2: Seguir as instruções

O script irá:
1. Testar a conexão SSH com a VM
2. Transferir o arquivo `fix-s3-credentials.sh` para a VM
3. Conceder permissões de execução
4. Executar o script na VM interativamente
5. Verificar status dos containers
6. Exibir logs do backend

### Passo 3: Informar as credenciais

Quando solicitado, insira:
- **SPACES_ACCESS_KEY_ID**: Sua chave de acesso do DigitalOcean
- **SPACES_SECRET_ACCESS_KEY**: Sua chave secreta do DigitalOcean
- **Nome do bucket**: Use `avalia-backups`
- **Região**: Use `nyc3`

## 🛠️ Método 2: Copiar script diretamente para a VM

Caso o método 1 falhe devido a problemas de conexão SCP/SSH:

### Passo 1: Conectar à VM via SSH

Abra o PowerShell no diretório local e execute:

```powershell
ssh root@143.198.181.94
```

### Passo 2: Navegar para o diretório do projeto

```bash
cd /root/Avalia-Solar-2026
```

### Passo 3: Criar e editar o script

Execute o editor nano:

```bash
nano fix-s3-vm-direct.sh
```

### Passo 4: Copiar o conteúdo do script

Abra o arquivo `fix-s3-vm-direct.sh` no seu computador local, copie todo o conteúdo e cole no editor nano na VM.

### Passo 5: Salvar e sair do nano

Pressione:
- `Ctrl + O` para salvar
- `Enter` para confirmar o nome do arquivo
- `Ctrl + X` para sair

### Passo 6: Conceder permissões

```bash
chmod +x fix-s3-vm-direct.sh
```

### Passo 7: Executar o script

```bash
./fix-s3-vm-direct.sh
```

### Passo 8: Informar as credenciais

Siga as instruções no terminal da VM para inserir suas credenciais do DigitalOcean Spaces.

## 🧪 Verificação e Testes

### Testar upload no Active Admin

Acesse o painel de admin:
```
https://api.avaliasolar.com.br/admin
```

Teste o upload de uma imagem em:
- Categorias → Nova Categoria → Upload de imagem
- Empresas → Qualquer empresa → Upload de logo/banner

### Monitorar logs em tempo real

Para verificar os logs do backend enquanto testa o upload:

```bash
ssh root@143.198.181.94 "cd /root/Avalia-Solar-2026 && docker-compose logs -f backend"
```

### Verificar status dos containers

```bash
ssh root@143.198.181.94 "cd /root/Avalia-Solar-2026 && docker-compose ps"
```

## 🔧 Resolução de Problemas

### Erro de conexão SSH/SCP

- Verifique se a VM está ligada no [Painel DigitalOcean](https://cloud.digitalocean.com)
- Confirme que a porta 22 está aberta no firewall da VM
- Verifique se o IP da VM é correto
- Certifique-se de que sua chave SSH está configurada

### Erro "Bucket not found"

- Verifique se o bucket `avalia-backups` existe na região `nyc3`
- Confira se as credenciais têm permissões para acessar o bucket
- Verifique se o endpoint está correto (`https://nyc3.digitaloceanspaces.com`)

### Erro de upload no Active Admin

1. Verifique os logs do backend para mensagens de erro
2. Confira se o CORS está configurado no bucket (consulte a documentação do DigitalOcean)
3. Verifique se as credenciais estão corretas no arquivo `.env`
4. Reinicie os containers com `docker-compose restart`

### Erro de permissão no arquivo .env

Se o script falhar ao escrever no `.env`, execute:

```bash
chmod 644 .env
```

## 📝 Arquivos Importantes

| Arquivo Local                  | Função                                        |
|--------------------------------|-----------------------------------------------|
| `run-script-vm.ps1`            | Script PowerShell para automação completa     |
| `fix-s3-credentials.sh`        | Script principal para configuração do S3      |
| `fix-s3-vm-direct.sh`          | Script simplificado para copiar diretamente   |
| `docker-compose.yml`           | Configuração dos containers Docker            |
| `.env`                         | Variáveis de ambiente (credenciais)           |

## 📞 Suporte

Se persistirem os problemas:
1. Verifique os logs do backend
2. Confira o status da VM no DigitalOcean
3. Verifique as credenciais do Spaces
4. Certifique-se de que o bucket está configurado corretamente

## 🚀 Pronto!

Após seguir estas instruções, o Active Storage deverá estar configurado corretamente para usar o DigitalOcean Spaces, resolvendo os problemas de upload de imagens.
