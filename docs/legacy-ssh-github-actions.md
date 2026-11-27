# GitHub Actions

`.github/workflows/deploy.yml` volgt de SSH-aanpak van `tempo-clubrecords`: tests en builds op pull requests, alleen
deployment van een geteste commit op `main`, één deployment tegelijk, SSH met vastgelegde host key en een
productie-environment.

Maak het GitHub-environment `production` en voeg deze secrets toe:

| Secret             | Waarde                                                                                                                  |
|--------------------|-------------------------------------------------------------------------------------------------------------------------|
| DEPLOY_HOST        | Servernaam of IP                                                                                                        |
| DEPLOY_USER        | glazenhuis                                                                                                              |
| DEPLOY_PORT        | Meestal 22                                                                                                              |
| DEPLOY_SSH_KEY     | Private sleutel van de aparte deployaccount                                                                             |
| DEPLOY_KNOWN_HOSTS | Volledige, buiten de workflow geverifieerde `known_hosts`-regel(s) van de server, inclusief hostnaam en eventueel poort |

Installeer de bijbehorende public key in de deployaccount. Beperk deze sleutel tot het benodigde gebruik en schakel
forwarding en PTY uit. De serverrepository gebruikt een aparte read-only GitHub deploysleutel. Neem databasewachtwoorden
en Mailjet-sleutels nooit op in GitHub-code of buildartefacten.

## Stap voor stap instellen

Volg eerst de [serverinstallatie](deployment.md) voor de account `glazenhuis`, de mappen en het deployscript.
De repositorysleutel hieronder is nodig vóór het klonen bij de eerste release. Je hebt beheertoegang tot de
GitHub-repository en een vertrouwde serverconsole of bestaande beheerverbinding nodig. Voer lokale opdrachten uit in
een terminal met OpenSSH, bijvoorbeeld op macOS of Linux. Vervang alle `YOUR_...`-waarden door je eigen gegevens.

Er zijn twee verschillende sleutelparen nodig:

| Verbinding                 | Private sleutel                           | Public key                                    |
|----------------------------|-------------------------------------------|-----------------------------------------------|
| GitHub Actions → server    | GitHub-environmentsecret `DEPLOY_SSH_KEY` | Server: `~glazenhuis/.ssh/authorized_keys`    |
| Server → GitHub-repository | Alleen op de server bij `glazenhuis`      | GitHub: repository **Settings → Deploy keys** |

`DEPLOY_KNOWN_HOSTS` bevat de publieke **hostsleutel van de server**. Deze identificeert de server en is geen van
bovenstaande gebruikerssleutels. De server heeft daarnaast een eigen `known_hosts` voor verbindingen naar GitHub.

### 1. Bepaal host, gebruiker en poort

Vraag de serverbeheerder om de SSH-hostnaam of het IP-adres en de SSH-poort. Gebruik voor `DEPLOY_HOST` uitsluitend de
hostnaam of het IP-adres, zonder `ssh://`, gebruikersnaam, pad of poort. `DEPLOY_USER` is bij de beschreven installatie
`glazenhuis`; `DEPLOY_PORT` is doorgaans `22`.

Stel op je eigen computer deze variabelen in; gebruik dezelfde waarden bij alle lokale stappen hieronder:

```sh
deploy_host=YOUR_DEPLOY_HOST
deploy_port=22 # pas aan als SSH een andere poort gebruikt
```

### 2. Maak de sleutel voor Actions → server

1. Maak op je eigen computer een apart Ed25519-sleutelpaar:

   ```sh
   install -d -m 700 ~/.ssh
   ssh-keygen -t ed25519 -C 'glazenhuis-actions-production' -f ~/.ssh/glazenhuis_actions -N ''
   chmod 600 ~/.ssh/glazenhuis_actions
   cat ~/.ssh/glazenhuis_actions.pub
   ```

   Gebruik een nieuwe bestandsnaam als deze sleutel al bestaat; overschrijf geen bestaande sleutel. De lege passphrase
   is nodig omdat de workflow de sleutel zonder interactieve invoer of SSH-agent gebruikt.

