# Azure App Service

De deployment volgt Jield Website: een aparte client en server op hetzelfde Linux App Service-plan,
Linux-builds in GitHub Actions, ZIP-deployment met OIDC en persistente Azure Files-uploads.

| Onderdeel | Azure-resource |
| --- | --- |
| Resourcegroep | `jield-production` |
| Bestaand plan | `jield-plan` (West Europe, P0v4) |
| Website (`apps/web`, Next.js) | `glazenhuis-weredi-web` |
| CMS (`apps/cms`, Strapi) | `glazenhuis-weredi-cms` |
| Uploads | `jieldcms1304920634` / share `glazenhuis-uploads` |
| CMS-mount | `/mounts/glazenhuis-uploads` |
| Deployidentity | `glazenhuis-github-deploy` |

Website: https://glazenhuis-weredi-web.azurewebsites.net
CMS: https://glazenhuis-weredi-cms.azurewebsites.net/admin

## Structuur en builds

Beide apps blijven npm-workspaces; installeer vanuit de root met `npm ci`. Er zijn geen afzonderlijke lockfiles.
De website gebruikt Next.js standalone output met de repository als tracingroot. Het CMS-pakket behoudt de
rootdependencies en eventuele eigen `apps/cms/node_modules`, zodat Strapi en React 18 correct worden gevonden.

```bash
npm ci --include=dev
npm test
npm run typecheck
CMS_PUBLIC_URL=https://glazenhuis-weredi-cms.azurewebsites.net \
SITE_URL=https://glazenhuis-weredi-web.azurewebsites.net CONTENT_MODE=cms npm run build
bash deploy/azure/package.sh /tmp/glazenhuis-packages
```

Maak deploymentpakketten op **Linux x64 met Node 26**, vanwege native dependencies. De startupcommand is voor beide
apps `bash /home/site/wwwroot/start.sh`. Beide luisteren op `0.0.0.0` en de door Azure geleverde `PORT` (standaard 8080).
De pakketten bevatten geen `.env`-bestanden of CMS-uploads. De website bevat wel zijn publieke assets en `.next/static`.

## App settings

Beide apps gebruiken `NODE_ENV=production`, `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `ENABLE_ORYX_BUILD=false` en
`WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`. Laat `WEBSITE_RUN_FROM_PACKAGE` weg: Strapi maakt bij opstarten een symlink
in de uitgepakte deploymentdirectory. HTTPS, Always On en TLS 1.2 zijn ingeschakeld.

Website:

| Setting | Waarde |
| --- | --- |
| `CONTENT_MODE` | `cms` |
| `CMS_URL`, `CMS_PUBLIC_URL` | `https://glazenhuis-weredi-cms.azurewebsites.net` |
| `CMS_ADMIN_URL` | `https://glazenhuis-weredi-cms.azurewebsites.net/admin` |
| `SITE_URL` | `https://glazenhuis-weredi-web.azurewebsites.net` |

`CMS_PUBLIC_URL` wordt op de server gebruikt voor afbeeldings-URL's. Hiervoor zijn geen publieke buildsecrets nodig.
De browser leest de website; de website leest gepubliceerde inhoud via HTTPS uit Strapi.

