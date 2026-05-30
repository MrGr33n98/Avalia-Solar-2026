import * as fs from "fs";
import { parseArgs, writeCsv, retry } from "../../.planning/skills/utils.ts";

import * as dotenv from "dotenv";
dotenv.config();

interface LinkedInTarget {
  id: string;
  name: string;
  title: string;
  company: string;
  city: string;
  state: string;
  segmento: "solar" | "mobilidade";
}

function getMockLinkedInTargets(segmento: string): LinkedInTarget[] {
  if (segmento === "solar") {
    return [
      { id: "li_401", name: "Eduardo Rocha", title: "Diretor de Operações Solares", company: "Rocha Energia Solar", city: "Campinas", state: "SP", segmento: "solar" },
      { id: "li_402", name: "Fernanda Lima", title: "Sócia Proprietária", company: "Lima FotoVolt", city: "Niterói", state: "RJ", segmento: "solar" },
      { id: "li_403", name: "Gabriel Souza", title: "Gerente Comercial", company: "Souza Placas Solares", city: "Joinville", state: "SC", segmento: "solar" }
    ];
  } else {
    return [
      { id: "li_404", name: "Gustavo Valente", title: "CEO", company: "Valente E-Bikes", city: "São Bernardo do Campo", state: "SP", segmento: "mobilidade" },
      { id: "li_405", name: "Juliana Frota", title: "Gerente de Expansão", company: "EletroVolt Frotas", city: "Belo Horizonte", state: "MG", segmento: "mobilidade" },
      { id: "li_406", name: "Patricia Pires", title: "Sócia Fundadora", company: "Pires Recargas Rápidas", city: "Porto Alegre", state: "RS", segmento: "mobilidade" }
    ];
  }
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

function generateOutboundMessage(lead: LinkedInTarget): string {
  if (lead.segmento === "solar") {
    return `Olá, ${lead.name}. Acompanho a relevância comercial da ${lead.company} no segmento de energia solar em ${lead.city}. Estamos lançando o Relatório de Competitividade Solar de ${lead.city} esta semana no portal Avalia Solar. Gostaria de te enviar o acesso gratuito para checar como está sua visibilidade local?`;
  } else {
    return `Olá, ${lead.name}. Vejo que a ${lead.company} é destaque regional no mercado de mobilidade elétrica em ${lead.city}. Lançamos no Avalia Solar o Mapa de Demanda por Pontos de Recarga de ${lead.city}. Posso te enviar o link para ver o potencial de atração de novos clientes para sua marca?`;
  }
}

async function main() {
  const { flags } = parseArgs();
  const segmento = (flags.segmento as string) || "solar";
  const output = (flags.output as string) || `linkedin-${segmento}-prospects.csv`;

  if (segmento !== "solar" && segmento !== "mobilidade") {
    console.error("❌ Erro: O parâmetro --segmento deve ser 'solar' ou 'mobilidade'.");
    process.exit(1);
  }

  console.log(`📡 Iniciando prospecção regional no LinkedIn para o segmento: [${segmento.toUpperCase()}]`);
  const targets = getMockLinkedInTargets(segmento);
  
  console.log(`📊 Total de alvos mapeados na campanha: ${targets.length}`);
  console.log("⚠️  Processando e gerando abordagens geolocalizadas...");

  const activeProspects: any[] = [];

  for (const lead of targets) {
    // Validação geográfica rígida
    const cidadeNormalizada = CIDADES_PERMITIDAS.find(
      c => c.toLowerCase().trim() === lead.city.toLowerCase().trim()
    );

    if (!cidadeNormalizada) {
      console.log(`   ❌ Lead ${lead.name} desconsiderado: cidade ${lead.city} não autorizada.`);
      continue;
    }

    const message = generateOutboundMessage(lead);
    console.log(`   🟢 Abordagem Gerada para ${lead.name} (${lead.company} - ${cidadeNormalizada}):`);
    console.log(`      └─ Pitch: "${message.slice(0, 80)}..."`);

    activeProspects.push({
      ...lead,
      city: cidadeNormalizada,
      segmento: segmento === "solar" ? "solar" : "mobilidade_eletrica",
      custom_connection_pitch: message,
      status: "PRONTO_PARA_ABORDAGEM"
    });
  }

  writeCsv(output, activeProspects);
  console.log(`\n✅ Prospecção regional LinkedIn salva em: ${output}`);
}

main().catch(e => {
  console.error("❌ Erro fatal na prospecção LinkedIn:", e);
  process.exit(1);
});
