# Vertrouwde Azure MySQL-certificaten

`azure-mysql-ca.pem` bevat twee openbare rootcertificaten, zonder privésleutels:

| Rootcertificaat | SHA-256-vingerafdruk | Geldig tot |
| --- | --- | --- |
| DigiCert Global Root G2 | `CB3CCBB76031E5E0138F8DD39A23F9DE47FFC35E43C1144CEA27D46A5AB1CB5F` | 15 januari 2038 |
| Microsoft RSA Root Certificate Authority 2017 | `C741F70F4B2A8D88BF2E71C14122EF53EF10EBA0CFA5E64CFA20F418853073E0` | 18 juli 2042 |

De certificaten zijn overgenomen uit de Mozilla-truststore die met Node.js wordt meegeleverd. De tests controleren de vingerafdrukken, geldigheid en eigen ondertekening. De gebruikte roots volgen de [actuele Azure MySQL TLS-documentatie van Microsoft](https://learn.microsoft.com/en-us/azure/mysql/security/security-tls).

Officiële downloads:

- [DigiCert Global Root G2 (PEM)](https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem)
- [Microsoft RSA Root Certificate Authority 2017 (DER)](https://www.microsoft.com/pkiops/certs/Microsoft%20RSA%20Root%20Certificate%20Authority%202017.crt)

Het Microsoft-downloadbestand is DER; zet dat zo nodig met `openssl x509 -inform DER -in bestand.crt -out bestand.pem` om naar PEM. Neem bij vervanging alleen vertrouwde CA-certificaten op, geen servercertificaten of privésleutels. Controleer vooraf Microsofts rotatieberichten en voer `npm test` en `npm run db:check` uit na het vervangen van de bundel.

Bij Azure-hostnamen laadt het CMS deze bundel automatisch. Met `DATABASE_SSL_CA_FILE` kun je een eigen PEM-bundel instellen, bijvoorbeeld voor een andere vertrouwde root na een aangekondigde rotatie. Relatieve paden worden vanuit `apps/cms` geïnterpreteerd; absolute paden zijn ook toegestaan. Een ontbrekende, ongeldige of verlopen bundel verhindert opstarten. Certificaat- en hostnaamcontrole blijven altijd ingeschakeld.
