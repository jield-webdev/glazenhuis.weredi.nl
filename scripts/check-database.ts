import {existsSync} from 'node:fs';
import mysql from 'mysql2/promise';
import type {RowDataPacket} from 'mysql2/promise';
import {env} from '@strapi/utils';
import database from '../apps/cms/config/database';

async function main() {
    // Run through the CMS workspace so relative certificate and .env paths match Strapi.
    if (existsSync('.env')) process.loadEnvFile('.env');
    let connection: mysql.Connection | undefined;
    try {
        const options = database({env}).connection.connection;
        connection = await mysql.createConnection(options);
        const [rows] = await connection.query<RowDataPacket[]>(
            "SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version')",
        );
        const status = Object.fromEntries(rows.map(row => [row.Variable_name, row.Value]));
        if (options.ssl && !status.Ssl_cipher) throw new Error('De databaseverbinding gebruikt geen TLS.');
        console.log(options.ssl
            ? `Databaseverbinding geslaagd met certificaat- en hostnaamcontrole: ${status.Ssl_version}, ${status.Ssl_cipher}.`
            : 'Databaseverbinding geslaagd zonder TLS (lokale ontwikkelinstelling).');
    } catch (error) {
        console.error('Databasecontrole mislukt:', error instanceof Error ? error.message : 'Onbekende fout');
        process.exitCode = 1;
    } finally {
        await connection?.end();
    }

}

void main();
