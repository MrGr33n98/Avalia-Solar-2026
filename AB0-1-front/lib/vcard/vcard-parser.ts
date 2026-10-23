/**
 * vCard (.vcf) Parser para o CRM Avalia Solar
 * Converte arquivos vCard (v2.1, v3.0, v4.0) em dados estruturados e CSV canônico
 * compatível com o importador de leads e contatos do CRM.
 */

export interface VCardContact {
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  notes?: string;
}

/**
 * Remove quebras de linha com escape e desdobra linhas conforme especificação RFC 6350 / RFC 2426
 */
function unfoldVCardLines(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const unfolded: string[] = [];

  for (const line of normalized.split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      // Linha continuada do vCard
      unfolded[unfolded.length - 1] += line.slice(1);
    } else if (line.trim()) {
      unfolded.push(line.trim());
    }
  }

  return unfolded;
}

/**
 * Decodifica valores com escape de vCard (ex: \\, -> ,, \\; -> ;)
 */
function cleanVCardValue(val: string): string {
  return val
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\n/gi, ' ')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Analisa o conteúdo de texto de um arquivo .vcf e retorna uma lista de contatos
 */
export function parseVCardText(vcfContent: string): VCardContact[] {
  const lines = unfoldVCardLines(vcfContent);
  const contacts: VCardContact[] = [];
  let current: Partial<VCardContact> | null = null;

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    if (upperLine.startsWith('BEGIN:VCARD')) {
      current = {};
      continue;
    }

    if (upperLine.startsWith('END:VCARD')) {
      if (current && (current.name || current.email || current.phone || current.company)) {
        contacts.push({
          name: current.name || current.company || 'Contato Sem Nome',
          company: current.company || '',
          role: current.role || '',
          email: current.email || '',
          phone: current.phone || '',
          city: current.city || '',
          state: current.state || '',
          notes: current.notes || '',
        });
      }
      current = null;
      continue;
    }

    if (!current) continue;

    // Extrair chave e valor (ex: "TEL;TYPE=CELL:(65) 99999-8888" -> chave TEL, valor "(65) 99999-8888")
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const rawKey = line.slice(0, colonIndex);
    const value = cleanVCardValue(line.slice(colonIndex + 1));
    const mainKey = rawKey.split(';')[0].toUpperCase().trim();

    switch (mainKey) {
      case 'FN': // Full Name
        if (!current.name) current.name = value;
        break;

      case 'N': { // Structured Name: LastName;FirstName;Middle;Prefix;Suffix
        if (!current.name) {
          const parts = value.split(';').map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            current.name = `${parts[1]} ${parts[0]}`.trim();
          } else if (parts.length === 1) {
            current.name = parts[0];
          }
        }
        break;
      }

      case 'ORG': // Company / Organization
        // vCard pode usar "Empresa;Departamento"
        current.company = value.split(';')[0].trim();
        break;

      case 'TITLE': // Job Title / Cargo
      case 'ROLE':
        current.role = value;
        break;

      case 'TEL': // Telefone
        if (!current.phone) {
          current.phone = value;
        }
        break;

      case 'EMAIL': // E-mail
        if (!current.email) {
          current.email = value;
        }
        break;

      case 'ADR': { // Endereço: post-office-box;extended;street;city;state;postal-code;country
        const adrParts = value.split(';');
        if (adrParts.length >= 4 && adrParts[3]) current.city = adrParts[3].trim();
        if (adrParts.length >= 5 && adrParts[4]) current.state = adrParts[4].trim();
        break;
      }

      case 'NOTE':
        current.notes = (current.notes ? `${current.notes} | ` : '') + value;
        break;
    }
  }

  return contacts;
}

/**
 * Converte contatos de vCard em formato CSV pronto para o importador de leads
 */
export function vCardContactsToCsv(contacts: VCardContact[]): string {
  const headers = ['nome', 'empresa', 'cargo', 'email', 'telefone', 'cidade', 'estado', 'notas'];
  const rows = contacts.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${(c.role || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.city || '').replace(/"/g, '""')}"`,
    `"${(c.state || '').replace(/"/g, '""')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Helper para verificar se um arquivo é vCard
 */
export function isVCardFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith('.vcf') ||
    file.name.toLowerCase().endsWith('.vcard') ||
    file.type === 'text/vcard' ||
    file.type === 'text/x-vcard'
  );
}
