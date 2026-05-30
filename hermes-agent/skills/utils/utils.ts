import * as fs from "fs";
import * as path from "path";

// Helper para ler argumentos da CLI
export function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const parts = arg.slice(2).split("=");
      const key = parts[0];
      const val = parts.slice(1).join("=");
      flags[key] = val === "" ? true : val;
    }
  }
  return { flags, args };
}

// Ler arquivo CSV e converter para array de objetos
export function readCsv(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.error(`⚠️ Arquivo não encontrado: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(",");
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = currentLine[index] ? currentLine[index].trim().replace(/^["']|["']$/g, "") : "";
    });
    data.push(row);
  }
  return data;
}

// Escrever array de objetos em formato CSV
export function writeCsv(filePath: string, data: any[]): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? "" : String(row[header]);
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, csvRows.join("\n"), "utf-8");
}

// Utilitário de retry para chamadas de rede resilientes
export async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// Validador de variáveis de ambiente obrigatórias
export function requiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Erro: Variável de ambiente ${key} é obrigatória no arquivo .env`);
    process.exit(1);
  }
  return val;
}
