export default [
  "strapi::logger",
  "strapi::errors",
  "global::production-access",
  "strapi::security",
  { name: "strapi::cors", config: { origin: [] } },
  "strapi::poweredBy",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      jsonLimit: "2mb",
      formLimit: "2mb",
      formidable: { maxFileSize: 10 * 1024 * 1024 },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
