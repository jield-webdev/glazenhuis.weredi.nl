# Installatie op Debian 13 Trixie met nginx

Deze applicatie draait als twee Node-processen achter nginx en gebruikt MariaDB of Azure Database for MySQL Flexible
Server. Publicatie op de echte server vereist DNS, SSH-toegang, repository-URL en Mailjet-sleutels. Die worden niet
meegeleverd.

## 1. Besturingssysteem en runtime

Installeer updates en pakketten als root:

```sh
apt update
apt install nginx git curl ca-certificates certbot python3-certbot-nginx sudo build-essential python3 pkg-config
# Alleen bij een lokale database:
apt install mariadb-server
```

Installeer Node.js 26 en npm 11 vanuit een door jouw organisatie vertrouwde pakketbron. Controleer de officiële
Node-downloads, verifieer de checksum en plaats `node` en `npm` in `/usr/bin` of pas de systemd-units aan de werkelijke
paden aan. Debian Trixie levert mogelijk een oudere Node-versie dan deze applicatie vereist.

Maak een ongeprivilegieerde account en mappen:

```sh
adduser --disabled-password --gecos '' glazenhuis
install -d -o glazenhuis -g glazenhuis -m 750 /var/lib/glazenhuis
install -d -o glazenhuis -g glazenhuis -m 750 /var/lib/glazenhuis/releases /var/lib/glazenhuis/shared /var/lib/glazenhuis/shared/uploads
```

De SSH-deploygebruiker is `glazenhuis`. Geef deze account een eigen deploysleutel voor alleen-lezen toegang tot de
GitHub-repository. Gebruik geen persoonlijke SSH-sleutel. Voeg de geverifieerde GitHub-hostsleutel toe aan diens
`known_hosts`.

## 2. Database

Voor een lokale database: open `mariadb` als root en voer uit met een eigen sterk wachtwoord:

```sql
CREATE
DATABASE glazenhuis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE
USER 'glazenhuis'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON glazenhuis.* TO
'glazenhuis'@'127.0.0.1';
```

Laat MariaDB alleen lokaal luisteren. De databasegebruiker heeft schemawijzigingsrechten nodig voor Strapi-migraties.

### Azure Database for MySQL Flexible Server

Gebruik je Azure, dan hoef je geen lokale MariaDB-server te installeren of bovenstaande lokale SQL uit te voeren. Maak
op Azure een lege database `glazenhuis` met tekenset `utf8mb4` en een eigen databasegebruiker die tabellen mag aanmaken,
wijzigen en verwijderen binnen die database. De applicatie gebruikt MySQL-gebruikersnaam/wachtwoord; Microsoft
Entra-tokenauthenticatie is niet geïmplementeerd.

Vervang in `/var/lib/glazenhuis/shared/cms.env` de databasevelden door:

```dotenv
DATABASE_HOST=YOUR_SERVER.mysql.database.azure.com
DATABASE_PORT=3306
DATABASE_NAME=glazenhuis
DATABASE_USERNAME=YOUR_DATABASE_USER
DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD
DATABASE_SSL=true
DATABASE_SSL_CA_FILE=
```

Gebruik de volledige Azure-servernaam, ook wanneer deze via een private endpoint wordt ontsloten. Vervang de hostnaam
niet door een IP-adres: het TLS-certificaat wordt tegen deze naam gecontroleerd. Stel de gebruikersnaam in zoals
aangemaakt op Flexible Server; voeg geen `@server` toe tenzij dat echt deel uitmaakt van de aangemaakte gebruikersnaam.

