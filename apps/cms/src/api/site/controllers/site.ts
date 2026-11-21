import type { Core } from '@strapi/strapi';
declare const strapi: Core.Strapi;
const fields = {
 'site-setting': ['siteTitle','description','eventDate','eventEnd','dateNote','location','targetAmount','additionalAmount','actionUrl','seriousRequestUrl','contactEmail','heroTitle','heroIntro','heroImageAlt','footerText','labels','updatedAt'],
 page: ['title','slug','intro','body','seoTitle','seoDescription','updatedAt'],
 news: ['title','slug','intro','body','seoTitle','seoDescription','imageAlt','date','updatedAt'],
 action: ['title','slug','intro','body','seoTitle','seoDescription','imageAlt','amount','updatedAt'],
 album: ['title','slug','intro','body','seoTitle','seoDescription','updatedAt'],
};
const media = (file) => file ? { url: file.url, alternativeText: file.alternativeText, width: file.width, height: file.height } : null;
const pick = (record, type) => {
 const result = Object.fromEntries(fields[type].map(key => [key, record[key] ?? null]));
 if (type === 'site-setting') result.heroImage = media(record.heroImage);
 if (['news','action'].includes(type)) result.image = media(record.image);
 if (type === 'album') result.photos = (record.photos || []).map(media);
 return result;
};
export default { async index(ctx) {
 const read = (type, populate = {}) => strapi.documents(`api::${type}.${type}` as any).findMany({ status: 'published', populate, limit: 1000 } as any);
 const [settings, pages, news, actions, albums] = await Promise.all([
 read('site-setting', { heroImage: true }), read('page'), read('news', { image: true }), read('action', { image: true }), read('album', { photos: true }),
 ]);
 if (!settings.length) return ctx.serviceUnavailable('Publiceer de evenementinstellingen om de website te openen.');
 ctx.set('Cache-Control', 'public, max-age=30');
 ctx.body = { settings: pick(settings[0], 'site-setting'), pages: pages.map(x=>pick(x,'page')), news: news.map(x=>pick(x,'news')).sort((a,b)=>String(b.date).localeCompare(String(a.date))), actions: actions.map(x=>pick(x,'action')), albums: albums.map(x=>pick(x,'album')) };
} };
