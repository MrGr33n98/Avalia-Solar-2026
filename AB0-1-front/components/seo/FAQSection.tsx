import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  className?: string;
}

export default function FAQSection({
  title = 'Perguntas Frequentes',
  subtitle = 'Tire suas dúvidas rápidas sobre energia solar, preços e funcionamento do mercado fotovoltaico.',
  items,
  className = '',
}: FAQSectionProps) {
  if (!items || items.length === 0) return null;

  // Gerar o JSON-LD estruturado de FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  };

  return (
    <div className={`w-full ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="space-y-6">
        {title || subtitle ? (
          <div className="text-center md:text-left space-y-2 mb-8">
            {title && (
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-slate-500 max-w-3xl text-sm md:text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        ) : null}

        <Accordion type="single" collapsible className="w-full space-y-4">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white rounded-xl border border-slate-200/80 px-6 shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="text-left font-bold text-slate-800 hover:text-blue-600 transition-colors py-4 md:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed text-sm md:text-base pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
