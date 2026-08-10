const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const file = path.join(__dirname, '..', '.maestro', 'banner-ads-staging.yaml');
const documents = YAML.parseAllDocuments(fs.readFileSync(file, 'utf8'));
if (documents.length !== 2 || documents.some((document) => document.errors.length > 0)) {
  throw new Error('Fluxo Maestro de banners invalido: esperado YAML com dois documentos validos.');
}
const [config, steps] = documents.map((document) => document.toJSON());
if (!config.appId || !Array.isArray(steps) || steps.length < 4) {
  throw new Error('Fluxo Maestro de banners incompleto: appId e passos obrigatorios ausentes.');
}
const serialized = JSON.stringify(steps);
for (const required of ['Buscar instaladores', 'Patrocinado']) {
  if (!serialized.includes(required)) throw new Error('Passo ausente: ' + required);
}
console.log('Maestro banner flow valid:', file);
