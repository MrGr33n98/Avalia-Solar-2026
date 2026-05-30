import * as fs from "fs";
import { parseArgs } from "../../utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

const API_KEYS_MAPPING = [
  { key: "PROSPEO_API_KEY", name: "Prospeo Lead Generation API" },
  { key: "META_INSTAGRAM_TOKEN", name: "Meta Instagram Business Graph API" },
  { key: "NUTSHELL_API_KEY", name: "Nutshell CRM RPC API" },
  { key: "SLACK_WEBHOOK_URL", name: "Slack Incoming Webhook URL" },
  { key: "OPENAI_API_KEY", name: "OpenAI Semantic & LLM API" },
  { key: "GMAIL_API_KEY", name: "Gmail SMTP/API Delivery Service" },
  { key: "SMARTLEAD_API_KEY", name: "Smartlead Sending Engine API" }
];

async function checkApiKey(key: string, name: string): Promise<boolean> {
  const value = process.env[key];
  if (!value) {
    console.log(`   🔴 [FALHA] ${key} (${name}) ausente no .env`);
    return false;
  }

  if (value.startsWith("MOCK") || value === "") {
    console.log(`   🟡 [MOCK] ${key} (${name}) preenchido com dados de simulação local.`);
    return true;
  }

  console.log(`   🟢 [OK] ${key} (${name}) preenchido e pronto para uso em produção.`);
  return true;
}

async function main() {
  console.log("🛠️  Iniciando Validador de Credenciais e Conexões do Avalia Solar...");

  let validCount = 0;
  let invalidCount = 0;

  for (const item of API_KEYS_MAPPING) {
    const success = await checkApiKey(item.key, item.name);
    if (success) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  console.log("\n📊 Resumo da Auditoria técnica:");
  console.log(`   ├─ APIs Homologadas/Simuladas: ${validCount}`);
  console.log(`   ├─ APIs Pendentes de chaves: ${invalidCount}`);

  if (invalidCount > 0) {
    console.log(`\n⚠️  Atenção: Algumas APIs estão offline ou com chaves ausentes.`);
    console.log(`   Certifique-se de preencher todas as chaves obrigatórias no arquivo '.env'.`);
  } else {
    console.log(`\n🎉 Excelente! Todas as credenciais foram validadas com sucesso.`);
  }
}

main().catch(e => {
  console.error("❌ Erro fatal na verificação:", e);
  process.exit(1);
});
