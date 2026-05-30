import * as fs from "fs";
import { parseArgs, readCsv, requiredEnv, retry } from "../../utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

async function createLeadInNutshell(apiKey: string, lead: any): Promise<boolean> {
  // A API do Nutshell CRM é baseada em JSON-RPC. Vamos formatar a chamada de criação de contato.
  const apiEndpoint = "https://api.nutshell.com/v1/json-rpc";
  
  // Como a chamada precisa de autenticação Basic com o email/chave, estruturamos os headers
  const authHeader = Buffer.from(`avaliasolar:${apiKey}`).toString("base64");
  
  const payload = {
    method: "newLead",
    params: {
      lead: {
        primaryPhone: lead.company_phone || "",
        description: `Lead Qualificado via Hermes Agent LinkedIn. Score: ${lead.lead_score}. Linha de situação: ${lead.situation_line}`,
        confidence: 50,
        contacts: [
          {
            firstName: lead.first_name,
            lastName: lead.last_name,
            email: [lead.email],
            relationship: "Tomador de Decisão"
          }
        ],
        accounts: [
          {
            name: lead.official_company_name || lead.company_name,
            description: `Instalador Solar - ${lead.city}/${lead.state}. CNPJ: ${lead.cnpj}`
          }
        ]
      }
    },
    id: lead.lead_id || "1"
  };

  try {
    return await retry(async () => {
      // Se não houver chave real ou se for simulação, mostramos o log de sucesso
      if (apiKey === "MOCK_KEY" || !apiKey) {
        console.log(`   [MOCK-CRM] Lead "${lead.first_name} (${lead.company_name})" sincronizado com Nutshell com sucesso!`);
        return true;
      }
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    });
  } catch (error: any) {
    console.error(`❌ Erro ao sincronizar lead ${lead.first_name} no CRM:`, error.message);
    return false;
  }
}

async function sendSlackNotification(lead: any) {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) {
    console.log(`   [MOCK-SLACK] Notificação enviada para #growth-leads: 🔥 Lead Quente "${lead.first_name} - ${lead.company_name}" de score ${lead.lead_score}!`);
    return;
  }

  const payload = {
    text: `🔥 *Novo Lead Solar de Alta Relevância Sincronizado!*\n*Empresa:* ${lead.official_company_name || lead.company_name}\n*Decisor:* ${lead.first_name} ${lead.last_name}\n*Região:* ${lead.city}/${lead.state}\n*Score Hermes:* \`${lead.lead_score}/100\`\n*Pitch sugerido:* _"${lead.situation_line}"_`
  };

  try {
    await fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e: any) {
    console.warn("⚠️ Falha ao enviar notificação de Slack:", e.message);
  }
}

async function main() {
  const { flags } = parseArgs();
  const input = (flags.input as string) || "leads-qualified.csv";
  
  const crmKey = process.env.NUTSHELL_API_KEY || "MOCK_KEY";
  
  if (!fs.existsSync(input)) {
    console.error(`❌ Erro: O arquivo de leads qualificados ${input} não existe. Execute o script de enriquecimento primeiro!`);
    process.exit(1);
  }

  const leads = readCsv(input);
  const hotLeads = leads.filter(l => l.lead_classification === "HOT" || parseInt(l.lead_score) >= 70);
  
  console.log(`📡 Iniciando sincronização de ${hotLeads.length} leads quentes (HOT) com o Nutshell CRM e Slack...`);
  
  let successCount = 0;
  for (const lead of hotLeads) {
    console.log(`\nSincronizando ${lead.first_name} @ ${lead.company_name} (Score: ${lead.lead_score})...`);
    const success = await createLeadInNutshell(crmKey, lead);
    if (success) {
      successCount++;
      await sendSlackNotification(lead);
    }
  }

  console.log(`\n🎉 Sincronização concluída! ${successCount}/${hotLeads.length} leads quentes importados.`);
}

main().catch(e => {
  console.error("❌ Erro fatal na sincronização:", e);
  process.exit(1);
});
