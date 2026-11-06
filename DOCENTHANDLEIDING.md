# Bureau Geheimschrift - korte docenthandleiding

Spelpagina: gebruik het adres van je eigen installatie.

## Voor de les

1. Open **Voor docenten** en kies **Start een klasdossier**. Je hebt geen account of wachtwoord nodig. Geef het dossier een herkenbare klasnaam. Zeven minuten per ronde is een goed vertrekpunt. Bewaar de **geheime docentlink** voor gebruik op een ander apparaat. Deel die link niet met leerlingen.
2. Deel de deelname-link of toon de sessiecode. Leerlingen melden zich aan met een unieke detectivenaam, zonder account.
3. Na aanmelden verschijnt de persoonlijke terugkeercode groot in een modal, met de detectivenaam. Nieuwe codes hebben 8 tekens, gegroepeerd als ABCD-EFGH; bestaande codes blijven geldig. Met **Toon mijn code groot** kan de leerling de modal opnieuw openen. Laat leerlingen hun sessiecode en persoonlijke terugkeercode bewaren. Op hetzelfde apparaat blijft hun dossier automatisch beschikbaar; op een ander apparaat gebruiken ze de terugkeercode.
4. Controleer de wachtkamer. Verwijder alleen voor de start een onjuiste of dubbele aanmelding. Kies de **Methode voor ronde 1** en klik **Start eerste ronde** zodra iedereen klaarzit.

## Indeling en rollen

Bij 23 deelnemers maakt de app vijf drietallen en twee viertallen. Elk groepje heeft een Alice en een Bob. Viertallen hebben twee Eves die afzonderlijk hetzelfde bericht proberen te kraken. Niemand ziet het antwoord van een andere leerling.

De eerste rolverdeling is willekeurig. De app verdeelt vervolgens de rollen evenwichtig en zoekt nieuwe koppelingen met zo weinig mogelijk herhaling. Over zes rondes krijgt iedere leerling minstens eenmaal Alice, Bob en Eve. Door het leerlingenaantal heeft niet iedereen precies twee keer iedere rol.

## Zelf het dossier indelen

Kies vóór iedere ronde Caesar, Rozenkruisers, substitutie of Vigenère. Je bepaalt zelf de volgorde en het aantal rondes. Herhaal een methode zolang dat nuttig is, of wissel na de nabespreking.

Na iedere ronde kun je het dossier laten staan, een volgende ronde starten of **Rond het dossier af** kiezen. Open een eerder dossier vanuit je browser of met je geheime docentlink. Leerlingen gebruiken dezelfde sessiecode en terugkeercode zolang het dossier bestaat. Na zeven dagen zonder spelactie wordt het dossier automatisch gewist. Je kunt het ook eerder wissen via **Geheime docentlink en dossierbeheer**.

Voor 40 minuten kun je bijvoorbeeld circa 10 minuten uitleg, aanmelden en oefenen, drie rondes van 7 minuten en circa 9 minuten nabespreking plannen. Je kunt alles aan één methode besteden of methodes afwisselen.

## Wat leerlingen doen

- **Alice** bedenkt zelf een Nederlandse zin, bij voorkeur van 20-30 letters. De app accepteert 10-50 letters, A-Z en spaties. De app versleutelt haar zin automatisch met de geheime sleutel en toont een preview. Met **Versleutel en verstuur** stuurt ze het bericht naar Bob en Eve. Ze hoeft codeletters en symbolen niet over te typen. Ongeldige tekst wordt bij de knop gemeld.
- **Bob** krijgt het bericht en dezelfde sleutel als Alice. Hij typt het ontsleutelde bericht en kan verbeteren.
- **Eve** krijgt de methode en het versleutelde bericht, zonder sleutel of oorspronkelijke tekst. Bij Caesar, Rozenkruisers en substitutie kan ze met een hypothesetabel vermoedelijke letters overal in het bericht uitproberen. Bij Vigenère verschilt de verschuiving per positie; daar gebruikt ze het gevonden sleutelwoord. Ze kan onbekende letters als vraagtekens laten staan.

Rozenkruisersberichten verschijnen automatisch als symbolen, inclusief de gestipte varianten. De letterverdeling verschilt per groepje. Bob krijgt de geheime lettertabel; Eve krijgt deze koppelingen niet.

Bob en Eve ontvangen een correct bericht direct wanneer Alice verstuurt. Na drie actieve minuten zonder verstuurd bericht verstuurt de app automatisch een reservebericht. Alice kan daarna een reflectievraag beantwoorden. De docent kan ook eerder een reservebericht inzetten. Pauzeren bevriest zowel de rondetijd als de schrijftijd.

## Punten

