# GitHub Actions naar Azure

De [workflow](../.github/workflows/deploy.yml) vervangt SSH-deployment en volgt de Azure-strategie van Jield Website.
Pull requests voeren unitcontroles, typechecks, productiebuilds en een integratietest met tijdelijke MariaDB uit.
Linux Node.js 26-pakketten worden gebouwd in de verificatiejob; productiecredentials zijn niet beschikbaar bij builds.
Alleen geslaagde runs op `main` mogen naar het environment `azure-production` deployen.

Repositoryvariables:

| Variable | Waarde |
| --- | --- |
| `AZURE_DEPLOY_ENABLED` | `true` |
| `AZURE_CMS_PUBLIC_URL` | `https://glazenhuis-weredi-cms.azurewebsites.net` |
| `AZURE_SITE_URL` | `https://glazenhuis-weredi-web.azurewebsites.net` |

Environmentvariables in `azure-production`:

| Variable | Waarde |
| --- | --- |
| `AZURE_WEBAPP_NAME` | `glazenhuis-weredi-web` |
| `AZURE_CMS_APP_NAME` | `glazenhuis-weredi-cms` |

Environmentsecrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
Deze verwijzen naar de user-assigned identity `glazenhuis-github-deploy`. Die heeft `Website Contributor`
op uitsluitend deze twee apps. Er is geen client secret of publish profile nodig.

De federated credential gebruikt issuer `https://token.actions.githubusercontent.com`, audience
`api://AzureADTokenExchange` en dit geverifieerde GitHub OIDC-subject:

```text
repo:jield-webdev@1589689/glazenhuis.weredi.nl@1466410492:environment:azure-production
```

Het environment staat alleen branch `main` toe. GitHub vraagt een tijdelijke Azure-token aan met `id-token: write`.
De deployjob downloadt de geteste artifacts, deployt het CMS, controleert `/_health`, deployt de website en controleert
`/api/health`. Healthcheckfouten laten de run falen. Er is geen automatische database-rollback.
Gebruik voor herstel de [deploymenthandleiding](deployment.md).

Start een run via **Actions → Test and deploy to Azure → Run workflow → main**, of push de wijzigingen naar `main`.
De vroegere `DEPLOY_*` SSH-secrets worden niet meer gebruikt. Het eerdere document is bewaard als
[archief](legacy-ssh-github-actions.md).
