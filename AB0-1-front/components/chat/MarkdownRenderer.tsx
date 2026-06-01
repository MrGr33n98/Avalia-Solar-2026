import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Quebra por parágrafos primeiro
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, pIndex) => {
        // Se o parágrafo for uma lista
        if (paragraph.trim().match(/^[-*]\s/m)) {
          const items = paragraph.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
          return (
            <ul key={pIndex} className="list-disc pl-5 space-y-1 my-1">
              {items.map((item, iIndex) => {
                const text = item.replace(/^[-*]\s+/, '');
                return <li key={iIndex}>{renderInline(text)}</li>;
              })}
            </ul>
          );
        }

        // Se for texto normal com possíveis quebras de linha
        const lines = paragraph.split('\n');
        return (
          <p key={pIndex} className="leading-relaxed">
            {lines.map((line, lIndex) => (
              <React.Fragment key={lIndex}>
                {renderInline(line)}
                {lIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// Renderiza tokens inline retornando um array de nós React
function renderInline(text: string): React.ReactNode[] {
  // Regex combinada para capturar Link, Bold, Italic ou URL crua
  // 1: Link markdown [text](url) -> match[1]=text, match[2]=url
  // 3: Bold **text** -> match[3]=text
  // 4: URL crua http... -> match[4]=url
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }

    if (match[1] && match[2]) {
      // Link markdown
      nodes.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue dark:text-brand-cyan underline hover:text-brand-blue-dark transition-colors break-all"
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // Bold
      nodes.push(<strong key={`bold-${match.index}`} className="font-bold">{match[3]}</strong>);
    } else if (match[4]) {
      // Raw URL
      nodes.push(
        <a
          key={`url-${match.index}`}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue dark:text-brand-cyan underline hover:text-brand-blue-dark transition-colors break-all"
        >
          {match[4]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return nodes;
}
