export default ({ env }) => ({
  host: env("HOST", "127.0.0.1"),
  port: env.int("PORT", 3006),
  url: env("CMS_PUBLIC_URL", "http://localhost:3006"),
  app: { keys: env.array("APP_KEYS") },
  logger: { updates: { enabled: false } },
  proxy: { koa: env.bool("TRUST_PROXY", false) },
});
