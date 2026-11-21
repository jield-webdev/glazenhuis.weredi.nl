import { strict as assert } from 'node:assert';
import { X509Certificate } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import database from '../apps/cms/config/database.ts';

const cms = resolve('apps/cms');
const bundle = readFileSync(resolve(cms, 'certs/azure-mysql-ca.pem'), 'utf8');
function configure(values: Record<string, string> = {}) {
  const env = Object.assign(
    (key: string, fallback?: string) => values[key] ?? fallback,
    {
      int: (key: string, fallback: number) => Number(values[key] ?? fallback),
      bool: (key: string, fallback: boolean) => values[key] === undefined ? fallback : values[key] === 'true',
    },
  ) as Parameters<typeof database>[0]['env'];
  const previous = process.cwd();
  try {
    process.chdir(cms);
    return database({ env }).connection.connection;
  } finally {
    process.chdir(previous);
  }
}

test('bundled Azure roots have the expected fingerprints, validity and self-signatures', () => {
  const certificates = bundle.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g)!;
  assert.equal(certificates.length, 2);
  const fingerprints = certificates.map(pem => {
    const certificate = new X509Certificate(pem);
    assert.ok(certificate.ca);
    assert.ok(certificate.verify(certificate.publicKey));
    assert.ok(Date.now() >= Date.parse(certificate.validFrom));
    assert.ok(Date.now() < Date.parse(certificate.validTo));
    return certificate.fingerprint256.replaceAll(':', '');
  });
  assert.deepEqual(fingerprints.sort(), [
    'CB3CCBB76031E5E0138F8DD39A23F9DE47FFC35E43C1144CEA27D46A5AB1CB5F',
    'C741F70F4B2A8D88BF2E71C14122EF53EF10EBA0CFA5E64CFA20F418853073E0',
  ].sort());
});

test('Azure automatically uses verified TLS and the bundled roots in supported clouds', () => {
  for (const domain of ['azure.com', 'chinacloudapi.cn', 'usgovcloudapi.net']) {
    const connection = configure({ DATABASE_HOST: `school.mysql.database.${domain}` });
    assert.equal(connection.port, 3306);
    assert.ok(connection.ssl);
    assert.equal(connection.ssl.ca, bundle);
    assert.equal(connection.ssl.rejectUnauthorized, true);
    assert.equal(connection.ssl.verifyIdentity, true);
    assert.equal(connection.ssl.minVersion, 'TLSv1.2');
  }
});

test('Azure cannot silently fall back to plaintext, even with an explicit false value', () => {
  assert.throws(() => configure({ DATABASE_HOST: 'school.mysql.database.azure.com', DATABASE_SSL: 'false' }), /DATABASE_SSL must be true/);
  assert.throws(() => configure({ DATABASE_SSL_CA_FILE: 'certs/azure-mysql-ca.pem' }), /DATABASE_SSL must be true/);
});

test('local development remains plaintext and generic TLS still verifies hostname and chain', () => {
  assert.equal(configure().ssl, false);
  assert.equal(configure({ DATABASE_PORT: '3310' }).port, 3310);
  const connection = configure({ DATABASE_HOST: 'db.example.test', DATABASE_SSL: 'true' });
  assert.ok(connection.ssl);
  assert.equal(connection.ssl.verifyIdentity, true);
  assert.equal(connection.ssl.rejectUnauthorized, true);
  assert.equal(connection.ssl.ca, undefined); // Use Node's trusted roots for generic TLS.
});

test('custom CA paths work and missing or malformed CA files fail before connecting', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'weredi-ca-test-'));
  const path = resolve(directory, 'custom.pem');
  try {
    writeFileSync(path, bundle);
    const connection = configure({ DATABASE_HOST: 'private-db.example.test', DATABASE_SSL: 'true', DATABASE_SSL_CA_FILE: path });
    assert.ok(connection.ssl);
    assert.equal(connection.ssl.ca, bundle);
    writeFileSync(path, 'not a certificate');
    assert.throws(() => configure({ DATABASE_SSL: 'true', DATABASE_SSL_CA_FILE: path }), /No PEM certificates found/);
    writeFileSync(path, '-----BEGIN CERTIFICATE-----\nbroken\n-----END CERTIFICATE-----');
    assert.throws(() => configure({ DATABASE_SSL: 'true', DATABASE_SSL_CA_FILE: path }), /Cannot load MySQL CA bundle/);
    assert.throws(() => configure({ DATABASE_SSL: 'true', DATABASE_SSL_CA_FILE: resolve(directory, 'missing.pem') }), /Cannot load MySQL CA bundle/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('expired and not-yet-valid CA certificates fail closed', t => {
  for (const now of ['2000-01-01', '2043-01-01']) {
    const mock = t.mock.method(Date, 'now', () => Date.parse(now));
    try {
      assert.throws(() => configure({ DATABASE_HOST: 'school.mysql.database.azure.com' }), /expired or not yet valid/);
    } finally {
      mock.mock.restore();
    }
  }
});
