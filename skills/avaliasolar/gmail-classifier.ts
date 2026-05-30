import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../.planning/skills/utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface IncomingEmail {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  city: string;
}

function getMockEmails(): IncomingEmail[] {
  return [
    {
      id: "gmail_301",
      sender_email: "vendas@fortesol.com.br",
      sender_name: "Marcos Pinheiro",
      subject: "Como anunciar nossa empresa de painéis solares?",
      body: "Gostaria de saber quais os planos comerciais para integradores na página de preços. Somos de Campinas.",
      city: "Campinas"
    },
    {
      id: "gmail_302",
      sender_email: "ceo@eletromobility.com",
      sender_name: "Ana Albuquerque",
      subject: "Dúvida sobre mapa de recargas",
      body: "Vi a postagem de vocês e gostaria de listar nossos carregadores rápidos de veículos elétricos no portal Avalia Solar. Estamos sediados em Belo Horizonte.",
      city: "Belo Horizonte"
    },
    {
      id: "gmail_303",
      sender_email: "contato@solarinterior.com.br",
      sender_name: "Thiago Silva",
      subject: "Parceria solar",
      body: "Atendemos fazendas no interior paulista com painéis solares. Sediados em Bebedouro.",
      city: "Bebedouro" // FORA DA COBERTURA GEOGRÁFICA
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

async function main() {
  const { flags } = parseArgs();
  const output = (flags.output as string) || "gmail-classifier-actions.csv";
  
  console.log("📥 Buscando e-mails comerciais não lidos na inbox do Avalia Solar...");
  const emails = getMockEmails();
  
  console.log(`📊 Coletados ${emails.length} e-mails na inbox. Analisando semântica e limites geográficos...`);
  
  const processedEmails: any[] = [];
  
  for (const email of emails) {
    console.log(`\n📧 Analisando e-mail: "${email.subject}" de ${email.sender_name}`);
    
    // Validação geográfica rígida
    const cidadeNormalizada = CIDADES_PERMITIDAS.find(
      c => c.toLowerCase().trim() === email.city.toLowerCase().trim()
    );

    if (!cidadeNormalizada) {
      console.log(`   ❌ Abordagem descartada por restrição geográfica: ${email.sender_name} em ${email.city}.`);
      processedEmails.push({
        ...email,
        status: "DESCARTADO_FORA_COBERTURA",
        category: "UNKNOWN",
        draft_reply: ""
      });
      continue;
    }

    const bodyText = (email.subject + " " + email.body).toLowerCase();
    let category = "SPAM";
    let segmento = "";
    let draftReply = "";

    if (bodyText.includes("solar") || bodyText.includes("painéis") || bodyText.includes("fotovoltaico")) {
      category = "B2B_SaaS_LEAD_SOLAR";
      segmento = "solar";
      draftReply = `Olá, ${email.sender_name}. Obrigado pelo interesse no Avalia Solar. \n\nCom base na atuação da sua empresa em ${cidadeNormalizada}, preparei o Relatório de Competitividade Solar de ${cidadeNormalizada} para você: avaliasolar.com.br/relatorios/${cidadeNormalizada.toLowerCase()}. Gostaria de agendar uma reunião comercial de 10 min para te mostrar como ativar seu selo de destaque no plano Pro?`;
    } else if (bodyText.includes("recarga") || bodyText.includes("veículos") || bodyText.includes("carregador") || bodyText.includes("mobilidade")) {
      category = "B2B_SaaS_LEAD_MOBILIDADE";
      segmento = "mobilidade_eletrica";
      draftReply = `Olá, ${email.sender_name}. Obrigado pelo contato. \n\nPara a sua empresa de mobilidade elétrica em ${cidadeNormalizada}, preparei o Mapa de Demanda por Pontos de Recarga de ${cidadeNormalizada}: avaliasolar.com.br/mapas/${cidadeNormalizada.toLowerCase()}. Gostaria de conversar por 10 min amanhã sobre como expor sua rede no maior portal do Brasil?`;
    }

    console.log(`   🟢 E-mail Classificado! Categoria: ${category} | Segmento: ${segmento.toUpperCase()}`);
    processedEmails.push({
      ...email,
      city: cidadeNormalizada,
      segmento,
      category,
      draft_reply: draftReply,
      status: "RASCUNHO_GERADO_CRM_ALERTA"
    });

    // Enviar simuladamente alertas ricos no Slack para SDRs baseados em canais segmentados
    if (segmento === "solar") {
      console.log(`   [Slack-Alert] Enviado para #growth-solar: 🟢 Novo Lead Solar de ${cidadeNormalizada}! Rascunho de resposta pronto.`);
    } else if (segmento === "mobilidade_eletrica") {
      console.log(`   [Slack-Alert] Enviado para #growth-mobilidade: ⚡ Novo Lead de Mobilidade de ${cidadeNormalizada}! Rascunho de resposta pronto.`);
    }
  }

  writeCsv(output, processedEmails);
  console.log(`\n✅ Triagem e classificação de e-mails concluída!`);
  console.log(`💾 Logs de e-mails salvos em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro fatal no classificador de e-mails:", e);
  process.exit(1);
});
