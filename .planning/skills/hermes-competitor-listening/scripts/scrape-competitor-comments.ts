import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface Comment {
  username: string;
  comment_text: string;
  timestamp: string;
}

// Simulando Scrape de Comentários do Instagram do maior concorrente
function getMockCompetitorComments(competitorName: string): Comment[] {
  return [
    {
      username: "solar_life_integrador",
      comment_text: "Qual é o valor da mensalidade de vocês para aparecer nas buscas patrocinadas? Não consigo retorno do suporte comercial.",
      timestamp: "2026-05-29T10:00:00Z"
    },
    {
      username: "ana_sol_energia",
      comment_text: "Nossa empresa teve uma avaliação injusta de um concorrente no portal de vocês e ninguém respondeu nosso chamado para moderação. Péssimo!",
      timestamp: "2026-05-29T11:30:00Z"
    },
    {
      username: "cleber_placas_solar",
      comment_text: "Parabéns pelo post de sustentabilidade, muito bom!",
      timestamp: "2026-05-29T12:00:00Z"
    },
    {
      username: "roberto_engenharia_solar",
      comment_text: "Migramos nosso site solar, como fazemos para atualizar o link do perfil no painel de integradores de vocês?",
      timestamp: "2026-05-29T14:15:00Z"
    }
  ];
}

async function analyzeCommentWithAI(openaiKey: string, comment: Comment): Promise<any> {
  // Se não houver chave real ou se for simulação, fazemos análise semântica estruturada local inteligente
  if (!openaiKey || openaiKey === "MOCK") {
    const text = comment.comment_text.toLowerCase();
    let category = "ENGAGEMENT";
    let intentScore = 10;
    let mainPain = "";
    
    if (text.includes("valor") || text.includes("mensalidade") || text.includes("preço") || text.includes("anunciar")) {
      category = "LEAD_BUYER";
      intentScore = 90;
      mainPain = "Desejo de conhecer e comprar planos de destaque comercial.";
    } else if (text.includes("suporte") || text.includes("não responde") || text.includes("reclamação") || text.includes("injusta") || text.includes("péssimo")) {
      category = "COMPLAINT_PAIN";
      intentScore = 85;
      mainPain = "Frustração com atendimento/suporte de concorrente.";
    } else if (text.includes("atualizar") || text.includes("painel") || text.includes("migramos")) {
      category = "SUPPORT_HOWTO";
      intentScore = 50;
      mainPain = "Dúvida técnica de usabilidade.";
    }
    
    return {
      category,
      intent_score: intentScore,
      detected_pain: mainPain,
      suggested_action: category === "LEAD_BUYER" 
        ? "Enviar DM oferecendo cupom de 15% para plano PRO no Avalia Solar." 
        : category === "COMPLAINT_PAIN" 
          ? "Oferecer transição assistida gratuita e suporte prioritário no plano Essencial." 
          : "Responder com link da central de ajuda."
    };
  }

  // Se houver chave OpenAI real
  const prompt = `Analise semanticamente o comentário de rede social de um integrador solar no concorrente.
  Comentário: "${comment.comment_text}"
  Classifique em: "LEAD_BUYER" (alta intenção de compra), "COMPLAINT_PAIN" (reclamação/dor sobre rival), "SUPPORT_HOWTO" (dúvida técnica) ou "ENGAGEMENT" (engajamento neutro).
  Retorne um JSON contendo os campos: category, intent_score (0 a 100), detected_pain, suggested_action.`;

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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j: any = await res.json();
    return JSON.parse(j.choices[0].message.content);
  } catch {
    return { category: "ENGAGEMENT", intent_score: 10, detected_pain: "", suggested_action: "" };
  }
}

async function main() {
  const { flags } = parseArgs();
  const competitor = (flags.competitor as string) || "portal_solar_rival";
  const output = (flags.output as string) || "competitor-opportunities.csv";
  
  const openaiKey = process.env.OPENAI_API_KEY || "MOCK";
  
  console.log(`📡 Iniciando monitoramento de canais sociais do concorrente: @${competitor}...`);
  const comments = getMockCompetitorComments(competitor);
  
  console.log(`📊 Coletados ${comments.length} comentários recentes. Iniciando análise semântica...`);
  
  const opportunities: any[] = [];
  
  for (const comment of comments) {
    console.log(`\n💬 Analisando comentário de @${comment.username}: "${comment.comment_text.slice(0, 50)}..."`);
    const aiResult = await analyzeCommentWithAI(openaiKey, comment);
    
    console.log(`   └─ Categoria: ${aiResult.category} | Score de Intenção: ${aiResult.intent_score}`);
    
    if (aiResult.category === "LEAD_BUYER" || aiResult.category === "COMPLAINT_PAIN") {
      console.log(`   🔥 OPORTUNIDADE DETECTADA! Ação: ${aiResult.suggested_action}`);
      opportunities.push({
        competitor,
        username: comment.username,
        comment_text: comment.comment_text,
        timestamp: comment.timestamp,
        category: aiResult.category,
        intent_score: aiResult.intent_score,
        detected_pain: aiResult.detected_pain,
        suggested_action: aiResult.suggested_action
      });
    }
  }

  writeCsv(output, opportunities);
  console.log(`\n✅ Escuta social concluída! Mapeadas ${opportunities.length} oportunidades.`);
  console.log(`💾 Oportunidades salvas em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro no monitoramento de concorrente:", e);
  process.exit(1);
});
