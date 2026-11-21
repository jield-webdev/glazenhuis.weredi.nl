import seed from './seed-data.json';
export default { async bootstrap({ strapi }) {
 // Translate content editor field labels without changing English API names.
 const manager = strapi.plugin('content-manager').service('content-types');
 const labels = { title: 'Titel', slug: 'Webadres', intro: 'Introductie', body: 'Tekst', seoTitle: 'SEO-titel', seoDescription: 'SEO-beschrijving', image: 'Afbeelding', imageAlt: 'Alternatieve tekst', date: 'Datum', amount: 'Opbrengst in euro’s', photos: 'Foto’s', siteTitle: 'Websitetitel', description: 'Beschrijving', eventDate: 'Begindatum en tijd', eventEnd: 'Einddatum en tijd', dateNote: 'Toelichting bij datum', location: 'Locatie', targetAmount: 'Streefbedrag in euro’s', additionalAmount: 'Overige opbrengsten in euro’s', actionUrl: 'Persoonlijke 3FM-actielink', seriousRequestUrl: 'Serious Request-link', contactEmail: 'Contactadres', heroTitle: 'Titel op voorpagina', heroIntro: 'Introductie op voorpagina', heroImage: 'Foto op voorpagina', heroImageAlt: 'Alternatieve tekst voorpaginafoto', footerText: 'Voettekst', labels: 'Nederlandse interface- en sectieteksten' };
 for (const name of ['page','news','action','album','site-setting']) {
  const model = strapi.contentTypes[`api::${name}.${name}`];
  const configuration = await manager.findConfiguration(model);
  for (const [key, label] of Object.entries(labels)) {
   const metadata = configuration.metadatas[key];
   if (metadata) { metadata.edit.label = label; metadata.list.label = label; }
  }
  await manager.updateConfiguration(model, configuration);
 }
 // Seed only once, explicitly. Never republish or overwrite editorial changes.
 if (process.env.SEED_CONTENT !== 'true') return;
 const store = strapi.store({ type: 'core', name: 'weredi' });
 if (await store.get({ key: 'seeded-v1' })) return;
 for (const page of seed.pages) {
  const existing = await strapi.documents('api::page.page').findFirst({ filters: { slug: page.slug } });
  if (!existing) await strapi.documents('api::page.page').create({ data: page, status: 'published' });
 }
 if (!await strapi.documents('api::site-setting.site-setting').findFirst())
  await strapi.documents('api::site-setting.site-setting').create({ data: seed.settings, status: 'published' });
 await store.set({ key: 'seeded-v1', value: true });
} };
