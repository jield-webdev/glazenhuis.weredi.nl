# Were Di · Glazen Huis

Nederlandstalige evenementenwebsite voor **glazenhuis.weredi.nl**, gebouwd in TypeScript met Next.js 16 en Strapi 5.

## Lokaal starten

Vereist: Node.js 26, npm 11 en MariaDB 11.8 (of Docker), of Azure Database for MySQL Flexible Server.

```sh
npm ci
npm run setup
docker compose up -d db
```

Vul `apps/cms/.env` in: lokale Docker gebruikt poort `3310`, wachtwoord `local-development-only`. Start daarna:

```sh
npm run dev
```

Website: http://localhost:3000 · CMS: http://localhost:1337/admin. Maak de eerste beheerder lokaal aan; extra beheerders
worden uitsluitend door een bestaande beheerder uitgenodigd. Er is geen publieke gebruikersregistratie of publiek
uploadformulier.

Voor een ontwerpvoorbeeld zonder database: zet `CONTENT_MODE=demo` in `apps/web/.env` en start alleen
`npm run dev -w @weredi/web`. Deze modus toont de beginteksten en lege collecties. Productie gebruikt altijd
`CONTENT_MODE=cms`; bij een CMS-storing verschijnt geen fictieve demo-inhoud.

```sh
npm test
npm run typecheck
npm run build
```

## Beheerbare inhoud

Evenementinstellingen: datum en eindtijd (optioneel), locatie, titel en introductie, foto, contactadres, persoonlijke
3FM-actielink, algemeen Serious Request-adres, streefbedrag en overige opbrengsten. `labels` bevat de Nederlandse
navigatie, knoppen en sectieteksten. Pagina’s bevatten de introducties, hoofdtekst en SEO-velden. Nieuws, acties en
fotoalbums hebben afzonderlijke collecties, concepten en publiceren. Opbrengsten zijn handmatige administratie; deze
website verwerkt geen betalingen en synchroniseert niet automatisch met 3FM.

[Beheerhandleiding](docs/editor.md) · [Debian Trixie en nginx](docs/deployment.md) · [GitHub Actions](docs/github-actions.md)

## SEO en leesbaarheid voor agents

Server-gerenderde HTML, Nederlandse taalmarkering, canonieke URL’s, bewerkbare SEO-titels en beschrijvingen, Open
Graph-afbeelding, sitemap, robots.txt, WebSite/organisatie-, nieuws- en breadcrumb-JSON-LD. Event-JSON-LD verschijnt pas
na het invullen van een datum. `/llms.txt` geeft bronverwijzingen; `/api/public-content` levert alleen gepubliceerde
inhoud en de berekende opbrengst. Geen schrijftoegang voor agents. Deze voorzieningen garanderen geen indexering of
vermelding door chatdiensten.

## Bronnen en beeld

Logo en campusbeeld afkomstig van https://weredi.nl/ (homepagebeeld `DSC6388-scaled.jpg`). Dit is schoolbeeld, geen foto
van het nog te organiseren evenement. Fonts Montserrat en Titillium Web volgen de officiële schoolsite en worden lokaal
geleverd via Fontsource. Bevestig intern het hergebruik van het beeld vóór publicatie. De Serious Request-link verwijst
naar https://www.npo3fm.nl/thema/serious-request; er wordt geen editie of goed doel vastgezet zolang het evenement nog
niet is gepland.

## Verificatie en open punten

De unitcontroles en productiebuilds zijn uitgevoerd. De integratietest controleert publiceren, verborgen concepten,
uploadrechten, fotoalbums en de server-gerenderde routes tegen MariaDB. Run:
`INTEGRATION_TEST=true npm run test:integration` na een build, uitsluitend met een testdatabase.
Zie [dependency-advisories](docs/security.md) voor de resterende upstreammeldingen die vóór publieke ingebruikname
beoordeeld moeten worden. Mailjet en de echte Debian-deployment zijn zonder accountsleutels en servertoegang niet live
getest.

## Azure MySQL

Azure Database for MySQL Flexible Server wordt ondersteund met minimaal TLS 1.2, certificaatketencontrole en
hostnaamcontrole. De benodigde rootcertificaten zijn meegeleverd. Stel `DATABASE_HOST`, `DATABASE_USERNAME`,
`DATABASE_PASSWORD` en `DATABASE_SSL=true` in bij het CMS. `DATABASE_SSL_CA_FILE` is optioneel voor een eigen
PEM-bundel. Controleer de verbinding met `npm run db:check`. Volg
de [Azure-installatiestappen](docs/deployment.md#azure-database-for-mysql-flexible-server) voor netwerktoegang,
certificaten en de volledige configuratie.
