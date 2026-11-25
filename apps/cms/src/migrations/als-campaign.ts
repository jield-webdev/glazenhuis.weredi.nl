import seed from '../seed-data.json';

const fields = ['title', 'intro', 'body', 'seoTitle', 'seoDescription', 'imageAlt', 'siteTitle', 'description', 'heroTitle', 'heroIntro', 'heroImageAlt', 'footerText'];
const oldUrl = /https:\/\/(?:www\.)?npo3fm\.nl[^\s)"<>]*/gi;
const oldName = /(?:3FM\s+)?Serious\s+Request|3FM/gi;
const pending = 'Zodra onze persoonlijke actiepagina beschikbaar is, vind je de link op deze website.';

function updateText(value: string) {
 return value.replace(oldUrl, seed.settings.actionUrl).replace(oldName, 'ALS')
  .replace(pending, `Doneer via [onze ALS-inzamelpagina](${seed.settings.actionUrl}). Daar zie je de opbrengst van onze inzamelpagina, exclusief de overige acties.`);
}

export function campaignChanges(record: Record<string, any>, settings = false) {
 const data: Record<string, any> = {};
 for (const field of fields) {
  if (typeof record[field] !== 'string') continue;
  const updated = updateText(record[field]);
  if (updated !== record[field]) data[field] = updated;
 }
 if (settings) {
  if (!record.actionUrl || /https:\/\/(?:www\.)?npo3fm\.nl(?:\/|$)/i.test(record.actionUrl)) data.actionUrl = seed.settings.actionUrl;
  const labels = { ...record.labels };
  for (const [key, value] of Object.entries(labels)) if (typeof value === 'string') labels[key] = updateText(value);
  delete labels.srLabel;
  labels.fundraiserLink ||= seed.settings.labels.fundraiserLink;
  if (JSON.stringify(labels) !== JSON.stringify(record.labels)) data.labels = labels;
 }
 return data;
}

export async function migrateCampaign(strapi) {
 const store = strapi.store({ type: 'core', name: 'weredi' });
 if (await store.get({ key: 'als-campaign-v1' })) return;
 for (const type of ['site-setting', 'page', 'news', 'action', 'album']) {
  const query = strapi.db.query(`api::${type}.${type}`);
  // Update each stored version in place: never publish a draft or replace relations.
  for (const record of await query.findMany()) {
   const data = campaignChanges(record, type === 'site-setting');
   if (Object.keys(data).length) await query.update({ where: { id: record.id }, data });
  }
 }
 await store.set({ key: 'als-campaign-v1', value: true });
}