2. Kopieer de volledige regel uit het `.pub`-bestand. Open via je bestaande beheertoegang een sessie op de server en
   voer als root of met sudo uit:

   ```sh
   sudo install -d -o glazenhuis -g glazenhuis -m 700 /home/glazenhuis/.ssh
   sudo -u glazenhuis touch /home/glazenhuis/.ssh/authorized_keys
   sudo chown glazenhuis:glazenhuis /home/glazenhuis/.ssh/authorized_keys
   sudo chmod 600 /home/glazenhuis/.ssh/authorized_keys
   sudoedit /home/glazenhuis/.ssh/authorized_keys
   ```

   Voeg één regel toe, met `restrict` vóór de echte public key:

   ```text
   restrict ssh-ed25519 YOUR_PUBLIC_KEY_BASE64 glazenhuis-actions-production
   ```

   `restrict` schakelt onder andere agent-, poort- en X11-forwarding en PTY uit; het uitvoeren van het deploycommando
   blijft mogelijk. Behoud bestaande regels. Als de account een andere thuismap heeft, pas `/home/glazenhuis` aan.

3. Het lokale bestand `~/.ssh/glazenhuis_actions` zonder `.pub` is de waarde voor `DEPLOY_SSH_KEY` in stap 5. Kopieer
   straks de volledige inhoud, inclusief `-----BEGIN OPENSSH PRIVATE KEY-----`, de eindregel en echte regeleinden.
   Zet deze private sleutel niet op de server of in de repository.

### 3. Verzamel en verifieer DEPLOY_KNOWN_HOSTS

1. Verzamel op je eigen computer de publieke hostsleutel op de juiste poort:

   ```sh
   ssh-keyscan -p "$deploy_port" -t ed25519 "$deploy_host" > deploy_known_hosts
   ssh-keygen -lf deploy_known_hosts -E sha256
   ```

   Ga alleen verder als er een sleutel en een SHA256-fingerprint worden getoond. Een scan alleen bewijst niet dat
   de sleutel van de juiste server komt.

2. Bekijk via een vertrouwde serverconsole, bijvoorbeeld de console van je hostingprovider, de echte fingerprint:

   ```sh
   sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
   ```

   Je kunt deze fingerprint ook via een onafhankelijk vertrouwd kanaal aan de serverbeheerder vragen. Vergelijk de
   volledige `SHA256:...`-waarde met de lokale uitvoer. Stop bij een verschil en laat de beheerder de oorzaak bepalen.
   Als de server geen Ed25519-hostsleutel aanbiedt, laat de beheerder het aangeboden sleuteltype bevestigen en pas
   zowel `ssh-keyscan -t` als het pad naar de publieke hostsleutel daarop aan.

