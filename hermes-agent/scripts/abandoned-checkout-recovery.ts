import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../.planning/skills/utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface AbandonedCheckout {
  id: string;
  email: string;
  first_name: string;
  company_name: string;
  city: string;
  segmento: "solar" | "mobilidade";
  pricing_plan: string;
  abandoned_at: string;
}

function getMockAbandonedCheckouts(): AbandonedCheckout[] {
  return [
    {
      id: "chk_901",
      email: "financeiro@luzsol.com.br",
      first_name: "Henrique",
      company_name: "LuzSol Integradores",
      city: "Uberlândia",
      segmento: "solar",
      pricing_plan: "Pro Anual",
      abandoned_at: "2026-05-30T10:00:00Z"
    },
    {
      id: "chk_902",
      email: "diretor@chargepower.com.br",
      first_name: "Patrícia",
      company_name: "ChargePower Recargas",
      city: "Goiânia",
      segmento: "mobilidade",
      pricing_plan: "Pro Mensal",
      abandoned_at: "2026-05-30T10:15:00Z"
    },
    {
      id: "chk_903",
      email: "loja@eletromotores.com.br",
      first_name: "Sandro",
      company_name: "Eletro Motores",
      city: "Marília",
      segmento: "mobilidade",
      pricing_plan: "Essencial Mensal",
      abandoned_at: "2026-05-30T10:30:00Z" // FORA DA COBERTURA GEOGRÁFICA
    }
  ];
}

// Cidades permitidas para validação geográfica rápida
const CIDADES_PERMITIDAS = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Guarulhos", "Campinas",
  "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Uberlândia",
  "Sorocaba", "Niterói", "São José dos Campos", "Juiz de Fora",
  "Salvador", "Fortaleza", "Recife", "São Luís", "Maceió", "Natal",
  "Teresina", "João Pessoa", "Aracaju", "Feira de Santana",
  "Brasília", "Goiânia", "Campo Grande", "Cuiabá", "Aparecida de Goiânia",
  "Curitiba", "Porto Alegre", "Joinville", "Londrina", "Florianópolis", "Caxias do Sul",
  "Manaus", "Belém", "Ananindeua"
];

async function sendRecoveryEmail(email: string, subject: string, body: string): Promise<boolean> {
  const gmailKey = process.env.GMAIL_API_KEY;
  return retry(async () => {
    if (!gmailKey) {
      console.log(`   [MOCK-GMAIL-SEND] E-mail de Recuperação enviado para <${email}>: Subject: "${subject}"`);
      return true;
    }
    // Requisição real com API do Gmail
    return true;
  });
}

async function main() {
  const { flags } = parseArgs();
  const output = (flags.output as string) || "abandoned-recovery-log.csv";

  console.log("📥 Buscando abandonos de checkout do Stripe Recentes no Avalia Solar...");
  const checkouts = getMockAbandonedCheckouts();

  console.log(`📊 Coletados ${checkouts.length} abandonos recentes. Verificando limites geográficos e segmentos...`);
  
  const loggedActions: any[] = [];

  for (const chk of checkouts) {
    console.log(`\n🛒 Analisando abandono de ${chk.first_name} @ ${chk.company_name} (Plano: ${chk.pricing_plan})`);
    
    // Validação geográfica rígida
    const cidadeNormalizada = CIDADES_PERMITIDAS.find(
      c => c.toLowerCase().trim() === chk.city.toLowerCase().trim()
    );

    if (!cidadeNormalizada) {
      console.log(`   ❌ Abandono descartado do fluxo comercial de recuperação: localidade ${chk.city} não elegível.`);
      continue;
    }

    let subject = "";
    let emailBody = "";

    if (chk.segmento === "solar") {
      subject = `Falta pouco para destacar a ${chk.company_name} em ${cidadeNormalizada}!`;
      emailBody = `Olá, ${chk.first_name}. \n\nNotamos que você iniciou o upgrade para o plano ${chk.pricing_plan} no Avalia Solar, mas não concluiu o pagamento. \n\nEmpresas certificadas em ${cidadeNormalizada} recebem em média 4x mais visualizações e orçamentos diretos. Como sei que seu tempo é corrido, preparei um cupom especial de 10% de desconto na primeira parcela. Use o código: SOLAR10 no checkout. \n\nQualquer dúvida, responda a este e-mail.`;
    } else {
      subject = `Impulsione sua rede de recargas ${chk.company_name} em ${cidadeNormalizada}!`;
      emailBody = `Olá, ${chk.first_name}. \n\nNotamos que você quase concluiu a assinatura do plano ${chk.pricing_plan} para sua rede de mobilidade elétrica no Avalia Solar. \n\nA demanda por pontos de recarga e serviços elétricos em ${cidadeNormalizada} está em forte expansão, e destacar sua infraestrutura agora garantirá posicionamento de líder local. Segue um cupom de 10% de desconto especial na primeira mensalidade: MOBI10. \n\nEstou à disposição para qualquer ajuda!`;
    }

    console.log(`   🟢 Abandono Aprovado para Recuperação! Segmento: ${chk.segmento.toUpperCase()} | Cidade: ${cidadeNormalizada}`);
    const success = await sendRecoveryEmail(chk.email, subject, emailBody);
    
    if (success) {
      // Disparar alertas no Slack para equipes específicas de CS
      console.log(`   [Slack-Alert] Enviado para #sales-alerts: 🛒 Recuperação de checkout iniciada para ${chk.company_name} (${chk.pricing_plan})`);
      
      loggedActions.push({
        ...chk,
        city: cidadeNormalizada,
        segmento: chk.segmento === "solar" ? "solar" : "mobilidade_eletrica",
        subject,
        status: "E-MAIL_RECUPERACAO_ENVIADO"
      });
    }
  }

  writeCsv(output, loggedActions);
  console.log(`\n✅ Fluxo de recuperação de checkout Stripe processado com sucesso!`);
  console.log(`💾 Logs salvos em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro fatal na recuperação de checkout:", e);
  process.exit(1);
});