Het CMS levert de twee roots **DigiCert Global Root G2** en **Microsoft RSA Root Certificate Authority 2017** mee. Ze
volgen de [huidige Microsoft TLS-richtlijn](https://learn.microsoft.com/en-us/azure/mysql/security/security-tls). De
bundel wordt vanuit `apps/cms/certs/azure-mysql-ca.pem` geladen en zit automatisch in iedere release; er is geen
download tijdens het opstarten nodig. TLS vereist minimaal versie 1.2 en controleert zowel de certificaatketen als de
servernaam. Een Azure-host met `DATABASE_SSL=false` wordt geweigerd. Als `DATABASE_SSL` geheel ontbreekt, wordt TLS bij
Azure-hostnamen automatisch aangezet. De lokale voorbeeldconfiguratie bevat expliciet `false`; verander dit dus in
`true` voor Azure.

Voor een eigen vertrouwde bundel kun je bijvoorbeeld
`DATABASE_SSL_CA_FILE=/var/lib/glazenhuis/shared/azure-mysql-ca.pem`
instellen. Dit bestand moet leesbaar zijn voor `glazenhuis`. Een relatief pad is relatief aan `apps/cms`, niet aan de
repositoryroot. Ontbrekende, ongeldige of verlopen CA-certificaten stoppen de configuratie voordat een verbinding wordt
gemaakt. Er is geen optie om certificaat- of hostnaamcontrole uit te zetten. Bij generieke MySQL-hostnamen met TLS maar
zonder eigen bundel wordt de Node.js-truststore gebruikt.

Houd `require_secure_transport=ON` op Azure aan. Geef de Debian-server toegang via de Azure-firewall voor zijn vaste
uitgaande IP-adres, of zorg voor private routing en private DNS. Sta uitgaand TCP 3306 toe op Debian. Open Azure MySQL
niet voor alle IP-adressen.

Controleer na het instellen van de environmentbestanden de verbinding vanuit een release:

```sh
cd /var/lib/glazenhuis/current
npm run db:check
```

De controle gebruikt dezelfde configuratie als Strapi, maakt uitsluitend een verbinding en leest de TLS-sessiegegevens.
Hij maakt geen tabellen of records aan en toont geen wachtwoord. Bij Azure is de controle pas geslaagd als certificaat-
en hostnaamcontrole slagen en de sessie een TLS-cipher meldt. Zonder Azure-server en credentials kun je de config en
certificaatbundel testen met `npm test`; dat is geen live Azure-verbindingstest.

Dezelfde instelling werkt lokaal via `apps/cms/.env`. Bij een nieuwe server zonder eerste release kun je de controle
vanuit `/var/lib/glazenhuis/repository` uitvoeren nadat `apps/cms/.env` naar de juiste instellingen verwijst. Stel voor
Azure een backup- en herstelbeleid in en maak vóór releases een herstelpunt, omdat Strapi schemawijzigingen kan
uitvoeren.

## 3. Eerste release

Als `glazenhuis`:

```sh
git clone YOUR_REPOSITORY_SSH_URL /var/lib/glazenhuis/repository
cd /var/lib/glazenhuis/repository
npm ci
npm run setup
cp apps/cms/.env /var/lib/glazenhuis/shared/cms.env
cp apps/web/.env /var/lib/glazenhuis/shared/web.env
chmod 600 /var/lib/glazenhuis/shared/*.env
```

Vul `shared/cms.env` aan:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3006
CMS_PUBLIC_URL=https://glazenhuis.weredi.nl/cms
TRUST_PROXY=true
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=glazenhuis
DATABASE_USERNAME=glazenhuis
DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD
SEED_CONTENT=true
MAILJET_API_KEY=YOUR_MAILJET_API_KEY
MAILJET_SECRET_KEY=YOUR_MAILJET_SECRET_KEY
SMTP_FROM=noreply@weredi.nl
SMTP_REPLY_TO=YOUR_ORGANISATION_ADDRESS
```

Behoud alle door setup gegenereerde geheimen. Vul `shared/web.env` in:

```dotenv
NODE_ENV=production
CMS_URL=http://127.0.0.1:3006
SITE_URL=https://glazenhuis.weredi.nl
CONTENT_MODE=cms
NEXT_PUBLIC_CMS_URL=
PORT=3005
HOSTNAME=127.0.0.1
CMS_ADMIN_URL=/cms/admin
```

Mailjet gebruikt SMTP met verplichte STARTTLS op poort 587. Verifieer het afzenderdomein in Mailjet en voeg hun SPF- en
DKIM-records toe. Open uitgaand TCP 587. De sleutels komen uitsluitend in het CMS-environmentbestand.

Als root, installeer het deployscript en de units uit deze repository:

```sh
install -o root -g root -m 755 deploy/deploy.sh /usr/local/bin/glazenhuis-deploy
cp deploy/glazenhuis-*.service /etc/systemd/system/
systemctl daemon-reload
```

Geef met `visudo -f /etc/sudoers.d/glazenhuis` uitsluitend deze bevoegdheid:

```text
glazenhuis ALL=(root) NOPASSWD: /usr/bin/systemctl restart glazenhuis-cms glazenhuis-web
```

Voer als deploygebruiker uit met het volledige 40-teken commit-ID op `main`:

```sh
/usr/local/bin/glazenhuis-deploy FULL_COMMIT_SHA
```

De eerste start maakt de tabellen en begininhoud aan. Zet daarna `SEED_CONTENT=false` in `shared/cms.env`. De seed is
ook door een databasevlag beschermd tegen overschrijven.

Maak vóór het publiek openen van nginx een eerste beheerder via Strapi CLI. Controleer de opties met:

```sh
cd /var/lib/glazenhuis/current/apps/cms
npm run strapi -- admin:create-user --help
```

Gebruik de interactieve invoer als de CLI die ondersteunt. Anders voer je de vereiste `--firstname`, `--lastname`,
`--email` en `--password` alleen in een afgeschermde SSH-sessie in, met shellhistorie uitgeschakeld; het wachtwoord kan
kort zichtbaar zijn in de lokale proceslijst. Strapi kan hiervoor een tijdelijke service-stop vereisen. Start de
services daarna opnieuw. Het nginx-bestand blokkeert openbare aanmaak van de eerste beheerder; nieuwe beheerders worden
later op uitnodiging aangemaakt.

## 4. nginx en TLS

Wijs DNS A/AAAA van `glazenhuis.weredi.nl` naar de server. Installeer de configuratie:

```sh
cp deploy/nginx.conf /etc/nginx/sites-available/glazenhuis.weredi.nl
ln -s /etc/nginx/sites-available/glazenhuis.weredi.nl /etc/nginx/sites-enabled/
usermod -a -G glazenhuis www-data
nginx -t
systemctl restart nginx
certbot --nginx -d glazenhuis.weredi.nl
systemctl enable glazenhuis-cms glazenhuis-web
```

Uploads zijn gedeeld tussen releases. nginx moet leesrechten hebben: bestanden doorgaans `640`, mappen `750`, groep
`glazenhuis`. `www-data` wordt daarom lid van deze groep. Open uitsluitend SSH, 80 en 443 in de firewall; 3005, 3006 en
MariaDB blijven lokaal. Controleer `ss -ltnp`; Next wordt gestart met een expliciet loopbackadres.

## 5. Controleren en onderhouden

Controleer `/api/health`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/cms/admin`, een concept dat onzichtbaar blijft
en het uploaden/publiceren van een foto. Stel de CMS-profieltaal op Nederlands in. Verstuur een Mailjet-testmail en test
wachtwoordherstel.

Logs: `journalctl -u glazenhuis-cms -u glazenhuis-web`. Maak dagelijks een versleutelde MariaDB-backup en kopie van
`shared/uploads` en de environmentbestanden buiten de server. Test herstel. Maak ook vóór iedere release een
databasebackup: Strapi voert bij opstart schemawijzigingen uit. De code-rollback van het deployscript draait die niet
terug. Bewaar minstens twee geslaagde releases; verwijder oude releases alleen als ze niet door `current` worden
gebruikt.

Handmatige rollback: stop beide services, herstel indien nodig de database en uploads uit dezelfde backup, wijs
`current` naar de vorige release en start beide services. Bij een mislukte eerste deployment zonder vorige release: stop
de services en herstel de fout vóór herstart.
