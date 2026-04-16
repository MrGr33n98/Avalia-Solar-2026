#!/usr/bin/env node

/**
 * Script de Import Automático de Workflows n8n
 * 
 * Importa todos os workflows JSON para a instância n8n
 * Pode usar MCP ou API REST diretamente
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configurações
const N8N_URL = process.env.N8N_URL || 'https://n8n.avaliasolar.com.br';
const N8N_API_TOKEN = process.env.N8N_API_KEY || process.env.N8N_API_TOKEN || '';
const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR || path.join(__dirname, '.');
const N8N_BASE_URL = new URL(N8N_URL);
const HTTP_CLIENT = N8N_BASE_URL.protocol === 'http:' ? http : https;

if (!N8N_API_TOKEN) {
    console.error('❌ Missing N8N_API_KEY or N8N_API_TOKEN environment variable.');
    console.error('   Example: N8N_URL=http://localhost:5678 N8N_API_KEY=your_key node import-workflows.js');
    process.exit(1);
}

// Função para fazer request à API do n8n
function n8nRequest(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, N8N_BASE_URL);
        const defaultPort = url.protocol === 'http:' ? 80 : 443;
        
        const options = {
            hostname: url.hostname,
            port: url.port || defaultPort,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_API_TOKEN
            }
        };

        const req = HTTP_CLIENT.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${response.message || body}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Função para importar um workflow
async function importWorkflow(filePath) {
    const workflowName = path.basename(filePath, '.json');
    console.log(`\n📦 Importando: ${workflowName}`);

    try {
        // Ler o arquivo JSON
        let workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const workflowId = workflowData.id || path.basename(filePath, '.json').toLowerCase();
        
        // Limpar dados que a API pública não aceita na criação/update
        const cleanData = {
            id: workflowId,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            settings: workflowData.settings || {},
            active: workflowData.active ?? false,
            tags: workflowData.tags || [],
            versionId: workflowData.versionId || '1'
        };
        
        workflowData = cleanData;
        
        // Verificar se já existe
        console.log('  🔍 Verificando se workflow já existe...');
        const existingWorkflows = await n8nRequest('/api/v1/workflows', 'GET');
        const existing = existingWorkflows.data?.find(w => w.name === workflowData.name);

        if (existing) {
            console.log(`  ⚠️  Workflow "${workflowData.name}" já existe (ID: ${existing.id})`);
            console.log('  🔄 Atualizando...');
            
            // Atualizar workflow existente
            const updated = await n8nRequest(`/api/v1/workflows/${existing.id}`, 'PUT', workflowData);
            console.log(`  ✅ Atualizado com sucesso! (ID: ${updated.id})`);
            return { status: 'updated', id: updated.id, name: workflowData.name };
        } else {
            // Criar novo workflow
            console.log('  ➕ Criando novo workflow...');
            const created = await n8nRequest('/api/v1/workflows', 'POST', workflowData);
            console.log(`  ✅ Criado com sucesso! (ID: ${created.id})`);
            return { status: 'created', id: created.id, name: workflowData.name };
        }
    } catch (error) {
        console.error(`  ❌ Erro ao importar: ${error.message}`);
        return { status: 'error', name: workflowName, error: error.message };
    }
}

// Função principal
async function main() {
    console.log('🚀 ============================================');
    console.log('   IMPORT DE WORKFLOWS N8N');
    console.log('============================================\n');
    console.log(`📍 Servidor: ${N8N_URL}`);
    console.log(`📁 Diretório: ${WORKFLOWS_DIR}\n`);

    // Listar arquivos JSON
    const files = fs.readdirSync(WORKFLOWS_DIR)
        .filter(f => f.endsWith('.json') && f.startsWith('WF-'))
        .map(f => path.join(WORKFLOWS_DIR, f));

    if (files.length === 0) {
        console.log('❌ Nenhum workflow JSON encontrado!');
        process.exit(1);
    }

    console.log(`📦 Encontrados ${files.length} workflows para importar\n`);
    console.log('⏳ Iniciando import...\n');

    // Importar cada workflow
    const results = [];
    for (const file of files) {
        const result = await importWorkflow(file);
        results.push(result);
        
        // Aguardar 1 segundo entre imports para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Sumário final
    console.log('\n\n📊 ============================================');
    console.log('   SUMÁRIO DO IMPORT');
    console.log('============================================\n');

    const created = results.filter(r => r.status === 'created').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log(`✅ Criados: ${created}`);
    console.log(`🔄 Atualizados: ${updated}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📊 Total: ${results.length}\n`);

    if (errors > 0) {
        console.log('❌ Workflows com erro:');
        results.filter(r => r.status === 'error').forEach(r => {
            console.log(`  • ${r.name}: ${r.error}`);
        });
        console.log('');
    }

    console.log('✨ Import concluído!');
    console.log('============================================\n');

    console.log('🔗 Acesse seus workflows em:');
    console.log(`   ${N8N_URL}/workflows\n`);

    process.exit(errors > 0 ? 1 : 0);
}

// Executar
main().catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
});
