import { parseVCardText, vCardContactsToCsv, isVCardFile } from '@/lib/vcard/vcard-parser';

describe('vCard (.vcf) Parser', () => {
  const sampleVcf = `
BEGIN:VCARD
VERSION:3.0
FN:Carlos Eduardo
N:Eduardo;Carlos;;;
ORG:Solar Tech Brasil
TITLE:Diretor Comercial
TEL;TYPE=CELL,VOICE:(65) 99999-8888
EMAIL;TYPE=WORK:carlos@solartech.com.br
ADR;TYPE=WORK:;;Av. Historiador Rubens de Mendonca;Cuiabá;MT;78000-000;Brasil
NOTE:Interessado em plano Enterprise
END:VCARD

BEGIN:VCARD
VERSION:2.1
FN:Mariana Souza
ORG:Inovação Solar
TEL;WORK:6533334444
EMAIL;INTERNET:mariana@inovacao.com
END:VCARD
`;

  it('correctly parses multiple vCard contacts from text', () => {
    const contacts = parseVCardText(sampleVcf);
    expect(contacts).toHaveLength(2);

    expect(contacts[0].name).toBe('Carlos Eduardo');
    expect(contacts[0].company).toBe('Solar Tech Brasil');
    expect(contacts[0].role).toBe('Diretor Comercial');
    expect(contacts[0].phone).toBe('(65) 99999-8888');
    expect(contacts[0].email).toBe('carlos@solartech.com.br');
    expect(contacts[0].city).toBe('Cuiabá');
    expect(contacts[0].state).toBe('MT');
    expect(contacts[0].notes).toBe('Interessado em plano Enterprise');

    expect(contacts[1].name).toBe('Mariana Souza');
    expect(contacts[1].company).toBe('Inovação Solar');
    expect(contacts[1].phone).toBe('6533334444');
    expect(contacts[1].email).toBe('mariana@inovacao.com');
  });

  it('converts parsed vCard contacts to valid CRM CSV format', () => {
    const contacts = parseVCardText(sampleVcf);
    const csv = vCardContactsToCsv(contacts);

    expect(csv).toContain('nome,empresa,cargo,email,telefone,cidade,estado,notas');
    expect(csv).toContain('"Carlos Eduardo","Solar Tech Brasil"');
    expect(csv).toContain('"Mariana Souza","Inovação Solar"');
  });

  it('identifies vCard files based on extension or mime type', () => {
    const vcfFile = new File([''], 'contato.vcf', { type: 'text/vcard' });
    const csvFile = new File([''], 'contato.csv', { type: 'text/csv' });

    expect(isVCardFile(vcfFile)).toBe(true);
    expect(isVCardFile(csvFile)).toBe(false);
  });
});
