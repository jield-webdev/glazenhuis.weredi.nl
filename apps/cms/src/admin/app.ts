// Default the CMS interface to Dutch; preserve an administrator’s language choice.
if (typeof window !== 'undefined' && !localStorage.getItem('strapi-admin-language')) localStorage.setItem('strapi-admin-language', 'nl');
export default {
 config: { locales: ['nl'], translations: { nl: {
 'app.components.LeftMenu.navbrand.title': 'Were Di · Glazen Huis',
 'Auth.form.welcome.title': 'Welkom bij Were Di',
 'Auth.form.welcome.subtitle': 'Beheer het Glazen Huis',
 } }, tutorials: false, notifications: { releases: false } }, bootstrap() {},
};
