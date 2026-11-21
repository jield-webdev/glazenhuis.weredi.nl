import { X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type DatabaseEnv = {
  (key: string): string | undefined;
  (key: string, fallback: string): string;
  int(key: string, fallback: number): number;
  bool(key: string, fallback: boolean): boolean;
};

export default ({ env }: { env: DatabaseEnv }) => {
  const host = env('DATABASE_HOST', '127.0.0.1');
  const azure = /\.mysql\.database\.(azure\.com|chinacloudapi\.cn|usgovcloudapi\.net)$/i.test(host);
  const sslEnabled = env.bool('DATABASE_SSL', azure);
  const caFile = env('DATABASE_SSL_CA_FILE', '').trim();

  if (!sslEnabled && (azure || caFile)) {
    throw new Error('DATABASE_SSL must be true for Azure MySQL or when DATABASE_SSL_CA_FILE is set.');
  }

  let ca: string | undefined;
  if (sslEnabled && (azure || caFile)) {
    // Strapi runs from apps/cms in development and inside each release in production.
    const path = resolve(caFile || 'certs/azure-mysql-ca.pem');
    try {
      ca = readFileSync(path, 'utf8');
      const certificates = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
      if (!certificates?.length) throw new Error('No PEM certificates found');
      const now = Date.now();
      for (const pem of certificates) {
        const certificate = new X509Certificate(pem);
        if (!certificate.ca) throw new Error('The bundle must contain CA certificates');
        if (now < Date.parse(certificate.validFrom) || now >= Date.parse(certificate.validTo)) {
          throw new Error('A CA certificate is expired or not yet valid');
        }
      }
    } catch (error) {
      throw new Error(`Cannot load MySQL CA bundle at ${path}: ${error instanceof Error ? error.message : 'Invalid CA file'}`);
    }
  }

  return {
    connection: {
      client: 'mysql',
      connection: {
        host,
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'glazenhuis'),
        user: env('DATABASE_USERNAME', 'glazenhuis'),
        password: env('DATABASE_PASSWORD'),
        charset: 'utf8mb4',
        timezone: 'Z',
        connectTimeout: 10000,
        enableKeepAlive: true,
        ssl: sslEnabled ? {
          ...(ca ? { ca } : {}),
          rejectUnauthorized: true,
          verifyIdentity: true,
          minVersion: 'TLSv1.2' as const,
        } : false as const,
      },
      pool: { min: 0, max: 10 },
      acquireConnectionTimeout: 60000,
    },
  };
};