Iedere rol heeft maximaal 2 punten per ronde. Het totaal hangt af van het aantal gespeelde rondes.

- Alice: 2 punten voor het versturen van haar eigen zin. De app versleutelt automatisch. Een automatisch of door de docent ingezet noodbericht levert Alice 0 punten op. Scores van eerder gespeelde rondes blijven gelijk.
- Bob: 2 punten voor een volledig correct ontsleuteld bericht.
- Eve: 1 punt voor minstens een juiste letterontdekking in een antwoord met de juiste totale letterlengte; 1 extra punt bij volledig kraken. Gebruik vraagtekens om onbekende posities aan te geven. Een eerdere juiste ontdekking blijft meetellen. Letters uit een sleutelhint tellen niet als eigen ontdekking.

Bij Caesar, Rozenkruisers en substitutie kan Eve maximaal drie sleutelhints vragen. Elke hint toont een letterkoppeling in het rechterpaneel en kost ½ punt. De score wordt nooit lager dan 0. Hints worden per Eve bijgehouden. Bij Caesar kun je uit één koppeling al de volledige verschuiving afleiden. Bob en Eve kunnen maximaal twintig antwoorden per ronde indienen. Spaties en hoofdletters beïnvloeden de controle niet. Scores verschijnen na afsluiting; de ranglijst bevat alleen afgeronde rondes. Bekijk bij vergelijking ook de rolverdeling: kraken is meestal moeilijker dan ontsleutelen met een sleutel.

## Vigenère met een securityraadsel

Alice en Bob krijgen een kort securitybegrip als sleutelwoord, zoals WORM, HASH, SPAM, VPN, PIN, VIRUS, BOT of HTTPS. De app herhaalt het sleutelwoord onder de letters: A = 0, B = 1, …, Z = 25. Spaties blijven staan en gebruiken geen sleutelletter. Bob schuift elke codeletter het aangegeven aantal plaatsen terug; de sleuteltabel helpt daarbij.

Eve kan een **gratis raadselhint** opvragen, ook terwijl Alice nog schrijft. Bijvoorbeeld: hoe heet malware die zich zelfstandig via een netwerk verspreidt? Ze vult WORM in bij **Controleer sleutelwoord**. Pas na een juist antwoord krijgt zij het sleutelwoord te zien. Ze moet vervolgens zelf het bericht ontsleutelen. De hint kost geen punten, het sleutelwoord zelf levert geen punten op, en beide Eves hebben een eigen voortgang. De instelling voor betaalde sleutelhints beïnvloedt deze gratis raadselhint niet.

## Docentbediening

- **Pauzeer / hervat:** voor uitleg of een klassikale onderbreking.
- **Sluit ronde af:** onthult berichten en sleutels; de klok sluit een ronde ook automatisch af.
- **Methode voor ronde / Start volgende ronde:** kies zelf de methode; de app maakt nieuwe koppelingen en sleutels.
- **Instellingen:** wijzig de tijd van volgende rondes (5-15 minuten) en schakel hints in of uit.
- **Nieuwe terugkeercode:** herstel de toegang van een leerling die de code is vergeten. De code verschijnt groot in een modal met de detectivenaam en sessiecode; deze kun je op het bord tonen.
- **Download resultaten:** bewaart de rollen, scores, pogingen en hints als CSV.

De hypothesen, conceptberichten en reflectienotities worden op het eigen apparaat bewaard. Verstuurde berichten, antwoorden, rollen en scores worden centraal opgeslagen. De docent ziet de ingediende antwoorden en voortgang; persoonlijke conceptnotities blijven bij de leerling.

## Oefenen en bespreken

De ingang bevat een **oefenkamer** waarin je zonder klas alle vier de methodes en rollen kunt proberen. Iedere methode heeft een andere oefenzin voor Bob en Eve, zodat de oplossing van Caesar niet de andere opdrachten verklapt. De antwoordcontrole en de hint gebruiken de oefenzin van de gekozen methode. Alice bedenkt zelf een bericht; ook in de oefenkamer versleutelt de app automatisch. De oefenkamer staat los van sessies en scores.

Er staan 48 verschillende reservezinnen klaar. Automatische reserveberichten en de reserveknop van de docent vermijden eerder verstuurde zinnen in het dossier zolang de voorraad dat toelaat. Foutmeldingen staan direct onder de controle- of antwoordknop en worden zo nodig in beeld geschoven.

Bespreek na afloop: wat is methode en wat is sleutel? Waarom heeft Bob een voordeel tegenover Eve? Hoe delen Alice en Bob hun sleutel veilig? Enigma vormt het decor; de vier gebruikte historische geheimschriften zijn eenvoudige leermodellen.

