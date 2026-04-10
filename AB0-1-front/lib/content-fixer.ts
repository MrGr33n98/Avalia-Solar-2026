function unescapeHTML(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, m => entities[m]);
}

export function fixArticleContent(content: string | null | undefined): string {
  if (!content) return '';

  let fixedContent = content;

  // Se o conteúdo parece estar escapado (contendo &lt;p ou &lt;div), nós desescapamos
  // Isso resolve o problema quando o usuário cola HTML bruto no editor visual
  if (fixedContent.includes('&lt;') && (fixedContent.includes('&lt;p') || fixedContent.includes('&lt;div') || fixedContent.includes('&lt;h'))) {
    fixedContent = unescapeHTML(fixedContent);
  }

  // Fix specific incorrect terms
  const replacements: Record<string, string> = {
    'fotoforos': 'painéis fotovoltaicos',
    'cérebros celulares': 'células fotovoltaicas',
    'fotocatalisador': 'célula fotovoltaica',
    'Fotoforos': 'Painéis fotovoltaicos',
    'Cérebros celulares': 'Células fotovoltaicas',
    'Fotocatalisador': 'Célula fotovoltaica',
  };

  Object.entries(replacements).forEach(([wrong, correct]) => {
    const regex = new RegExp(wrong, 'g');
    fixedContent = fixedContent.replace(regex, correct);
  });

  return fixedContent;
}
