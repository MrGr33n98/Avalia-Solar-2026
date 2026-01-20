export function fixArticleContent(content: string | null | undefined): string {
  if (!content) return '';

  let fixedContent = content;

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
    // Replace all occurrences, case-insensitive if needed but simple replaceAll is safer for known terms
    // Using global regex for replacement
    const regex = new RegExp(wrong, 'g');
    fixedContent = fixedContent.replace(regex, correct);
  });

  // Basic deduplication of consecutive identical paragraphs (simple heuristic)
  // This splits by </p> to get paragraphs, checks for duplicates, and rejoins.
  // Note: This is aggressive and might break layout if not careful.
  // We'll try a safer approach: remove exact duplicate adjacent paragraphs.
  
  // const paragraphs = fixedContent.split('</p>');
  // const uniqueParagraphs: string[] = [];
  // let lastPara = '';
  
  // for (const para of paragraphs) {
  //   const trimmed = para.trim();
  //   if (trimmed && trimmed !== lastPara) {
  //     uniqueParagraphs.push(para);
  //     lastPara = trimmed;
  //   }
  // }
  
  // fixedContent = uniqueParagraphs.join('</p>');
  
  // For now, disabling paragraph deduplication to avoid breaking HTML structure
  // as content might contain divs, images, etc. mixed with p tags.
  // Sticking to term replacement which is the explicit request.

  return fixedContent;
}
