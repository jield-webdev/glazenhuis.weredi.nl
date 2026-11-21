# GitHub Actions

`.github/workflows/deploy.yml` volgt de SSH-aanpak van `tempo-clubrecords`: tests en builds op pull requests, alleen deployment van een geteste commit op `main`, één deployment tegelijk, SSH met vastgelegde host key en een productie-environment.

Maak het GitHub-environment `production` en voeg deze secrets toe:

| Secret | Waarde |
| --- | --- |
| DEPLOY_HOST | Servernaam of IP |
| DEPLOY_USER | glazenhuis |
| DEPLOY_PORT | Meestal 22 |
| DEPLOY_SSH_KEY | Private sleutel van de aparte deployaccount |
| DEPLOY_KNOWN_HOSTS | Volledige, buiten de workflow geverifieerde `known_hosts`-regel(s) van de server, inclusief hostnaam en eventueel poort |

Installeer de bijbehorende public key in de deployaccount. Beperk deze sleutel tot het benodigde gebruik en schakel forwarding en PTY uit. De serverrepository gebruikt een aparte read-only GitHub deploysleutel. Neem databasewachtwoorden en Mailjet-sleutels nooit op in GitHub-code of buildartefacten.

## SSH-hostsleutel vastleggen

De melding `No ED25519 host key is known ...` betekent dat SSH geen vertrouwde ED25519-hostsleutel voor deze bestemming
kan vinden. De verbinding stopt vóór authenticatie met `DEPLOY_SSH_KEY`. Controleer de inhoud van `DEPLOY_KNOWN_HOSTS`:
alleen een fingerprint (`SHA256:...`) of een public key zonder hostnaam is niet voldoende. Gebruik exact dezelfde
servernaam of hetzelfde IP-adres als `DEPLOY_HOST`, zonder `ssh://`, gebruikersnaam of poort in dat secret.

Verzamel op je eigen computer de publieke hostsleutel met de werkelijke SSH-poort:

```sh
deploy_host=YOUR_DEPLOY_HOST
deploy_port=22 # vervang door DEPLOY_PORT als die anders is
ssh-keyscan -p "$deploy_port" -t ed25519 "$deploy_host" > deploy_known_hosts
ssh-keygen -lf deploy_known_hosts
```

Controleer de getoonde SHA256-fingerprint via een vertrouwde serverconsole of bij de serverbeheerder. Op de Debian-server:

```sh
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Pas als de fingerprints overeenkomen, kopieer je de **volledige inhoud** van `deploy_known_hosts` naar
`DEPLOY_KNOWN_HOSTS` in GitHub → Settings → Environments → production → Environment secrets. De regel ziet er zo uit:

```text
# poort 22
server.example.org ssh-ed25519 AAAA...
# bijvoorbeeld poort 2222
[server.example.org]:2222 ssh-ed25519 AAAA...
```

Deze voorbeelden zijn placeholders; gebruik de echte uitvoer van `ssh-keyscan`. Bewaar echte regeleinden als je meerdere
sleutels opslaat, geen letterlijke `\n`. Een gehashte hostnaam uit `ssh-keyscan -H` werkt ook, mits host en poort kloppen.
Start na het bijwerken van het secret de mislukte deployment opnieuw. Bij een bewust vervangen server of hostsleutel
moet je de nieuwe fingerprint opnieuw controleren voordat je het secret bijwerkt.

De workflow controleert vooraf of er een regel voor host en poort bestaat; SSH controleert vervolgens of de sleutel
overeenkomt met de server. Laat `StrictHostKeyChecking=yes` aan en voeg geen automatische `ssh-keyscan` toe aan CI:
een scan alleen bewijst niet dat de sleutel van de juiste server komt. Zie de officiële
[ssh-keyscan-documentatie](https://man.openbsd.org/ssh-keyscan) en
[ssh-keygen-documentatie](https://man.openbsd.org/ssh-keygen).

De server haalt uitsluitend commits op die deel zijn van `origin/main`, bouwt in een nieuwe releasemap en wisselt de symlink atomair. Een healthcheck controleert ook de CMS-koppeling. De workflow installeert geen server en wijzigt geen DNS; volg eerst de installatiehandleiding. CI gebruikt voorbeeldinhoud om zonder productiedatabase te bouwen. De productie gebruikt de CMS-inhoud.

Voer een dependency-audit uit vóór iedere publieke release. Beoordeel advisories in de volledige Strapi-afhankelijkheidsketen; voer geen geforceerde major-downgrades uit om een audituitkomst te verbergen.