3. Controleer op je eigen computer dat de regel bij de exacte host en poort past:

   ```sh
   known_host="$deploy_host"
   if [ "$deploy_port" != 22 ]; then
     known_host="[$deploy_host]:$deploy_port"
   fi
   ssh-keygen -F "$known_host" -f deploy_known_hosts
   cat deploy_known_hosts
   ```

   De volledige inhoud (zonder #) van `deploy_known_hosts` wordt straks `DEPLOY_KNOWN_HOSTS`. De vorm is:

   ```text
   jield.dev ssh-ed25519 AAAA...
   ```

   Gebruik de echte scanuitvoer, niet deze placeholders. Alleen een fingerprint of een public key zonder hostnaam
   is onvoldoende. Bewaar echte regeleinden, geen letterlijke `\n`. Een gehashte hostnaam uit `ssh-keyscan -H` werkt
   ook, mits host en poort overeenkomen met de secrets.

4. Test de Actions-sleutel lokaal zonder een deployment te starten:

   ```sh
   ssh -i ~/.ssh/glazenhuis_actions -p "$deploy_port" \
     -o BatchMode=yes -o IdentitiesOnly=yes \
     -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$PWD/deploy_known_hosts" \
     "glazenhuis@$deploy_host" 'true'
   ```

   De opdracht moet slagen zonder wachtwoordvraag. De workflow gebruikt dezelfde sleutel en hostcontrole.

### 4. Maak de aparte alleen-lezen sleutel voor server → GitHub

1. Open op de server via je beheertoegang een shell als `glazenhuis`:

   ```sh
   sudo -iu glazenhuis
   ```

   Voer de volgende opdrachten in die shell uit:

   ```sh
   install -d -m 700 ~/.ssh
   ssh-keygen -t ed25519 -C 'glazenhuis-repository-production' -f ~/.ssh/glazenhuis_repository -N ''
   chmod 600 ~/.ssh/glazenhuis_repository
   cat ~/.ssh/glazenhuis_repository.pub
   ```

   Ook hier: overschrijf geen bestaande sleutel. De private sleutel blijft op de server en komt niet in een
   Actions-secret.

2. Ga in GitHub naar de repository → **Settings → Deploy keys → Add deploy key**. Geef de sleutel een herkenbare
   titel, plak de volledige `.pub`-regel en laat **Allow write access** uitgeschakeld. Klik op **Add key**. Deze
   sleutel geeft uitsluitend leestoegang tot deze repository.
   Zie [GitHub: deploy keys beheren](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys).

3. Leg als `glazenhuis` de GitHub-hostsleutel vast:

   ```sh
   ssh-keyscan -t ed25519 github.com > ~/.ssh/github_known_hosts_candidate
   ssh-keygen -lf ~/.ssh/github_known_hosts_candidate -E sha256
   ```

   Vergelijk de fingerprint met de Ed25519-fingerprint op
   [GitHubs officiële fingerprintpagina](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).
   Voeg de regel alleen bij een exacte overeenkomst toe:

   ```sh
   cat ~/.ssh/github_known_hosts_candidate >> ~/.ssh/known_hosts
   chmod 600 ~/.ssh/known_hosts
   rm ~/.ssh/github_known_hosts_candidate
   ```

   Deze `github.com`-regel hoort bij de server en is niet de waarde voor `DEPLOY_KNOWN_HOSTS`.

4. Voeg als `glazenhuis` het volgende blok toe aan `~/.ssh/config`. Bestaat al een blok voor `github.com`, werk dat
   dan bij zodat deze repositorysleutel wordt gebruikt:

   ```sshconfig
   Host github.com
     HostName github.com
     User git
     IdentityFile ~/.ssh/glazenhuis_repository
     IdentitiesOnly yes
     BatchMode yes
     StrictHostKeyChecking yes
   ```

   ```sh
   chmod 600 ~/.ssh/config
   git ls-remote git@github.com:YOUR_OWNER/YOUR_REPOSITORY.git HEAD
   ```

   Een commit-ID met `HEAD` bevestigt de leestoegang. Gebruik deze SSH-URL vervolgens bij het klonen in de
   [installatiehandleiding](deployment.md#3-eerste-release). Is de repository al gekloond, controleer dan met
   `git -C /var/lib/glazenhuis/repository remote -v` of `origin` dezelfde SSH-URL gebruikt. Zo nodig:

   ```sh
   git -C /var/lib/glazenhuis/repository remote set-url origin git@github.com:YOUR_OWNER/YOUR_REPOSITORY.git
   ```

### 5. Vul het GitHub-environment in

1. Ga naar de repository → **Settings → Environments → New environment**, geef het environment de naam `production`
   en klik op **Configure environment**. Open het bestaande environment als dit al bestaat. Zie
   [GitHub: deployment-environments beheren](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
2. Kies onder **Environment secrets** voor **Add environment secret** en voeg elk secret uit de tabel bovenaan toe:
   `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_SSH_KEY` en `DEPLOY_KNOWN_HOSTS`. Gebruik voor de laatste twee
   respectievelijk de volledige lokale private sleutel uit stap 2 en de geverifieerde scanuitvoer uit stap 3.
3. Controleer dat host en poort exact overeenkomen met de waarden waarmee je de lokale SSH-test hebt uitgevoerd.
   `DEPLOY_PORT` mag ontbreken voor poort 22; expliciet `22` invullen maakt de configuratie duidelijker.

### 6. Controleer de eerste workflowrun

Rond eerst de serverinstallatie af, inclusief environmentbestanden, deployscript en systemd-units. Start daarna via
**Actions → Test and deploy → Run workflow** een run op `main`, of push een commit naar `main`. Dit start een echte
deployment nadat beide verificatiejobs zijn geslaagd. Pull requests voeren alleen de verificatiejobs uit.

Bij problemen:

- `DEPLOY_KNOWN_HOSTS has no entry ...`: gebruik exact `DEPLOY_HOST` en bij een afwijkende poort de vorm `[host]:poort`.
- `No ED25519 host key is known ...` of `Host key verification failed`: controleer de volledige hostsleutelregel en
  verifieer de fingerprint opnieuw. Na vervanging van een server of hostsleutel moet je die opnieuw vertrouwen voordat
  je het secret bijwerkt. Laat `StrictHostKeyChecking=yes` aan; voeg geen automatische scan toe aan de workflow.
- `Permission denied (publickey)`: controleer `DEPLOY_USER`, de private sleutel in het secret, de bijbehorende public
  key in `authorized_keys` en de eigenaar en rechten van de `.ssh`-map en bestanden. Volg de diagnose hieronder.
- Fouten tijdens `git fetch`: controleer op de server als `glazenhuis` de aparte repositorysleutel, GitHubs hostsleutel
  en `git ls-remote` uit stap 4.

Zie voor de hostcontrole ook de officiële [ssh-keyscan-documentatie](https://man.openbsd.org/ssh-keyscan) en
[ssh-keygen-documentatie](https://man.openbsd.org/ssh-keygen).

### Diagnose: Permission denied (publickey)

Als de workflow alleen `Permission denied (publickey)` meldt, is de SSH-server bereikt en is de hostcontrole geslaagd,
maar lukt aanmelden als `DEPLOY_USER` niet. Het deployscript is dan nog niet gestart. De aparte sleutel voor
server → GitHub wordt pas later gebruikt. De clientmelding alleen vertelt niet waarom de server de login weigert.

1. Vergelijk de sleutelvingerafdrukken. Leid op je eigen computer de public key af van de private Actions-sleutel:

   ```sh
   ssh-keygen -y -f ~/.ssh/glazenhuis_actions | ssh-keygen -lf - -E sha256
   ```

   Bekijk via je bestaande beheerverbinding op de server de toegestane sleutels:

   ```sh
   sudo ssh-keygen -lf /home/glazenhuis/.ssh/authorized_keys -E sha256
   ```

   De lokale `SHA256:...` moet tussen de servervingerafdrukken staan. Ontbreekt deze, voeg dan de bijbehorende
   volledige `.pub`-regel toe zoals in stap 2. Controleer dat `DEPLOY_USER` inderdaad `glazenhuis` is. Werk in
   **Settings → Environments → production → Environment secrets** het secret `DEPLOY_SSH_KEY` bij met de volledige
   private sleutel van ditzelfde paar als je twijfelt welke sleutel daar is opgeslagen.

2. Herhaal lokaal de login met uitsluitend deze sleutel, zonder je SSH-configuratie of agent te gebruiken:

   ```sh
   ssh -F /dev/null -vvv -i ~/.ssh/glazenhuis_actions -p "$deploy_port" \
     -o IdentityAgent=none -o BatchMode=yes -o IdentitiesOnly=yes \
     -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$PWD/deploy_known_hosts" \
     "glazenhuis@$deploy_host" 'true'
   ```

   Gebruik de host, poort en het geverifieerde `deploy_known_hosts` uit stap 3. Dit start geen deployment.
   `Offering public key` toont welke sleutel wordt aangeboden; `Authenticated to` bevestigt een geslaagde login.
   Slaagt deze test terwijl Actions faalt, vergelijk dan de secrets met deze lokale waarden. Controleer ook of
   `from=` in `authorized_keys` of een SSH-`Match`-regel toegang vanaf het IP-adres van de Actions-runner beperkt.

3. Lees op Debian via je beheerverbinding de serverlogs terwijl je de test herhaalt:

   ```sh
   sudo journalctl -u ssh.service --since '10 minutes ago' --no-pager
   getent passwd glazenhuis
   sudo namei -l /home/glazenhuis/.ssh/authorized_keys
   ```

   De logs kunnen bijvoorbeeld een onbekende gebruiker, onjuiste bestandsrechten, een geblokkeerde account of een
   weigering door `AllowUsers`/`AllowGroups` aanwijzen. Gebruik de thuismap uit `getent` als die afwijkt van
   `/home/glazenhuis`. De thuismap mag niet schrijfbaar zijn voor groep of anderen; `.ssh` hoort van `glazenhuis`
   te zijn met modus `700`, en `authorized_keys` met modus `600`. Herstel deze rechten indien nodig:

   ```sh
   sudo chmod go-w /home/glazenhuis
   sudo chown glazenhuis:glazenhuis /home/glazenhuis/.ssh /home/glazenhuis/.ssh/authorized_keys
   sudo chmod 700 /home/glazenhuis/.ssh
   sudo chmod 600 /home/glazenhuis/.ssh/authorized_keys
   ```

   Als sleutels en rechten kloppen, laat de beheerder de effectieve SSH-configuratie voor deze gebruiker en het
   client-IP controleren met `sshd -T -C user=glazenhuis,addr=YOUR_CLIENT_IP,host=YOUR_CLIENT_HOSTNAME`.
   Controleer daarin `PubkeyAuthentication`, `AuthorizedKeysFile`, `AuthenticationMethods`, toegangsregels en
   eventuele `Match`-blokken. Gebruik bij een Actions-fout het runner-IP uit de serverlogs. Pas de configuratie
   alleen aan op basis van de concrete weigering; zet hostcontrole en sleutelrestricties niet uit.

Zie ook de officiële documentatie
voor [authorized_keys en bestandsrechten](https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT)
en [sshd_config](https://man.openbsd.org/sshd_config).
