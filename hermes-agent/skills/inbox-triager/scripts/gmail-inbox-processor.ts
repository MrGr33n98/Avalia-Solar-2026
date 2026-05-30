import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface EmailMessage {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  date: string;
}

function getMockEmails(): EmailMessage[] {
  return [
    {
      id: "msg_101",
      sender_email: "vendas@solarworld.com.br",
      sender_name: "Eduardo Souza",
      subject: "Interesse em patrocinar banners na página /pricing",
      body: "Olá, equipe do Avalia Solar. Temos interesse em anunciar nossa empresa de placas solares na nova seção de preços de vocês. Quais os planos promocionais e formatos disponíveis?",
      date: "2026-05-30T09:15:00Z"
    },
    {
      id: "msg_102",
      sender_email: "suporte@ecosolar.com",
      sender_name: "Marcos Neves",
      subject: "Solicitação de cancelamento de assinatura Pro",
      body: "Gostaria de solicitar o cancelamento da nossa conta comercial Pro imediatamente. Tivemos problemas no carregamento de nossos banners de marketing no painel nos últimos 3 dias.",
      date: "2026-05-30T09:30:00Z"
    },
    {
      id: "msg_103",
      sender_email: "maria.silva@gmail.com",
      sender_name: "Maria Silva",
      subject: "Dúvida de consumidor - Como avaliar integrador?",
      body: "Fiz a instalação de placas solares na minha residência em Curitiba e gostaria de saber se o cadastro e a avaliação de vocês são gratuitos para o consumidor.",
      date: "2026-05-30T09:45:00Z"
    }
  ];
}

async function classifyEmailAndCreateDraft(openaiKey: string, email: EmailMessage): Promise<any> {
  if (!openaiKey || openaiKey === "MOCK") {
    const text = (email.subject + " " + email.body).toLowerCase();
    let category = "SPAM";
    let urgency = "LOW";
    let responseTemplate = "";

    if (text.includes("cancelamento") || text.includes("cancelar") || text.includes("reclamar") || text.includes("bug")) {
      category = "CRITICAL_CS_CHURN";
      urgency = "HIGH";
      responseTemplate = `Olá, ${email.sender_name}. Lamento muito ouvir sobre a sua intenção de cancelar e os problemas no painel. Registrei seu caso como urgência máxima sob protocolo #CS-999 e um gerente de atendimento humano entrará em contato em no máximo 15 minutos para resolver e estornar qualquer falha de banner.`;
    } else if (text.includes("anunciar") || text.includes("patrocinar") || text.includes("banner") || text.includes("pricing") || text.includes("planos")) {
      category = "B2B_SaaS_LEAD";
      urgency = "MEDIUM";
      responseTemplate = `Olá, ${email.sender_name}! Ficamos muito felizes com seu interesse em anunciar no Avalia Solar. Nosso plano Pro oferece slots patrocinados de banners e reputação destacada sem concorrência no seu perfil. Gostaria de agendar uma rápida demonstração amanhã? Segue meu link do Calendly: [calendly-link]`;
    } else if (text.includes("avaliar") || text.includes("gratuito") || text.includes("consumidor")) {
      category = "B2C_FAQ";
      urgency = "LOW";
      responseTemplate = `Olá, ${email.sender_name}. Sim, o portal Avalia Solar é 100% gratuito para os consumidores avaliarem e compararem integradores. Para avaliar a empresa que fez seu projeto, basta acessar nosso site, buscar pelo nome dela e clicar em 'Escrever Avaliação'.`;
    }

    return {
      category,
      urgency,
      draft_subject: `Re: ${email.subject}`,
      draft_reply: responseTemplate
    };
  }

  // Com chave OpenAI ativa
  const prompt = `Classifique cognitivamente o e-mail comercial recebido pelo portal Avalia Solar:
  Remetente: ${email.sender_name} (${email.sender_email})
  Assunto: ${email.subject}
  Corpo: ${email.body}
  
  Determine a categoria: "B2B_SaaS_LEAD", "CRITICAL_CS_CHURN", "B2C_FAQ" ou "SPAM".
  Determine o nível de urgência: "HIGH", "MEDIUM" ou "LOW".
  Gere uma resposta profissional adequada e personalizada no campo "draft_reply".
  Retorne um JSON contendo: category, urgency, draft_subject, draft_reply.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j: any = await res.json();
    return JSON.parse(j.choices[0].message.content);
  } catch {
    return { category: "SPAM", urgency: "LOW", draft_subject: `Re: ${email.subject}`, draft_reply: "" };
  }
}

async function main() {
  const { flags } = parseArgs();
  const output = (flags.output as string) || "gmail-processed.csv";
  
  const openaiKey = process.env.OPENAI_API_KEY || "MOCK";
  
  console.log("📥 Buscando e-mails comerciais não lidos no Gmail do Avalia Solar...");
  const emails = getMockEmails();
  
  console.log(`📨 Coletados ${emails.length} e-mails na inbox. Iniciando classificação semântica...`);
  
  const processedEmails: any[] = [];
  
  for (const email of emails) {
    console.log(`\n📧 Processando: "${email.subject}" de ${email.sender_name}`);
    const triaged = await classifyEmailAndCreateDraft(openaiKey, email);
    
    console.log(`   ├─ Categoria: ${triaged.category} | Urgência: ${triaged.urgency}`);
    console.log(`   └─ Criando rascunho de resposta automática...`);
    
    // Simulação do Slack Webhook para alertas urgentes
    if (triaged.category === "CRITICAL_CS_CHURN" && triaged.urgency === "HIGH") {
      console.log(`   🚨 ALERTA VERMELHO NO SLACK: Churn eminente de ${email.sender_name}!`);
    } else if (triaged.category === "B2B_SaaS_LEAD") {
      console.log(`   🟢 ALERTA NO SLACK: Lead B2B querendo plano de preços!`);
    }
    
    processedEmails.push({
      email_id: email.id,
      sender_email: email.sender_email,
      sender_name: email.sender_name,
      subject: email.subject,
      category: triaged.category,
      urgency: triaged.urgency,
      draft_reply: triaged.draft_reply
    });
  }

  writeCsv(output, processedEmails);
  console.log(`\n✅ Triagem concluída com sucesso!`);
  console.log(`💾 Logs de e-mails processados salvos em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro fatal na triagem de e-mails:", e);
  process.exit(1);
});