CMS: `HOST=0.0.0.0`, `TRUST_PROXY=true`, `CMS_PUBLIC_URL` zoals boven, `STRAPI_TELEMETRY_DISABLED=true`,
`CMS_UPLOADS_PATH=/mounts/glazenhuis-uploads`, `SEED_CONTENT=false`, plus de databasevelden en blijvende
`APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT` en `ENCRYPTION_KEY`.
Bewaar de sleutels in Azure App settings en behoud ze bij nieuwe releases.
Mailjet vereist `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `SMTP_FROM` en `SMTP_REPLY_TO` in de CMS-app.

De productiemiddleware behoudt de oude nginx-regel die publieke eerste-beheerderregistratie blokkeert.
Bestaande beheerders kunnen inloggen en uitnodigingen blijven werken. Maak een eventuele eerste beheerder via de
Strapi CLI (`npm run strapi -- admin:create-user --help` vanuit `apps/cms`) in een afgeschermde Azure-console.
Het CMS stuurt in productie ook `X-Robots-Tag: noindex, nofollow`.

## Database

De bestaande database `glazenhuis` op `jield-poduction.mysql.database.azure.com` wordt gebruikt.
De CMS-app heeft VNet-integratie met `jield-production-vnet`, subnet `cms-appservice`;
de MySQL-server blijft privé. De gebruiker `glazenhuis_app` krijgt alleen rechten op `glazenhuis.*`.
Stel `DATABASE_PORT=3306`, `DATABASE_SSL=true` en `DATABASE_SSL_CA_FILE=certs/azure-mysql-ca.pem` in.
De meegeleverde CA-bundel controleert certificaatketen én hostnaam; gebruik de volledige Azure DNS-naam.
Zie ook [de certificaatdocumentatie](../apps/cms/certs/README.md).

Bewaar databasecredentials uitsluitend in de CMS-app. Maak vóór releases een databaseherstelpunt.
Een rollback van code draait schemawijzigingen niet terug. CI gebruikt uitsluitend een wegwerp-MariaDB-database.

## Uploads en migratie

Het startupscript controleert dat de Azure Files-share echt gemount en schrijfbaar is en koppelt
`apps/cms/public/uploads` hieraan. Zonder mount stopt het CMS. Een bestaande, niet-lege uploaddirectory wordt
behouden en blokkeert opstarten totdat de bestanden zijn gemigreerd.

Kopieer vóór omschakeling alle bestaande uploads, inclusief thumbnails en varianten, naar de **root** van de share.
Behoud bestandsnamen en controleer de media-URL's uit de bestaande database. Gebruik Azure Storage Explorer of
`az storage file upload-batch`. Kopieer niet de enclosing map `uploads`. Houd de oorspronkelijke bestanden aan tot
uploaden, ophalen en opnieuw deployen zijn getest. Deel deze share niet met Jield of testomgevingen.
Configureer een afzonderlijke Azure Files-backup; mounts vallen buiten App Service-backups.
Zie [Microsofts storage-mountdocumentatie](https://learn.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage).

## Publiceren en herstellen

De [workflow](../.github/workflows/deploy.yml) test beide apps, bouwt op Linux en controleert de CMS-integratie.
Daarna deployt hij op `main` eerst het CMS (`/_health`) en vervolgens de website (`/api/health`, inclusief CMS-read).
Handmatig deployen van dezelfde Linux-pakketten:

```bash
az webapp deploy -g jield-production -n glazenhuis-weredi-cms --src-path /tmp/glazenhuis-packages/cms.zip --type zip
az webapp deploy -g jield-production -n glazenhuis-weredi-web --src-path /tmp/glazenhuis-packages/web.zip --type zip
```

Controleer de homepage, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/api/health`, CMS-login en een gepubliceerde foto.
Voor rollback: deploy de ZIPs van een eerdere geslaagde run en herstel indien nodig de database en uploads uit
hetzelfde herstelpunt. Workflowartifacts blijven zeven dagen bewaard.

Voor het publieke domein: voeg `glazenhuis.weredi.nl` toe als custom domain aan de website-app, voer Azure's
DNS-verificatie uit, wijs DNS naar de Azure-host en activeer een managed TLS-certificaat. Pas daarna `SITE_URL` en
de repositoryvariable `AZURE_SITE_URL` aan naar `https://glazenhuis.weredi.nl` en bouw opnieuw, ook voor robots/SEO.

De oude SSH-handleidingen zijn uitsluitend archief: [server](legacy-ssh-deployment.md),
[Actions](legacy-ssh-github-actions.md). De actieve workflow gebruikt Azure en bevat geen SSH-deployment.
