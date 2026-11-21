export default ({ env }) => ({
 upload: { config: { sizeLimit: 10 * 1024 * 1024, security: { allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] } } },
 email: { config: {
 provider: 'nodemailer', providerOptions: {
 host: 'in-v3.mailjet.com', port: 587, secure: false, requireTLS: true,
 auth: { user: env('MAILJET_API_KEY'), pass: env('MAILJET_SECRET_KEY') },
 }, settings: { defaultFrom: env('SMTP_FROM'), defaultReplyTo: env('SMTP_REPLY_TO', env('SMTP_FROM')) }
 } }
});
