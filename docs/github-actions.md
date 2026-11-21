# GitHub Actions

`.github/workflows/deploy.yml` volgt de SSH-aanpak van `tempo-clubrecords`: tests en builds op pull requests, alleen deployment van een geteste commit op `main`, één deployment tegelijk, SSH met vastgelegde host key en een productie-environment.

Maak het GitHub-environment `production` en voeg deze secrets toe:

| Secret | Waarde |
| --- | --- |
| DEPLOY_HOST | Servernaam of IP |
| DEPLOY_USER | glazenhuis |
| DEPLOY_PORT | Meestal 22 |
| DEPLOY_SSH_KEY | Private sleutel van de aparte deployaccount |
| DEPLOY_KNOWN_HOSTS | Buiten de workflow geverifieerde SSH-hostsleutel van de server |

Installeer de bijbehorende public key in de deployaccount. Beperk deze sleutel tot het benodigde gebruik en schakel forwarding en PTY uit. De serverrepository gebruikt een aparte read-only GitHub deploysleutel. Neem databasewachtwoorden en Mailjet-sleutels nooit op in GitHub-code of buildartefacten.

De server haalt uitsluitend commits op die deel zijn van `origin/main`, bouwt in een nieuwe releasemap en wisselt de symlink atomair. Een healthcheck controleert ook de CMS-koppeling. De workflow installeert geen server en wijzigt geen DNS; volg eerst de installatiehandleiding. CI gebruikt voorbeeldinhoud om zonder productiedatabase te bouwen. De productie gebruikt de CMS-inhoud.

Voer een dependency-audit uit vóór iedere publieke release. Beoordeel advisories in de volledige Strapi-afhankelijkheidsketen; voer geen geforceerde major-downgrades uit om een audituitkomst te verbergen.
