# Beheerhandleiding

## Inloggen en beheerders

Open `https://glazenhuis.weredi.nl/cms/admin`. Kies Nederlands als interfacetaal in je profiel. In **Instellingen → Beheerpaneel → Gebruikers** kan een beheerder anderen uitnodigen en een rol toekennen. Deel de tijdelijke uitnodigingslink rechtstreeks met de bedoelde persoon. Strapi levert die link in het beheerpaneel; ga niet uit van automatische uitnodigingsmails. Wachtwoordherstel en testmails lopen via Mailjet. Redacteuren krijgen alleen de benodigde content- en mediatoegang. Er zijn geen openbare bezoekersaccounts.

## Begininstellingen

1. Open **Evenementinstellingen** en vul teksten, contactadres en eventuele datum in. Laat de datum leeg zolang deze onbekend is.
2. Stel `targetAmount` in zodra het streefbedrag bekend is. Nul toont een melding in plaats van een verzonnen doel.
3. Het veld **ALS-inzamelpagina** (`actionUrl`) bevat standaard `https://inzamelen.alsacties.nl/fundraisers/scholengemeenschap-were-di?locale=nl` en bepaalt de donatieknoppen en de link in de footer. Alleen een volledig HTTPS-adres wordt als donatielink gebruikt. De website ontvangt zelf geen betalingen.
4. De `labels`-velden wijzigen navigatie, knoppen, lege toestanden en sectieteksten. Behoud de bestaande sleutels. De technische foutmeldingen blijven onderdeel van de applicatie.
5. Sla op en publiceer. Wijzigingen verschijnen binnen circa 30 seconden.

## Pagina’s en nieuws

De pagina’s `home`, `nieuws`, `acties`, `fotos`, `over-het-glazen-huis` en `privacy` zijn vooraf ingevuld. Behoud deze slugs: ze horen bij de navigatie. Extra pagina’s verschijnen op hun slug, bijvoorbeeld `/programma`; je kunt er vanuit een tekst naar linken. Pagina’s en nieuws ondersteunen Markdown, met koppen, lijsten en links. Ruwe HTML wordt niet uitgevoerd.

Maak nieuws met titel, unieke slug, datum, introductie, tekst en eventueel een afbeelding. Vul SEO-titel en beschrijving in als je andere zoekresultaatteksten wilt. Bewaar als concept of publiceer. Concepten zijn nooit via de website of openbare gegevensroute beschikbaar.

## Acties en thermometer

Een actie bevat titel, slug, afbeelding, introductie, omschrijving en `amount` in euro’s. De thermometer telt de bedragen van **gepubliceerde** acties en `additionalAmount` op. Gebruik dat laatste uitsluitend voor opbrengsten die niet al in een actie staan. Het bedrag kan boven het doel uitkomen; de balk stopt bij 100%. Er is geen automatische koppeling met de ALS-inzamelpagina. Trek je een actie in, dan verdwijnt die ook uit het totaal.

## Foto’s uploaden en bekijken

Maak onder **Fotoalbums** een album met titel en slug. Upload foto’s via het veld `photos` of kies ze uit de mediabibliotheek. JPEG, PNG en WebP zijn toegestaan tot 10 MB per bestand. Vul bij iedere foto de alternatieve tekst in. Publiceer het album. Bezoekers openen de foto’s in een viewer met toetsenbordnavigatie, vorige/volgende en Escape om te sluiten.

Publiceer alleen foto’s waarvoor toestemming is geregeld. Zet geen persoonsgegevens in bestandsnamen. Verwijder bij een verwijderverzoek ook het bestand uit de mediabibliotheek als het nergens anders nodig is. Alleen het intrekken van een album verwijdert de openbare bestands-URL niet. Laat foto’s vooraf verkleinen en verwijder locatiegegevens voordat je uploadt.

## Voor de lancering

Controleer de contactgegevens, privacytekst, toestemming voor beeldgebruik, donatielink, datum en rollen. Verstuur een testmail in de e-mailinstellingen. Controleer ook de mobiele website en een gepubliceerd nieuwsbericht, actie en fotoalbum.

## Bestaande beginteksten bijwerken

Bij de eerste CMS-start na deze update worden verouderde campagneverwijzingen in bestaande teksten vervangen door ALS en wordt een ontbrekende donatielink ingevuld. Concepten en gepubliceerde versies worden afzonderlijk bijgewerkt; andere redactionele wijzigingen blijven behouden. De opbrengst op de externe inzamelpagina is exclusief de overige acties en wordt niet automatisch ingelezen.
