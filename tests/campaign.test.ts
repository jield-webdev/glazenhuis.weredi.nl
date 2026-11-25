import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { campaignChanges, migrateCampaign } from '../apps/cms/src/migrations/als-campaign.ts';

const url = 'https://inzamelen.alsacties.nl/fundraisers/scholengemeenschap-were-di?locale=nl';

test('campaign migration updates existing copy and donation links while preserving editorial values', () => {
 const record = {
  description: 'Were Di voor 3FM Serious Request',
  heroIntro: 'Onze eigen tekst voor Serious Request.',
  labels: { campaign: 'Were Di voor 3FM Serious Request', donate: 'Doneer nu', srLabel: 'Oude link' },
  targetAmount: 5000,
  additionalAmount: 75,
 };
 const updated = { ...record, ...campaignChanges(record, true) };
 assert.equal(updated.description, 'Were Di voor ALS');
 assert.equal(updated.heroIntro, 'Onze eigen tekst voor ALS.');
 assert.equal(updated.actionUrl, url);
 assert.equal(updated.labels.donate, 'Doneer nu');
 assert.equal(updated.labels.srLabel, undefined);
 assert.equal(updated.labels.fundraiserLink, 'Bekijk onze ALS-inzamelpagina');
 assert.equal(updated.targetAmount, 5000);
 assert.equal(updated.additionalAmount, 75);
 assert.deepEqual(campaignChanges(updated, true), {});
 assert.equal(campaignChanges({ ...updated, actionUrl: 'https://example.com/actie' }, true).actionUrl, undefined);
 assert.equal(campaignChanges({ ...updated, actionUrl: 'https://www.npo3fm.nl/thema/serious-request' }, true).actionUrl, url);
});

test('migration changes stored draft and published rows independently and runs once', async () => {
 const rows = [
  { id: 1, documentId: 'page', publishedAt: null, body: 'Concept voor 3FM Serious Request' },
  { id: 2, documentId: 'page', publishedAt: '2026-11-01', body: 'Gepubliceerd voor 3FM Serious Request' },
 ];
 let done = false;
 let writes = 0;
 const strapi = {
  store: () => ({ get: async () => done, set: async () => { done = true; } }),
  db: { query: (uid: string) => ({
   findMany: async () => uid === 'api::page.page' ? rows : [],
   update: async ({ where, data }) => { Object.assign(rows.find(row => row.id === where.id)!, data); writes++; },
  }) },
 };
 await migrateCampaign(strapi);
 assert.equal(rows[0].body, 'Concept voor ALS');
 assert.equal(rows[0].publishedAt, null);
 assert.equal(rows[1].body, 'Gepubliceerd voor ALS');
 assert.equal(rows[1].publishedAt, '2026-11-01');
 await migrateCampaign(strapi);
 assert.equal(writes, 2);
});
