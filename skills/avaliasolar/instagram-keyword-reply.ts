import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../.planning/skills/utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface InstagramMessage {
  id: string;
  username: string;
  keyword: string;
  message_text: string;
  city: string;
}

function getMockIncomingDMs(): InstagramMessage[] {
  return [
    {
      id: "dm_201",
      username: "sol_forte_energia",
      keyword: "SOLAR",
      message_text: "Quero saber mais sobre como destacar nossa empresa e o plano SOLAR",
      city: "Guarulhos"
    },
    {
      id: "dm_202",
      username: "volt_mobilidade",
      keyword: "ELÉTRICO",
      message_text: "Gostaria de ver o mapa de demanda do setor ELÉTRICO na nossa cidade",
      city: "Belo Horizonte"
    },
    {
      id: "dm_203",
      username: "curitibasolar",
      keyword: "SOLAR",
      message_text: "Quero cupom para o plano Pro SOLAR",
      city: "Curitiba"
    },
    {
      id: "dm_204",
      username: "mobi_interior",
      keyword: "ELÉTRICO",
      message_text: "Quero participar do setor ELÉTRICO",
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

async function sendInstagramDirectMessage(username: string, text: string): Promise<boolean> {
  const instagramToken = process.env.META_INSTAGRAM_TOKEN;
  
  return retry(async () => {
    if (!instagramToken) {
      console.log(`   [MOCK-IG-DM] Mensagem enviada para @${username}: "${text}"`);
      return true;
    }
    // Requisição real na Graph API da Meta
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${instagramToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: { username },
        message: { text }
      })
    });
    return res.ok;
  });
}

async function main() {
  const { flags } = parseArgs();
  const output = (flags.output as string) || "instagram-actions.csv";
  
  console.log("📥 Buscando DMs não lidas com palavras-chave no Instagram da Avalia Solar...");
  const dms = getMockIncomingDMs();
  
  console.log(`📊 Coletadas ${dms.length} DMs recentes. Iniciando processamento de termos...`);
  
  const processedActions: any[] = [];
  
  for (const dm of dms) {
    console.log(`\n💬 Analisando DM de @${dm.username}: "${dm.message_text}"`);
    
    // Validação geográfica obrigatória antes de qualquer resposta promocional
    const cidadeNormalizada = CIDADES_PERMITIDAS.find(
      c => c.toLowerCase().trim() === dm.city.toLowerCase().trim()
    );

    if (!cidadeNormalizada) {
      console.log(`   ❌ Abordagem descartada por restrição geográfica: ${dm.username} está em ${dm.city}.`);
      await sendInstagramDirectMessage(
        dm.username,
        `Olá! Agradecemos o contato. No momento, nossa plataforma de destaque atende apenas grandes centros urbanos. Adicionamos você em nossa lista de espera regional!`
      );
      continue;
    }

    let replyText = "";
    let segmento = "";

    if (dm.keyword === "SOLAR") {
      segmento = "solar";
      replyText = `Olá! Que excelente ver sua empresa de energia solar em ${cidadeNormalizada}. Aqui está seu Relatório de Competitividade Solar gratuito da região: avaliasolar.com.br/relatorios/${cidadeNormalizada.toLowerCase()}. Quer testar o plano Pro do portal grátis por 14 dias?`;
    } else if (dm.keyword === "ELÉTRICO") {
      segmento = "mobilidade_eletrica";
      replyText = `Olá! Excelente iniciativa com mobilidade elétrica em ${cidadeNormalizada}. Aqui está o Mapa de Demanda por Pontos de Recarga da sua cidade: avaliasolar.com.br/mapas/${cidadeNormalizada.toLowerCase()}. Gostaria de destacar sua rede no maior portal de reputação do país?`;
    }

    if (segmento) {
      console.log(`   🟢 DM Aprovada! Segmento: ${segmento.toUpperCase()} | Cidade: ${cidadeNormalizada}`);
      const success = await sendInstagramDirectMessage(dm.username, replyText);
      
      if (success) {
        processedActions.push({
          username: dm.username,
          city: cidadeNormalizada,
          segmento,
          keyword: dm.keyword,
          sent_text: replyText,
          status: "RESPONDIDO_E_QUALIFICADO"
        });
      }
    }
  }

  writeCsv(output, processedActions);
  console.log(`\n✅ Respostas no Instagram processadas com sucesso!`);
  console.log(`💾 Ações salvas em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro fatal no Instagram Auto-Reply:", e);
  process.exit(1);
});
