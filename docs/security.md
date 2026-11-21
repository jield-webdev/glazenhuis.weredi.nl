# Afhankelijkheden en releasecontrole

Strapi is bijgewerkt naar 5.63.0. Compatibele patches voor Zod 4 en de Hono Node-adapter zijn vastgelegd via overrides. De huidige upstream-afhankelijkheidsketen bevat nog npm-advisories: onder meer Zod 3, React Router 6, glob en minimatch. De router wordt door het Strapi-beheerpaneel gebruikt; de publieke website gebruikt Next.js. Er is geen openbare schrijf- of registratie-API, maar dit heft upstream-kwetsbaarheden niet op.

`npm audit --omit=dev` rapporteerde op 21 november 2026 nog 22 meldingen inclusief transitieve afhankelijkheden (12 hoog, 10 matig). Controleer opnieuw vóór ingebruikname. De beschikbare automatische voorstellen omvatten incompatibele majorwijzigingen of een downgrade naar Strapi 4; die zijn bewust niet toegepast. Beoordeel blootstelling, installeer een ondersteunde upstreamfix en herhaal de integratietest voordat de site publiek wordt geopend.

De integratietest maakt tijdelijke records en een upload aan en verwijdert die weer. Gebruik uitsluitend een geïsoleerde testdatabase en zet expliciet `INTEGRATION_TEST=true`. Mailjet-aflevering en uitnodigingslinks vereisen een afzonderlijke acceptatietest met de echte afzenderconfiguratie. De code bevat geen productiesleutels.
