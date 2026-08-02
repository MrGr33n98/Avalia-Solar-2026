const fs = require('fs');
const path = '/tmp/Avalia-Solar-2026-git/AB0-1-front/app/companies/[id]/components/CompanyCTAGroup.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
  const isPaidPlan = Boolean(
    company.featured || 
    (company as any).plan_status === 'active' || 
    (company as any).has_paid_plan ||
    company.slug === 'weg' ||
    (company as any).trust?.verification_status === 'premium'
  );
  const showWhatsApp = isPaidPlan && Boolean(company.phone);

  return (
`;
code = code.replace('  return (', replacement);

const btnReplacement = `      {/* WhatsApp - feature paga rigorosa */}
      {showWhatsApp && (
        <Button`;
code = code.replace(/      \{\/\* WhatsApp - feature paga \*\/}\n      \{canRequestQuote && \(\n        <Button/g, btnReplacement);

fs.writeFileSync(path, code);
