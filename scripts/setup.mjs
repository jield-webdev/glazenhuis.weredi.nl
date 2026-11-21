import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
for (const app of ['cms','web']) {
 const path = `apps/${app}/.env`;
 if (existsSync(path)) { console.log(`${path} bestaat al; overgeslagen.`); continue; }
 const template = readFileSync(`${path}.example`, 'utf8').replaceAll('GENERATE_SECRET', () => randomBytes(32).toString('hex'));
 writeFileSync(path, template, { mode: 0o600 }); console.log(`${path} aangemaakt. Vul de database- en e-mailgegevens in.`);
}
