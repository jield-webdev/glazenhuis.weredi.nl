export default ({ env }) => ({
  autoOpen: false,
  auth: { secret: env("ADMIN_JWT_SECRET") },
  apiToken: { salt: env("API_TOKEN_SALT") },
  transfer: { token: { salt: env("TRANSFER_TOKEN_SALT") } },
  secrets: { encryptionKey: env("ENCRYPTION_KEY") },
  forgotPassword: {
    from: env("SMTP_FROM", "noreply@example.invalid"),
    replyTo: env("SMTP_REPLY_TO", "noreply@example.invalid"),
  },
});
