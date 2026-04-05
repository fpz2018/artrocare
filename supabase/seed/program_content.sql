-- =============================================
-- Seed: Program Content — 12 weken + modules
-- ArtroCare begeleidingsprogramma
-- =============================================

-- Eerst bestaande data verwijderen (idempotent)
DELETE FROM public.program_progress;
DELETE FROM public.program_modules;
DELETE FROM public.program_weeks;

-- ─── PROGRAM WEEKS ──────────────────────────────────────────────────────────

INSERT INTO public.program_weeks (week_number, title_nl, title_en, description_nl, description_en, theme, unlock_day, sort_order) VALUES

(1,
 'Beginnen met bewegen',
 'Getting started with movement',
 'De basis leggen: wat kun je verwachten, hoe meet je je welzijn, en de eerste stappen naar meer bewegen.',
 'Laying the foundation: what to expect, how to measure your well-being, and your first steps toward more movement.',
 'basis', 0, 1),

(2,
 'Pijn begrijpen',
 'Understanding pain',
 'Leer hoe pijn werkt, waarom bewegen veilig is, en hoe je bewegingsangst kunt overwinnen.',
 'Learn how pain works, why movement is safe, and how to overcome fear of movement.',
 'pijneducatie', 7, 2),

(3,
 'Voeding als fundament',
 'Nutrition as a foundation',
 'Ontdek welke voeding je gewrichten ondersteunt en hoe je eenvoudige anti-inflammatoire keuzes maakt.',
 'Discover which foods support your joints and how to make simple anti-inflammatory choices.',
 'voeding_basis', 14, 3),

(4,
 'Slaap en herstel',
 'Sleep and recovery',
 'Verbeter je slaapkwaliteit met praktische routines en ontdek hoe herstel je gewrichten helpt.',
 'Improve your sleep quality with practical routines and discover how recovery supports your joints.',
 'slaap', 21, 4),

(5,
 'Kracht opbouwen',
 'Building strength',
 'Leer progressief belasten: hoe je veilig sterker wordt en welke spiergroepen het verschil maken.',
 'Learn progressive loading: how to safely build strength and which muscle groups make the difference.',
 'kracht', 28, 5),

(6,
 'Voeding verdieping',
 'Nutrition deep dive',
 'Ga dieper in op omega-3, vitamine D en andere voedingsstoffen die er echt toe doen voor je gewrichten.',
 'Go deeper into omega-3, vitamin D and other nutrients that truly matter for your joints.',
 'voeding_verdieping', 35, 6),

(7,
 'Stress en ontspanning',
 'Stress and relaxation',
 'Leer hoe stress je gewrichten beinvloedt en ontdek ademhalings- en ontspanningstechnieken.',
 'Learn how stress affects your joints and discover breathing and relaxation techniques.',
 'mindset', 42, 7),

(8,
 'Bewegen in het dagelijks leven',
 'Movement in daily life',
 'Maak bewegen een gewoonte: ergonomie, dagelijkse routines en slimme aanpassingen.',
 'Make movement a habit: ergonomics, daily routines and smart adaptations.',
 'gewoontes', 49, 8),

(9,
 'Terugblik en verdieping',
 'Review and deepening',
 'Herhaal de belangrijkste inzichten en verdiep je kennis op de gebieden waar je het meeste baat bij hebt.',
 'Review key insights and deepen your knowledge in the areas that benefit you most.',
 'verdieping', 56, 9),

(10,
 'Sociale steun en communicatie',
 'Social support and communication',
 'Leer hoe je je omgeving betrekt bij je programma en effectief communiceert over je behoeften.',
 'Learn how to involve your surroundings in your programme and communicate your needs effectively.',
 'sociaal', 63, 10),

(11,
 'Zelfmanagement op lange termijn',
 'Long-term self-management',
 'Bouw een persoonlijk plan dat werkt na het programma: wat houd je vol, wat pas je aan?',
 'Build a personal plan that works after the programme: what do you maintain, what do you adjust?',
 'zelfmanagement', 70, 11),

(12,
 'Afsluiting en vooruit kijken',
 'Wrapping up and looking ahead',
 'Vier je voortgang, stel nieuwe doelen en maak een plan voor de komende maanden.',
 'Celebrate your progress, set new goals and create a plan for the months ahead.',
 'afsluiting', 77, 12);


-- ─── PROGRAM MODULES ────────────────────────────────────────────────────────
-- Per week 1-8: educatie, beweging, leefstijl (+ soms extra)
-- Week 9-12: placeholder modules

-- ── WEEK 1: Beginnen met bewegen ────────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Wat kun je verwachten?',
  'What to expect?',
  'Welkom bij ArtroCare. Dit programma is ontworpen om je in 12 weken stap voor stap te helpen meer grip te krijgen op je gewrichtsklachten. Geen ingewikkelde medische taal, geen onrealistische beloftes — wel praktische tools die je direct kunt toepassen.

Hoe werkt het programma?
Elke week krijg je toegang tot nieuwe modules. Die bestaan uit drie onderdelen: educatie (begrijpen wat er speelt), beweging (oefeningen die passen bij jouw niveau) en leefstijl (voeding, slaap, stress). Je bepaalt zelf het tempo. Sommige weken doe je alles in een dag, andere spreid je over de hele week. Beide zijn prima.

Wat kun je verwachten?
De eerste weken zijn gericht op de basis. Je leert hoe je lichaam werkt, waarom bewegen juist helpt bij gewrichtsklachten, en hoe kleine veranderingen in je leefstijl een groot verschil kunnen maken. Vanaf week 5 gaan we verdiepen: meer kracht, specifiekere voeding, en mentale technieken.

Belangrijk: dit programma vervangt geen bezoek aan je fysiotherapeut of arts. Het is een aanvulling — een manier om zelf actief bij te dragen aan je welzijn.

Wat heb je nodig?
- Een smartphone of computer voor de modules
- Comfortabele kleding om in te bewegen
- Een notitieboekje of de app-notities voor je observaties
- Ongeveer 20-30 minuten per dag

Concrete actie: Neem nu 5 minuten om op te schrijven waarom je dit programma bent gestart. Wat wil je over 12 weken anders hebben? Bewaar dit — je gaat er in week 12 op terugkijken.',

  'Welcome to ArtroCare. This programme is designed to help you gain more control over your joint issues step by step over 12 weeks. No complicated medical language, no unrealistic promises — just practical tools you can apply immediately.

How does the programme work?
Each week you get access to new modules. These consist of three parts: education (understanding what is going on), movement (exercises suited to your level) and lifestyle (nutrition, sleep, stress). You set your own pace. Some weeks you do everything in a day, others you spread across the whole week. Both are fine.

What can you expect?
The first weeks focus on the basics. You will learn how your body works, why movement actually helps with joint issues, and how small lifestyle changes can make a big difference. From week 5 onwards we go deeper: more strength, more specific nutrition, and mental techniques.

Important: this programme does not replace visits to your physiotherapist or doctor. It is a supplement — a way to actively contribute to your own well-being.

What do you need?
- A smartphone or computer for the modules
- Comfortable clothing to move in
- A notebook or the app notes for your observations
- About 20-30 minutes per day

Action step: Take 5 minutes now to write down why you started this programme. What do you want to be different in 12 weeks? Keep this — you will look back at it in week 12.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 1;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Je welzijn meten',
  'Measuring your well-being',
  'Voordat je begint met bewegen, is het slim om een startpunt vast te leggen. Niet om jezelf te beoordelen, maar om over een paar weken te kunnen zien hoeveel er veranderd is.

Waarom meten?
Verandering gaat vaak zo geleidelijk dat je het niet merkt. Door regelmatig een paar simpele dingen bij te houden, maak je je voortgang zichtbaar. Dat motiveert enorm — vooral op dagen dat het even wat minder gaat.

Wat ga je bijhouden?
1. Stijfheid: Hoe stijf voel je je ''s ochtends bij het opstaan? Scoor dit op een schaal van 0-10.
2. Bewegingsgemak: Hoe makkelijk kun je de trap op, bukken, of een wandeling maken? Scoor 0-10.
3. Energie: Hoe is je energieniveau door de dag heen? Scoor 0-10.
4. Stemming: Hoe voel je je mentaal? Scoor 0-10.

Wanneer meten?
Het beste moment is ''s ochtends, vlak na het opstaan. Dan is de vergelijking het eerlijkst. Probeer dit elke dag te doen, maar maak er geen stress van als je een dag mist.

Hoe gebruik je de scores?
Kijk niet naar individuele dagen maar naar trends over weken. Een slechte dag betekent niets — een dalende trend over 3 weken vertelt je dat er iets moet veranderen. Een stijgende trend bevestigt dat je op de goede weg bent.

Concrete actie: Open de voortgangspagina in de app en vul je eerste welzijnsmeting in. Dit is je startpunt. Maak er een gewoonte van om dit elke ochtend te doen — het kost minder dan een minuut.',

  'Before you start moving, it is smart to establish a starting point. Not to judge yourself, but to be able to see how much has changed in a few weeks.

Why measure?
Change often happens so gradually that you do not notice it. By regularly tracking a few simple things, you make your progress visible. That is enormously motivating — especially on days when things are a bit tougher.

What will you track?
1. Stiffness: How stiff do you feel in the morning when you get up? Score this on a scale of 0-10.
2. Ease of movement: How easily can you climb stairs, bend down, or take a walk? Score 0-10.
3. Energy: What is your energy level throughout the day? Score 0-10.
4. Mood: How do you feel mentally? Score 0-10.

When to measure?
The best time is in the morning, right after getting up. That makes the comparison the fairest. Try to do this every day, but do not stress if you miss a day.

How to use the scores?
Do not look at individual days but at trends over weeks. A bad day means nothing — a declining trend over 3 weeks tells you something needs to change. A rising trend confirms you are on the right track.

Action step: Open the progress page in the app and fill in your first well-being measurement. This is your starting point. Make it a habit to do this every morning — it takes less than a minute.',
  'education', 10, 2
FROM public.program_weeks pw WHERE pw.week_number = 1;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Je eerste beweegmoment',
  'Your first movement session',
  'Tijd om te bewegen. Maar we beginnen rustig — het doel deze week is niet om jezelf uit te putten, maar om je lichaam te laten wennen aan regelmatige beweging.

Waarom beginnen we rustig?
Je gewrichten reageren het beste op geleidelijke belasting. Als je te snel te veel doet, kan je lichaam daar onrustig van worden. Dat is niet gevaarlijk, maar het is ook niet prettig. Door rustig op te bouwen, geef je je lichaam de kans om zich aan te passen.

Het beweegplan voor deze week:
- Dag 1-2: Een wandeling van 10-15 minuten in een comfortabel tempo
- Dag 3-4: Dezelfde wandeling + 5 minuten zachte rekoefeningen (zie het oefeningen-tabblad)
- Dag 5-7: Wandeling van 15-20 minuten + de rekoefeningen

Tips voor je wandeling:
- Kies een vlak parcours zonder veel hoogteverschil
- Loop in een tempo waarin je nog kunt praten
- Draag comfortabele schoenen met goede demping
- Als het buiten niet lukt, wandel dan binnen (rondjes door huis telt ook!)

Wat als het pijn doet?
Een beetje ongemak tijdens het bewegen is normaal en niet schadelijk. Als de pijn tijdens het bewegen boven een 5 op je schaal komt, neem dan een rustiger tempo of kort de afstand in. Pijn die binnen een uur na het bewegen weer op je basisniveau is, is helemaal prima.

Als je gewrichten de volgende dag wat stijver aanvoelen, is dat een normaal teken dat je lichaam aan het aanpassen is. Dit trekt meestal na 24-48 uur bij.

Concrete actie: Plan nu je eerste wandeling in. Kies een tijdstip, leg je kleding klaar, en zet een reminder in je telefoon. De eerste stap is letterlijk: een stap.',

  'Time to move. But we start easy — the goal this week is not to exhaust yourself, but to get your body used to regular movement.

Why do we start easy?
Your joints respond best to gradual loading. If you do too much too quickly, your body can react to that. It is not dangerous, but it is not pleasant either. By building up gradually, you give your body the chance to adapt.

The movement plan for this week:
- Day 1-2: A walk of 10-15 minutes at a comfortable pace
- Day 3-4: The same walk + 5 minutes of gentle stretching (see the exercises tab)
- Day 5-7: Walk of 15-20 minutes + the stretching exercises

Tips for your walk:
- Choose a flat route without much elevation change
- Walk at a pace where you can still talk
- Wear comfortable shoes with good cushioning
- If going outside is not possible, walk indoors (laps around the house count too!)

What if it hurts?
A bit of discomfort during movement is normal and not harmful. If pain during movement goes above a 5 on your scale, slow down or shorten the distance. Pain that returns to your baseline level within an hour after exercising is perfectly fine.

If your joints feel a bit stiffer the next day, that is a normal sign that your body is adapting. This usually subsides within 24-48 hours.

Action step: Schedule your first walk now. Choose a time, lay out your clothing, and set a reminder on your phone. The first step is literally: a step.',
  'exercise', 20, 3
FROM public.program_weeks pw WHERE pw.week_number = 1;


-- ── WEEK 2: Pijn begrijpen ──────────────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Hoe pijn werkt',
  'How pain works',
  'Pijn voelt misschien als een simpel signaal — iets is kapot, dus het doet pijn. Maar zo eenvoudig is het niet. Pijn is een beschermingsmechanisme van je brein, en het is veel complexer dan je denkt.

Je zenuwstelsel als alarmsysteem
Stel je voor dat je brein een alarmsysteem is. Bij gewrichtsklachten kan dat alarm overgevoelig worden. Het gaat af bij dingen die eigenlijk niet gevaarlijk zijn — zoals traplopen, bukken of een wandeling. De pijn die je voelt is echt, maar het betekent niet altijd dat er schade ontstaat.

Waarom is dit belangrijk?
Omdat het je keuzes beinvloedt. Als je denkt dat elke pijn betekent dat je je gewricht beschadigt, ga je steeds minder bewegen. En minder bewegen leidt tot stijvere gewrichten, zwakkere spieren, en uiteindelijk... meer pijn. Die cirkel willen we doorbreken.

Wat beinvloedt pijn?
Pijn wordt niet alleen bepaald door wat er in je gewricht gebeurt. Ook deze factoren spelen een rol:
- Slaap: Slechte slaap verlaagt je pijndrempel
- Stress: Spanning maakt je zenuwstelsel gevoeliger
- Stemming: Als je somber bent, voelt pijn erger
- Verwachtingen: Als je verwacht dat iets pijn gaat doen, doet het vaker pijn
- Beweging: Regelmatige beweging verlaagt juist je pijngevoeligheid

Dit is geen inbeelding
Laat dit heel duidelijk zijn: je pijn is echt. Het feit dat je brein een rol speelt, maakt de pijn niet minder echt. Maar het betekent wel dat je meer invloed hebt dan je denkt. Door je slaap te verbeteren, stress te verminderen en geleidelijk meer te bewegen, kun je je alarmsysteem weer kalibreren.

Concrete actie: Denk na over een activiteit die je vermijdt vanwege pijn. Schrijf op: wat is de activiteit, en wat denk je dat er gebeurt als je het doet? We gaan hier volgende module mee aan de slag.',

  'Pain might feel like a simple signal — something is broken, so it hurts. But it is not that simple. Pain is a protection mechanism of your brain, and it is much more complex than you think.

Your nervous system as an alarm system
Imagine your brain as an alarm system. With joint issues, that alarm can become oversensitive. It goes off at things that are not actually dangerous — like climbing stairs, bending down or taking a walk. The pain you feel is real, but it does not always mean damage is occurring.

Why is this important?
Because it influences your choices. If you think every pain means you are damaging your joint, you will move less and less. And less movement leads to stiffer joints, weaker muscles, and eventually... more pain. We want to break that cycle.

What influences pain?
Pain is not only determined by what happens in your joint. These factors also play a role:
- Sleep: Poor sleep lowers your pain threshold
- Stress: Tension makes your nervous system more sensitive
- Mood: When you feel down, pain feels worse
- Expectations: If you expect something to hurt, it more often does
- Movement: Regular movement actually lowers your pain sensitivity

This is not imaginary
Let this be very clear: your pain is real. The fact that your brain plays a role does not make the pain less real. But it does mean you have more influence than you think. By improving your sleep, reducing stress and gradually moving more, you can recalibrate your alarm system.

Action step: Think about an activity you avoid because of pain. Write down: what is the activity, and what do you think will happen if you do it? We will work with this in the next module.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 2;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegingsangst overwinnen',
  'Overcoming fear of movement',
  'Vorige module heb je een activiteit opgeschreven die je vermijdt. Nu gaan we daar iets mee doen. Niet door jezelf te forceren, maar door slim en geleidelijk te werk te gaan.

Wat is bewegingsangst?
Bewegingsangst (kinesiofobie) is de angst dat bewegen je lichaam beschadigt. Het is een van de grootste voorspellers van langdurige klachten — niet de ernst van de slijtage, maar de mate waarin je bang bent om te bewegen.

De waarheid over bewegen met gewrichtsklachten
Bewegen is veilig. Dat klinkt misschien tegenstrijdig als het pijn doet, maar onderzoek laat keer op keer zien: regelmatige beweging is het beste wat je voor je gewrichten kunt doen. Het versterkt het kraakbeen, smeert de gewrichten, en maakt de omliggende spieren sterker.

De exposure-ladder
We gebruiken een techniek uit de gedragstherapie: de exposure-ladder. Je begint onderaan met iets dat een klein beetje ongemakkelijk is, en werkt stap voor stap omhoog.

Voorbeeld voor traplopen:
1. Sta naast de trap en doe alsof je een stap omhoog gaat (zonder gewicht)
2. Zet een voet op de eerste trede en kom terug
3. Loop 3 treden omhoog met de leuning
4. Loop een halve trap met de leuning
5. Loop de hele trap met de leuning
6. Loop de trap zonder leuning

De regels:
- Ga pas naar de volgende stap als de huidige stap minder dan een 3 op je pijnschaal scoort
- Blijf minimaal 2 dagen op dezelfde stap
- Ga nooit meer dan 1 stap per keer omhoog
- Het is prima om een stap terug te gaan als het nodig is

Concrete actie: Maak je eigen exposure-ladder voor de activiteit die je vorige keer opschreef. Verdeel het in 5-6 stappen, van makkelijk naar je einddoel. Begin vandaag met stap 1.',

  'In the previous module you wrote down an activity you avoid. Now we are going to do something with it. Not by forcing yourself, but by working smartly and gradually.

What is fear of movement?
Fear of movement (kinesiophobia) is the fear that moving will damage your body. It is one of the biggest predictors of long-term complaints — not the severity of the wear, but the degree to which you are afraid to move.

The truth about moving with joint issues
Movement is safe. That might sound contradictory when it hurts, but research shows time and again: regular movement is the best thing you can do for your joints. It strengthens the cartilage, lubricates the joints, and makes the surrounding muscles stronger.

The exposure ladder
We use a technique from behavioural therapy: the exposure ladder. You start at the bottom with something slightly uncomfortable, and work your way up step by step.

Example for climbing stairs:
1. Stand next to the stairs and pretend to take a step up (without weight)
2. Place one foot on the first step and come back
3. Walk 3 steps up with the railing
4. Walk half the stairs with the railing
5. Walk the full stairs with the railing
6. Walk the stairs without the railing

The rules:
- Only move to the next step when the current step scores less than a 3 on your pain scale
- Stay on the same step for at least 2 days
- Never go up more than 1 step at a time
- It is fine to go back a step if needed

Action step: Create your own exposure ladder for the activity you wrote down last time. Divide it into 5-6 steps, from easy to your end goal. Start with step 1 today.',
  'exercise', 20, 2
FROM public.program_weeks pw WHERE pw.week_number = 2;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Wat helpt bij pijn?',
  'What helps with pain?',
  'Nu je begrijpt hoe pijn werkt, is het tijd om je gereedschapskist te vullen. Niet elke strategie werkt voor iedereen, maar door meerdere opties te kennen kun je experimenteren en ontdekken wat voor jou het beste werkt.

Warmte en koude
- Warmte: Ontspant stijve spieren en gewrichten. Gebruik een warmtekussen, warm bad of warme douche. Vooral goed bij ochtendstijfheid.
- Koude: Vermindert zwelling na intensieve activiteit. Gebruik een coldpack gewikkeld in een handdoek, maximaal 15 minuten.
- Vuistregel: warmte voor stijfheid, koude na inspanning.

Beweging als pijnstiller
Dit klinkt misschien gek, maar beweging is een van de krachtigste pijnstillers die er is. Tijdens het bewegen maakt je lichaam endorfine aan — je eigen pijnstiller. Begin met lichte beweging en bouw op. Al 10 minuten wandelen kan het verschil maken.

Ademhaling
Wanneer je pijn hebt, ga je onbewust oppervlakkiger ademen. Dat verhoogt de spanning in je lichaam en maakt de pijn erger. Probeer dit:
- Adem in door je neus, 4 tellen
- Houd vast, 4 tellen
- Adem uit door je mond, 6 tellen
- Herhaal 5 keer

Dit activeert je parasympathische zenuwstelsel — het rustgevende systeem van je lichaam.

Afleiding
Pijn eist aandacht op. Hoe meer je je erop focust, hoe intenser het voelt. Afleiding is geen vermijding — het is een bewuste strategie. Luister naar muziek, bel iemand, ga naar buiten, of doe iets met je handen.

Slaap
Slaap is je ultieme herstelmiddel. In de slaapmodule (week 4) gaan we hier diep op in. Voor nu: probeer elke nacht 7-8 uur te slapen.

Concrete actie: Probeer vandaag twee van deze strategieen uit. Begin met de ademhalingsoefening en kies daarnaast warmte of koude. Schrijf op wat je merkt.',

  'Now that you understand how pain works, it is time to fill your toolbox. Not every strategy works for everyone, but by knowing multiple options you can experiment and discover what works best for you.

Heat and cold
- Heat: Relaxes stiff muscles and joints. Use a heating pad, warm bath or warm shower. Especially good for morning stiffness.
- Cold: Reduces swelling after intensive activity. Use a cold pack wrapped in a towel, maximum 15 minutes.
- Rule of thumb: heat for stiffness, cold after exertion.

Movement as pain relief
This might sound odd, but movement is one of the most powerful pain relievers there is. During movement your body produces endorphins — your own painkillers. Start with light movement and build up. Even 10 minutes of walking can make a difference.

Breathing
When you are in pain, you unconsciously breathe more shallowly. That increases tension in your body and makes the pain worse. Try this:
- Breathe in through your nose, 4 counts
- Hold, 4 counts
- Breathe out through your mouth, 6 counts
- Repeat 5 times

This activates your parasympathetic nervous system — your body''s calming system.

Distraction
Pain demands attention. The more you focus on it, the more intense it feels. Distraction is not avoidance — it is a conscious strategy. Listen to music, call someone, go outside, or do something with your hands.

Sleep
Sleep is your ultimate recovery tool. In the sleep module (week 4) we will go deep into this. For now: try to sleep 7-8 hours every night.

Action step: Try two of these strategies today. Start with the breathing exercise and choose either heat or cold alongside it. Write down what you notice.',
  'education', 15, 3
FROM public.program_weeks pw WHERE pw.week_number = 2;


-- ── WEEK 3: Voeding als fundament ───────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Anti-inflammatoire voeding basics',
  'Anti-inflammatory nutrition basics',
  'Voeding speelt een grotere rol bij gewrichtsklachten dan de meeste mensen denken. Niet als wondermiddel, maar als fundament. Wat je eet beinvloedt de mate van laaggradige ontsteking in je lichaam — en die ontsteking speelt een rol bij gewrichtsklachten.

Wat is laaggradige ontsteking?
Anders dan een acute ontsteking (rood, warm, gezwollen) is laaggradige ontsteking onzichtbaar. Het is een subtiel proces dat je gewrichten langzaam beinvloedt. De goede nieuws: je kunt het beinvloeden met wat je eet.

De basis: meer van dit
- Vette vis (zalm, makreel, haring): 2x per week. Rijk aan omega-3 vetzuren die ontstekingen helpen verminderen.
- Groenten in alle kleuren: minimaal 250g per dag. Hoe meer kleuren, hoe meer verschillende antioxidanten.
- Noten en zaden: een handvol per dag. Walnoten, lijnzaad en chiazaad zijn toppers.
- Olijfolie: gebruik dit als je standaard bakolie. Bevat oleocanthal, een natuurlijke ontstekingsremmer.
- Bessen en donker fruit: blauwe bessen, kersen, granaatappel.

De basis: minder van dit
- Bewerkt vlees: worst, bacon, salami. Bevat stoffen die ontstekingen aanwakkeren.
- Suiker en geraffineerde koolhydraten: wit brood, koekjes, frisdrank. Veroorzaken pieken in je bloedsuiker die ontstekingen stimuleren.
- Gefrituurde producten: de verhitting van olie bij frituren creert schadelijke stoffen.
- Overmatig alcohol: meer dan 1 glas per dag verhoogt ontstekingsmarkers.

Belangrijk: het gaat om het totaalplaatje
Je hoeft niet perfect te eten. Het gaat om het patroon over weken en maanden, niet om individuele maaltijden. Een koekje bij de koffie is prima — elke dag een zak chips is dat minder.

Concrete actie: Kijk in je koelkast en voorraadkast. Tel hoeveel items uit de "meer van dit" lijst je in huis hebt. Zet minimaal 2 items uit die lijst op je boodschappenlijstje voor deze week.',

  'Nutrition plays a bigger role in joint issues than most people think. Not as a miracle cure, but as a foundation. What you eat influences the level of low-grade inflammation in your body — and that inflammation plays a role in joint issues.

What is low-grade inflammation?
Unlike acute inflammation (red, warm, swollen), low-grade inflammation is invisible. It is a subtle process that slowly affects your joints. The good news: you can influence it with what you eat.

The basics: more of this
- Fatty fish (salmon, mackerel, herring): 2x per week. Rich in omega-3 fatty acids that help reduce inflammation.
- Vegetables in all colours: minimum 250g per day. The more colours, the more different antioxidants.
- Nuts and seeds: a handful per day. Walnuts, flaxseed and chia seeds are top choices.
- Olive oil: use this as your standard cooking oil. Contains oleocanthal, a natural anti-inflammatory.
- Berries and dark fruit: blueberries, cherries, pomegranate.

The basics: less of this
- Processed meat: sausage, bacon, salami. Contains substances that fuel inflammation.
- Sugar and refined carbohydrates: white bread, biscuits, soft drinks. Cause spikes in blood sugar that stimulate inflammation.
- Deep-fried products: heating oil during frying creates harmful substances.
- Excessive alcohol: more than 1 glass per day increases inflammation markers.

Important: it is about the overall picture
You do not need to eat perfectly. It is about the pattern over weeks and months, not individual meals. A biscuit with your coffee is fine — a bag of crisps every day is less so.

Action step: Look in your fridge and pantry. Count how many items from the "more of this" list you have at home. Put at least 2 items from that list on your shopping list for this week.',
  'nutrition', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 3;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegen in week 3',
  'Movement in week 3',
  'Je bent nu twee weken onderweg. Je lichaam begint te wennen aan regelmatige beweging, en het is tijd om een stapje verder te gaan.

Terugblik op week 1-2
Hoe gaat het met je wandelingen? Hoe voelen je gewrichten zich vergeleken met twee weken geleden? Kijk even naar je welzijnsscores. Zie je al verandering? Zo niet, geen zorgen — verandering komt vaak pas na 3-4 weken zichtbaar.

Het plan voor deze week
We voegen een nieuw element toe: lichte krachtoefeningen. Dit zijn oefeningen die je thuis kunt doen, zonder apparatuur.

Dagelijks schema:
- Wandeling: 15-20 minuten (je bent hier inmiddels aan gewend)
- Krachtoefeningen (na de wandeling):
  * Stoelstand: Ga met je rug tegen de muur staan, zak door je knieen alsof je op een stoel gaat zitten. Houd 10 seconden, 5x herhalen.
  * Beenheffen: Lig op je rug, strek een been en til het 15 cm van de grond. Houd 5 seconden, 10x per been.
  * Kuitheffen: Ga op je tenen staan, houd 3 seconden, zak terug. 10x herhalen. Houd je vast aan een stoel voor balans.

Hoeveel pijn is acceptabel?
Tijdens de oefeningen: maximaal 3-4 op je pijnschaal. Na de oefeningen: de pijn zou binnen een uur terug moeten zijn naar je basisniveau. De volgende ochtend mag je iets stijver zijn, maar dit moet binnen 24 uur over zijn.

Als je meer dan 24 uur extra pijn of stijfheid hebt, doe je iets te veel. Verlaag de intensiteit of het aantal herhalingen.

Concrete actie: Doe vandaag de drie krachtoefeningen na je wandeling. Begin met de helft van de herhalingen als het te zwaar voelt. Noteer hoe het ging.',

  'You are now two weeks in. Your body is starting to get used to regular movement, and it is time to take it a step further.

Looking back at week 1-2
How are your walks going? How do your joints feel compared to two weeks ago? Check your well-being scores. Do you see change already? If not, no worries — change often only becomes visible after 3-4 weeks.

The plan for this week
We add a new element: light strength exercises. These are exercises you can do at home, without equipment.

Daily schedule:
- Walk: 15-20 minutes (you are used to this by now)
- Strength exercises (after the walk):
  * Wall sit: Stand with your back against the wall, bend your knees as if sitting on a chair. Hold 10 seconds, repeat 5x.
  * Leg raises: Lie on your back, straighten one leg and lift it 15 cm off the ground. Hold 5 seconds, 10x per leg.
  * Calf raises: Stand on your toes, hold 3 seconds, lower back down. Repeat 10x. Hold onto a chair for balance.

How much pain is acceptable?
During exercises: maximum 3-4 on your pain scale. After exercises: pain should return to your baseline within an hour. The next morning you may be slightly stiffer, but this should resolve within 24 hours.

If you have extra pain or stiffness for more than 24 hours, you are doing too much. Lower the intensity or number of repetitions.

Action step: Do the three strength exercises today after your walk. Start with half the repetitions if it feels too heavy. Note how it went.',
  'exercise', 20, 2
FROM public.program_weeks pw WHERE pw.week_number = 3;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Je eerste anti-inflammatoire maaltijd',
  'Your first anti-inflammatory meal',
  'Theorie is mooi, maar nu gaan we koken. Of eigenlijk: slim kiezen. Je hoeft geen chef-kok te zijn om anti-inflammatoir te eten. Een paar eenvoudige aanpassingen in je dagelijkse maaltijden maken al een groot verschil.

Ontbijt: de makkelijkste win
Vervang je witte boterham met jam door een van deze opties:
- Havermout met blauwe bessen, walnoten en een beetje honing
- Volkoren brood met avocado en een gekookt ei
- Yoghurt (vol, ongezoet) met chiazaad en frambozen

Waarom dit werkt: je start de dag met ontstekingsremmende voedingsstoffen in plaats van suiker die je ontstekingsniveau juist verhoogt.

Lunch: de salade-upgrade
Je lunch hoeft geen saaie salade te zijn. Denk aan:
- Volkoren wrap met zalm, avocado en rucola
- Linzensoep met kurkuma en gember (een powercombo)
- Restjes van gisteravond op een bedje van bladgroenten

Avondeten: de vis-regel
Probeer twee keer per week vis te eten in plaats van vlees. De makkelijkste optie: een zalmfilet uit de oven (200 graden, 15 minuten, klaar) met geroosterde groenten en olijfolie.

Snacks: de juiste keuzes
- Een handvol ongezouten noten (walnoten, amandelen)
- Een stuk donkere chocolade (70%+)
- Wortel en komkommer met hummus
- Een appel met een eetlepel pindakaas

De gouden regel
Eet zo min mogelijk uit een verpakking met meer dan 5 ingredienten. Hoe korter de ingredientenlijst, hoe beter het meestal voor je is.

Concrete actie: Kies een van de ontbijtopties en probeer die morgenochtend. Koop vandaag de ingredienten. Kleine stap, groot effect.',

  'Theory is great, but now we are going to cook. Or rather: make smart choices. You do not need to be a chef to eat anti-inflammatory. A few simple adjustments to your daily meals already make a big difference.

Breakfast: the easiest win
Replace your white bread with jam with one of these options:
- Oatmeal with blueberries, walnuts and a bit of honey
- Wholegrain bread with avocado and a boiled egg
- Yoghurt (full fat, unsweetened) with chia seeds and raspberries

Why this works: you start the day with anti-inflammatory nutrients instead of sugar that actually raises your inflammation levels.

Lunch: the salad upgrade
Your lunch does not have to be a boring salad. Think of:
- Wholegrain wrap with salmon, avocado and rocket
- Lentil soup with turmeric and ginger (a power combo)
- Leftovers from last night on a bed of leafy greens

Dinner: the fish rule
Try to eat fish instead of meat twice a week. The easiest option: an oven-baked salmon fillet (200 degrees, 15 minutes, done) with roasted vegetables and olive oil.

Snacks: the right choices
- A handful of unsalted nuts (walnuts, almonds)
- A piece of dark chocolate (70%+)
- Carrot and cucumber with hummus
- An apple with a tablespoon of peanut butter

The golden rule
Eat as little as possible from packaging with more than 5 ingredients. The shorter the ingredient list, the better it usually is for you.

Action step: Choose one of the breakfast options and try it tomorrow morning. Buy the ingredients today. Small step, big effect.',
  'nutrition', 15, 3
FROM public.program_weeks pw WHERE pw.week_number = 3;


-- ── WEEK 4: Slaap en herstel ────────────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Waarom slaap alles beinvloedt',
  'Why sleep affects everything',
  'Als er een magische pil bestond die pijn vermindert, je stemming verbetert, je gewicht helpt reguleren, je immuunsysteem versterkt en je gewrichten herstelt — zou je die slikken? Die "pil" bestaat. Het heet slaap.

Slaap en je gewrichten
Tijdens de diepe slaap gebeuren cruciale herstelprocessen:
- Groeihormoon wordt aangemaakt (essentieel voor weefselherstel)
- Ontstekingsmarkers dalen
- Je pijndrempel stijgt (je kunt meer hebben na goede slaap)
- Kraakbeen herstelt zich

Bij slechte slaap gebeurt het tegenovergestelde: meer ontsteking, lagere pijndrempel, trager herstel. Onderzoek toont dat mensen met slaapproblemen 2-3x meer kans hebben op chronische pijn.

Hoeveel slaap heb je nodig?
De meeste volwassenen hebben 7-9 uur nodig. Maar het gaat niet alleen om kwantiteit — kwaliteit is minstens zo belangrijk. 6 uur diepe slaap is beter dan 9 uur woelen.

Tekenen van slechte slaapkwaliteit:
- Je wordt moe wakker ondanks genoeg uren
- Je wordt meerdere keren per nacht wakker
- Je ligt lang te piekeren voor het inslapen
- Je voelt je de hele dag vermoeid
- Je hebt moeite met concentratie

Je slaap beoordelen
Geef jezelf deze week elke ochtend een slaapscore van 1-10:
- 1-3: Slecht geslapen, vermoeid wakker
- 4-6: Matig, maar functioneel
- 7-8: Goed geslapen, uitgerust
- 9-10: Uitstekend, vol energie

Concrete actie: Houd deze week elke ochtend je slaapscore bij (in de app of in een notitieboekje). Noteer ook hoe laat je ging slapen en wakker werd. We gaan dit gebruiken in de volgende module.',

  'If there was a magic pill that reduces pain, improves your mood, helps regulate your weight, strengthens your immune system and repairs your joints — would you take it? That "pill" exists. It is called sleep.

Sleep and your joints
During deep sleep, crucial repair processes happen:
- Growth hormone is produced (essential for tissue repair)
- Inflammation markers decrease
- Your pain threshold rises (you can handle more after good sleep)
- Cartilage repairs itself

With poor sleep, the opposite happens: more inflammation, lower pain threshold, slower recovery. Research shows that people with sleep problems have 2-3x higher risk of chronic pain.

How much sleep do you need?
Most adults need 7-9 hours. But it is not just about quantity — quality is at least as important. 6 hours of deep sleep is better than 9 hours of tossing and turning.

Signs of poor sleep quality:
- You wake up tired despite enough hours
- You wake up multiple times per night
- You lie worrying for a long time before falling asleep
- You feel tired all day
- You have difficulty concentrating

Assessing your sleep
Give yourself a sleep score from 1-10 every morning this week:
- 1-3: Slept poorly, woke up tired
- 4-6: Moderate, but functional
- 7-8: Slept well, rested
- 9-10: Excellent, full of energy

Action step: Track your sleep score every morning this week (in the app or in a notebook). Also note what time you went to sleep and woke up. We will use this in the next module.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 4;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Slaaphygiene: je avondroutine',
  'Sleep hygiene: your evening routine',
  'Nu je weet waarom slaap zo belangrijk is, gaan we je slaap verbeteren. De sleutel is je avondroutine — wat je in de uren voor het slapen doet, bepaalt grotendeels hoe goed je slaapt.

De ideale avondroutine (pas aan wat bij je past):

2 uur voor bed:
- Stop met werken en intensief nadenken
- Vermijd zware maaltijden (een lichte snack is prima)
- Geen cafeïne meer (dat geldt ook voor groene thee en cola)

1 uur voor bed:
- Dim de lichten in huis (je brein reageert op licht)
- Leg je telefoon weg of zet een blauwlichtfilter aan
- Doe iets rustgevends: lezen, puzzelen, rustige muziek
- Vermijd opwindende tv-series of social media

30 minuten voor bed:
- Slaapkamer: koel (16-18 graden), donker, stil
- Doe de ademhalingsoefening uit week 2 (4-4-6)
- Als je gewrichten stijf zijn: een warm bad of douche

In bed:
- Gebruik je bed alleen voor slapen (en intimiteit)
- Lig je na 20 minuten nog wakker? Sta op, doe iets rustigs in een andere kamer, en ga terug als je slaperig bent
- Piekeren? Schrijf je gedachten op een briefje naast je bed. Ze zijn er morgen nog.

Speciale tips bij gewrichtsklachten:
- Probeer een kussen tussen je knieen als je op je zij slaapt
- Gebruik een iets dikker kussen als je last hebt van nekstijfheid
- Een zacht matras is niet altijd beter — medium-firm werkt voor de meeste mensen
- Als pijn je wakker houdt, probeer een warmtekussen op het gewricht voor het slapen

Het 21-dagenprincipe
Het duurt gemiddeld 21 dagen om een nieuwe gewoonte te vormen. Geef jezelf die tijd. De eerste week voelt onwennig, de tweede week wordt het makkelijker, de derde week is het routine.

Concrete actie: Kies vanavond drie dingen uit de routine hierboven en pas ze toe. Begin met de makkelijkste. Bouw elke paar dagen een element bij.',

  'Now that you know why sleep is so important, we are going to improve your sleep. The key is your evening routine — what you do in the hours before bed largely determines how well you sleep.

The ideal evening routine (adjust to fit your life):

2 hours before bed:
- Stop working and intensive thinking
- Avoid heavy meals (a light snack is fine)
- No more caffeine (this also applies to green tea and cola)

1 hour before bed:
- Dim the lights at home (your brain responds to light)
- Put your phone away or turn on a blue light filter
- Do something calming: reading, puzzles, calm music
- Avoid exciting TV series or social media

30 minutes before bed:
- Bedroom: cool (16-18 degrees), dark, quiet
- Do the breathing exercise from week 2 (4-4-6)
- If your joints are stiff: a warm bath or shower

In bed:
- Use your bed only for sleeping (and intimacy)
- Still awake after 20 minutes? Get up, do something calm in another room, and go back when you feel sleepy
- Worrying? Write your thoughts on a note next to your bed. They will still be there tomorrow.

Special tips for joint issues:
- Try a pillow between your knees if you sleep on your side
- Use a slightly thicker pillow if you have neck stiffness
- A soft mattress is not always better — medium-firm works for most people
- If pain keeps you awake, try a heating pad on the joint before sleep

The 21-day principle
It takes an average of 21 days to form a new habit. Give yourself that time. The first week feels unfamiliar, the second week it gets easier, the third week it is routine.

Action step: Choose three things from the routine above and apply them tonight. Start with the easiest ones. Add an element every few days.',
  'sleep', 15, 2
FROM public.program_weeks pw WHERE pw.week_number = 4;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegen in week 4',
  'Movement in week 4',
  'Je bent nu halverwege de eerste maand. Je lichaam past zich aan, en het is tijd om je beweegprogramma iets op te schroeven. Niet dramatisch — we voegen gewoon wat variatie toe.

Terugblik
Je hebt nu 3 weken gewandeld en 1 week krachtoefeningen gedaan. Hoe gaat het? Controleer je welzijnsscores. Merk je verschil in stijfheid, bewegingsgemak of energie?

Deze week: flexibiliteit toevoegen
Naast wandelen en kracht voegen we nu rekoefeningen toe. Rekken helpt je gewrichten soepeler te bewegen en vermindert ochtendstijfheid.

Dagelijks schema week 4:
- Ochtend (5 min): Rekoefeningen bij het opstaan
  * Knie-naar-borst (liggend, 20 sec per been)
  * Rugrotatie (liggend, knieen naar links/rechts, 20 sec per kant)
  * Hamstring rek (liggend, been omhoog met handdoek, 20 sec per been)
- Overdag: Wandeling 20 minuten
- Avond: Krachtoefeningen uit week 3 (stoelstand, beenheffen, kuitheffen)

Nieuwe oefening: de brug
Lig op je rug, voeten plat op de grond, knieen gebogen. Duw je heupen omhoog tot je lichaam een rechte lijn vormt van knieen tot schouders. Houd 5 seconden, zak langzaam terug. 10x herhalen. Dit versterkt je bilspieren en onderrug — cruciaal voor je heup- en kniegewrichten.

Let op je ademhaling
Adem uit bij de inspanning (omhoog duwen, been heffen) en adem in bij het ontspannen. Nooit je adem inhouden tijdens oefeningen.

Concrete actie: Start morgenochtend met de drie rekoefeningen. Stel een alarm 5 minuten eerder dan normaal. Na een week voel je het verschil in ochtendstijfheid.',

  'You are now halfway through the first month. Your body is adapting, and it is time to step up your movement programme slightly. Not dramatically — we are just adding some variety.

Looking back
You have now walked for 3 weeks and done strength exercises for 1 week. How is it going? Check your well-being scores. Do you notice a difference in stiffness, ease of movement or energy?

This week: adding flexibility
In addition to walking and strength, we now add stretching exercises. Stretching helps your joints move more smoothly and reduces morning stiffness.

Daily schedule week 4:
- Morning (5 min): Stretching exercises upon waking
  * Knee-to-chest (lying down, 20 sec per leg)
  * Spinal rotation (lying down, knees to left/right, 20 sec per side)
  * Hamstring stretch (lying down, leg up with towel, 20 sec per leg)
- During the day: Walk 20 minutes
- Evening: Strength exercises from week 3 (wall sit, leg raises, calf raises)

New exercise: the bridge
Lie on your back, feet flat on the ground, knees bent. Push your hips up until your body forms a straight line from knees to shoulders. Hold 5 seconds, slowly lower back down. Repeat 10x. This strengthens your glutes and lower back — crucial for your hip and knee joints.

Watch your breathing
Breathe out during the effort (pushing up, lifting leg) and breathe in when relaxing. Never hold your breath during exercises.

Action step: Start tomorrow morning with the three stretching exercises. Set an alarm 5 minutes earlier than usual. After a week you will feel the difference in morning stiffness.',
  'exercise', 20, 3
FROM public.program_weeks pw WHERE pw.week_number = 4;


-- ── WEEK 5: Kracht opbouwen ─────────────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Progressief belasten uitgelegd',
  'Progressive loading explained',
  'Je hebt nu een maand bewogen. Je lichaam is sterker dan vier weken geleden, ook al merk je dat misschien nog niet overal. Deze week gaan we serieus aan kracht werken, met een principe dat centraal staat in alle revalidatie: progressief belasten.

Wat is progressief belasten?
Het betekent simpelweg: geleidelijk meer vragen van je lichaam. Niet elke dag meer, maar over weken heen. Je lichaam past zich aan de belasting aan — als je het telkens een klein beetje meer uitdaagt, wordt het sterker.

Waarom is kracht zo belangrijk voor je gewrichten?
Sterke spieren rondom een gewricht werken als schokdempers. Ze nemen een deel van de belasting over die anders op je kraakbeen terechtkomt. Hoe sterker je spieren, hoe beter je gewricht beschermd is.

De belangrijkste spiergroepen:
- Quadriceps (bovenbeen voorkant): De belangrijkste spier voor je knie. Sterke quads verminderen kniepijn significant.
- Hamstrings (bovenbeen achterkant): Balanceren de knie en ondersteunen de heup.
- Gluteus (bilspieren): De motor van je lichaam. Zwakke bilspieren zijn een van de meest voorkomende oorzaken van heup- en knieklachten.
- Kuitspieren: Belangrijk voor balans en looppatroon.
- Core (buik- en rugspieren): Je stabiliteitsbasis. Zonder sterke core compenseren je gewrichten.

Hoe bouw je op?
Week 1-2 (al gedaan): Lichte oefeningen, leren van de beweging
Week 3-4 (al gedaan): Meer herhalingen, iets langere holds
Week 5-6 (nu): Zwaardere varianten, korte setjes
Week 7-8: Combinatie-oefeningen, functionele bewegingen
Week 9-12: Onderhoud en verfijning

De 2-voor-2 regel
Als je de laatste 2 herhalingen van de laatste 2 sets makkelijk kunt doen, is het tijd om op te schalen. Dat kan door: meer herhalingen, langere holds, zwaardere variant, of een extra set.

Concrete actie: Doe vandaag je krachtoefeningen en beoordeel: zijn de laatste 2 herhalingen nog uitdagend? Zo nee, schaal op met de 2-voor-2 regel.',

  'You have now moved for a month. Your body is stronger than four weeks ago, even if you might not notice it everywhere yet. This week we are going to work seriously on strength, with a principle central to all rehabilitation: progressive loading.

What is progressive loading?
It simply means: gradually asking more of your body. Not more every day, but over weeks. Your body adapts to the load — if you challenge it a little more each time, it gets stronger.

Why is strength so important for your joints?
Strong muscles around a joint act as shock absorbers. They take over part of the load that would otherwise land on your cartilage. The stronger your muscles, the better your joint is protected.

The key muscle groups:
- Quadriceps (front of thigh): The most important muscle for your knee. Strong quads significantly reduce knee pain.
- Hamstrings (back of thigh): Balance the knee and support the hip.
- Gluteus (glutes): The engine of your body. Weak glutes are one of the most common causes of hip and knee complaints.
- Calf muscles: Important for balance and walking pattern.
- Core (abdominal and back muscles): Your stability base. Without a strong core, your joints compensate.

How to build up?
Week 1-2 (done): Light exercises, learning the movement
Week 3-4 (done): More repetitions, slightly longer holds
Week 5-6 (now): Heavier variations, short sets
Week 7-8: Combination exercises, functional movements
Week 9-12: Maintenance and refinement

The 2-for-2 rule
If you can easily do the last 2 repetitions of the last 2 sets, it is time to scale up. You can do this by: more repetitions, longer holds, heavier variation, or an extra set.

Action step: Do your strength exercises today and assess: are the last 2 repetitions still challenging? If not, scale up using the 2-for-2 rule.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 5;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Krachttraining niveau 2',
  'Strength training level 2',
  'Het is tijd om je oefeningen een niveau op te tillen. Je kent de basisbewegingen — nu maken we ze uitdagender. Alle oefeningen zijn nog steeds thuis te doen zonder apparatuur.

Oefening 1: Squat (vervangt stoelstand)
- Sta met je voeten op schouderbreedte
- Zak langzaam door je knieen alsof je gaat zitten
- Ga zo diep als comfortabel is (minimaal 90 graden)
- Duw jezelf terug omhoog
- 3 sets van 10 herhalingen
- Tip: houd een stoel achter je voor het vertrouwen

Oefening 2: Step-up (vervangt beenheffen)
- Gebruik een traptreden of een stevig verhoging (15-20 cm)
- Stap met een voet op de trede en duw jezelf omhoog
- Stap gecontroleerd terug
- 3 sets van 8 per been
- Tip: houd de leuning vast als dat nodig is

Oefening 3: Brug met hold (upgrade van de brug)
- Zelfde uitvoering als de brug
- Nu: houd de bovenste positie 10 seconden
- 3 sets van 8 herhalingen met hold
- Extra uitdaging: til een voet van de grond in de bovenste positie

Oefening 4: Zijwaarts stappen met weerstandsband
- Heb je een weerstandsband? Doe die om je enkels
- Ga in een halve squat-positie
- Zet stappen opzij, 10 naar links, 10 naar rechts
- Geen band? Doe de oefening zonder — het effect is er nog steeds

Oefening 5: Plank (core)
- Steun op je onderarmen en tenen (of knieen als dat te zwaar is)
- Houd je lichaam in een rechte lijn
- Houd 20 seconden, 3x
- Bouw op naar 30, dan 45 seconden

Hersteltijd
Neem minimaal 1 rustdag per week. Op rustdagen: alleen wandelen en rekken, geen krachtoefeningen. Je spieren worden sterker tijdens het herstel, niet tijdens de training.

Concrete actie: Doe het nieuwe programma vandaag. Noteer hoeveel herhalingen je per oefening haalt. Dit is je nieuwe startpunt.',

  'It is time to take your exercises up a level. You know the basic movements — now we make them more challenging. All exercises can still be done at home without equipment.

Exercise 1: Squat (replaces wall sit)
- Stand with feet shoulder-width apart
- Slowly bend your knees as if sitting down
- Go as deep as comfortable (minimum 90 degrees)
- Push yourself back up
- 3 sets of 10 repetitions
- Tip: keep a chair behind you for confidence

Exercise 2: Step-up (replaces leg raises)
- Use a stair step or a sturdy platform (15-20 cm)
- Step onto the step with one foot and push yourself up
- Step back down in a controlled manner
- 3 sets of 8 per leg
- Tip: hold the railing if needed

Exercise 3: Bridge with hold (upgrade of the bridge)
- Same execution as the bridge
- Now: hold the top position for 10 seconds
- 3 sets of 8 repetitions with hold
- Extra challenge: lift one foot off the ground in the top position

Exercise 4: Lateral steps with resistance band
- Have a resistance band? Put it around your ankles
- Get into a half squat position
- Take steps sideways, 10 to the left, 10 to the right
- No band? Do the exercise without — the effect is still there

Exercise 5: Plank (core)
- Support yourself on your forearms and toes (or knees if too heavy)
- Keep your body in a straight line
- Hold 20 seconds, 3x
- Build up to 30, then 45 seconds

Recovery time
Take at least 1 rest day per week. On rest days: only walking and stretching, no strength exercises. Your muscles get stronger during recovery, not during training.

Action step: Do the new programme today. Note how many repetitions you manage per exercise. This is your new starting point.',
  'exercise', 25, 2
FROM public.program_weeks pw WHERE pw.week_number = 5;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Eiwit en spierherstel',
  'Protein and muscle recovery',
  'Nu je serieuzer gaat trainen, wordt voeding nog belangrijker. Je spieren hebben bouwstenen nodig om sterker te worden, en de belangrijkste bouwsteen is eiwit.

Hoeveel eiwit heb je nodig?
De vuistregel: 1,2 tot 1,5 gram eiwit per kilo lichaamsgewicht per dag. Weeg je 75 kilo? Dan heb je 90-112 gram eiwit per dag nodig.

Dat klinkt misschien veel, maar het is makkelijker dan je denkt:
- 1 ei: 6 gram eiwit
- 100g kipfilet: 31 gram
- 100g zalm: 25 gram
- 100g cottage cheese: 11 gram
- 100g linzen (gekookt): 9 gram
- 150g Griekse yoghurt: 15 gram
- 100g tofu: 12 gram

Timing maakt uit
Het beste moment om eiwit te eten is verdeeld over de dag — niet alles in een maaltijd. Probeer bij elke maaltijd minimaal 20-30 gram eiwit te eten. En na je training is een eiwitrijke snack binnen een uur ideaal.

Eiwitrijke snacks na het trainen:
- Griekse yoghurt met noten
- Een gekookt ei en een stuk fruit
- Cottage cheese op een cracker
- Een glas melk of sojamelk
- Hummus met groenten

Plantaardig eiwit
Eet je geen of weinig vlees? Geen probleem. Combineer peulvruchten (linzen, kikkererwten, bonen) met granen (rijst, brood) voor een compleet eiwitprofiel. Tofu, tempeh en edamame zijn ook uitstekende bronnen.

De hydratatie-factor
Vergeet water niet. Kraakbeen bestaat voor 80% uit water. Drink minimaal 1,5-2 liter per dag, meer als je sport. Een goed gehydrateerd gewricht beweegt soepeler en is beter beschermd.

Concrete actie: Bereken hoeveel eiwit je gisteren hebt gegeten (schat het). Is het genoeg? Zo niet, voeg vandaag een eiwitrijke snack toe na je training.',

  'Now that you are training more seriously, nutrition becomes even more important. Your muscles need building blocks to get stronger, and the most important building block is protein.

How much protein do you need?
The rule of thumb: 1.2 to 1.5 grams of protein per kilo of body weight per day. Weigh 75 kilos? Then you need 90-112 grams of protein per day.

That might sound like a lot, but it is easier than you think:
- 1 egg: 6 grams of protein
- 100g chicken breast: 31 grams
- 100g salmon: 25 grams
- 100g cottage cheese: 11 grams
- 100g lentils (cooked): 9 grams
- 150g Greek yoghurt: 15 grams
- 100g tofu: 12 grams

Timing matters
The best time to eat protein is spread throughout the day — not all in one meal. Try to eat at least 20-30 grams of protein at each meal. And after your training, a protein-rich snack within an hour is ideal.

Protein-rich post-training snacks:
- Greek yoghurt with nuts
- A boiled egg and a piece of fruit
- Cottage cheese on a cracker
- A glass of milk or soy milk
- Hummus with vegetables

Plant-based protein
Do you eat no or little meat? No problem. Combine legumes (lentils, chickpeas, beans) with grains (rice, bread) for a complete protein profile. Tofu, tempeh and edamame are also excellent sources.

The hydration factor
Do not forget water. Cartilage is 80% water. Drink at least 1.5-2 litres per day, more if you exercise. A well-hydrated joint moves more smoothly and is better protected.

Action step: Calculate how much protein you ate yesterday (estimate it). Is it enough? If not, add a protein-rich snack today after your training.',
  'nutrition', 15, 3
FROM public.program_weeks pw WHERE pw.week_number = 5;


-- ── WEEK 6: Voeding verdieping ──────────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Omega-3 en vitamine D',
  'Omega-3 and vitamin D',
  'In week 3 heb je de basis van anti-inflammatoire voeding geleerd. Nu gaan we dieper in op twee voedingsstoffen die er echt uitspringen in het onderzoek: omega-3 vetzuren en vitamine D.

Omega-3 vetzuren
Omega-3 is een van de best onderzochte voedingsstoffen bij gewrichtsklachten. Het werkt op meerdere manieren:
- Remt de productie van ontstekingsbevorderende stoffen
- Vermindert ochtendstijfheid
- Kan de behoefte aan pijnstillers verminderen

Bronnen van omega-3:
- Vette vis: 2-3x per week (zalm, makreel, haring, sardines)
- Walnoten: een handvol per dag
- Lijnzaad: 1-2 eetlepels per dag (gemalen, anders neem je het niet op)
- Chiazaad: 1 eetlepel per dag
- Algenolie: de plantaardige variant van visolie

Suppletie overwegen?
Als je geen vis eet, overweeg een omega-3 supplement. Kies een supplement met minimaal 1000mg EPA+DHA per dag. Meer hierover in de supplementen-kennisbank.

Vitamine D: de zonneschijn-vitamine
Vitamine D speelt een rol bij:
- Botgezondheid (essentieel bij gewrichtsklachten)
- Immuunfunctie
- Spiersterkte
- Ontstekingsregulatie

Het probleem: in Nederland krijg je van oktober tot maart te weinig zonlicht om voldoende vitamine D aan te maken. Naar schatting heeft 40-60% van de Nederlanders een tekort.

Bronnen van vitamine D:
- Zonlicht: 15-20 minuten per dag (armen en gezicht bloot) van april tot september
- Vette vis (weer!)
- Eieren
- Verrijkte producten (sommige margarines, melk)

De Gezondheidsraad adviseert 10 microgram (400 IE) per dag als aanvulling, het hele jaar door. Bij een vastgesteld tekort kan je arts een hogere dosering voorschrijven.

Concrete actie: Check of je deze week al 2x vis hebt gegeten. Zo niet, plan een vismaaltijd in. Bekijk ook of je een vitamine D supplement in huis hebt — zo niet, zet het op je boodschappenlijst.',

  'In week 3 you learned the basics of anti-inflammatory nutrition. Now we go deeper into two nutrients that truly stand out in research: omega-3 fatty acids and vitamin D.

Omega-3 fatty acids
Omega-3 is one of the best-researched nutrients for joint issues. It works in multiple ways:
- Inhibits the production of pro-inflammatory substances
- Reduces morning stiffness
- May reduce the need for pain medication

Sources of omega-3:
- Fatty fish: 2-3x per week (salmon, mackerel, herring, sardines)
- Walnuts: a handful per day
- Flaxseed: 1-2 tablespoons per day (ground, otherwise you do not absorb it)
- Chia seeds: 1 tablespoon per day
- Algae oil: the plant-based alternative to fish oil

Consider supplementation?
If you do not eat fish, consider an omega-3 supplement. Choose a supplement with at least 1000mg EPA+DHA per day. More about this in the supplements knowledge base.

Vitamin D: the sunshine vitamin
Vitamin D plays a role in:
- Bone health (essential with joint issues)
- Immune function
- Muscle strength
- Inflammation regulation

The problem: in the Netherlands from October to March you get too little sunlight to produce sufficient vitamin D. An estimated 40-60% of Dutch people are deficient.

Sources of vitamin D:
- Sunlight: 15-20 minutes per day (arms and face exposed) from April to September
- Fatty fish (again!)
- Eggs
- Fortified products (some margarines, milk)

The Health Council recommends 10 micrograms (400 IU) per day as a supplement, year-round. If a deficiency is confirmed, your doctor can prescribe a higher dose.

Action step: Check whether you have eaten fish 2x this week. If not, plan a fish meal. Also check if you have a vitamin D supplement at home — if not, put it on your shopping list.',
  'nutrition', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 6;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegen in week 6',
  'Movement in week 6',
  'Halverwege het programma! Je hebt nu 5 weken consistent bewogen. Laten we even stilstaan bij wat je hebt bereikt, en dan verder bouwen.

Je voortgang checken
Vergelijk je welzijnsscores van week 1 met nu. De meeste deelnemers zien op dit punt verbetering in minimaal 2 van de 4 scores (stijfheid, bewegingsgemak, energie, stemming). Zie je weinig verandering? Dat kan — iedereen reageert anders. Blijf doorgaan, de meeste verbetering komt tussen week 6 en 10.

Deze week: combinatie-oefeningen
Tot nu toe deed je oefeningen die een spiergroep tegelijk trainen. Nu gaan we combineren — dat is functioneler (het lijkt meer op dagelijkse bewegingen) en efficienter.

Oefening 1: Squat met armlift
- Doe een squat, en til bij het omhoogkomen je armen boven je hoofd
- Combineert benen en schouders
- 3 sets van 10

Oefening 2: Lunge (uitvalspas)
- Zet een grote stap naar voren, zak door beide knieen
- Achterste knie bijna op de grond, voorste knie boven de enkel
- Duw terug naar startpositie
- 3 sets van 8 per been
- Houd een stoel vast als dat nodig is voor balans

Oefening 3: Superman
- Lig op je buik, armen gestrekt voor je
- Til tegelijkertijd je rechterarm en linkerbeen van de grond
- Houd 3 seconden, wissel
- 3 sets van 10 (5 per kant)
- Versterkt je hele achterketen

Oefening 4: Wandeling met tempowisselingen
- Wandel 20 minuten, maar wissel elke 3 minuten tussen normaal tempo en stevig doorstappen
- Dit verbetert je cardiovasculaire conditie zonder hardlopen

Weekschema:
- Ma/wo/vr: Combinatie-oefeningen + wandeling
- Di/do/za: Alleen wandeling + rekoefeningen
- Zo: Rust

Concrete actie: Probeer vandaag de lunge. Begin zonder gewicht, met een stoel naast je. Als het te lastig is, maak de stap kleiner.',

  'Halfway through the programme! You have now moved consistently for 5 weeks. Let us take a moment to reflect on what you have achieved, and then keep building.

Checking your progress
Compare your well-being scores from week 1 with now. Most participants see improvement in at least 2 of the 4 scores (stiffness, ease of movement, energy, mood) at this point. See little change? That can happen — everyone responds differently. Keep going, most improvement comes between week 6 and 10.

This week: combination exercises
Until now you did exercises that train one muscle group at a time. Now we combine — this is more functional (it resembles daily movements more) and more efficient.

Exercise 1: Squat with arm raise
- Do a squat, and when coming up lift your arms above your head
- Combines legs and shoulders
- 3 sets of 10

Exercise 2: Lunge
- Take a big step forward, bend both knees
- Back knee almost to the ground, front knee above the ankle
- Push back to starting position
- 3 sets of 8 per leg
- Hold a chair if needed for balance

Exercise 3: Superman
- Lie on your stomach, arms stretched in front of you
- Simultaneously lift your right arm and left leg off the ground
- Hold 3 seconds, switch
- 3 sets of 10 (5 per side)
- Strengthens your entire posterior chain

Exercise 4: Walk with pace changes
- Walk 20 minutes, but alternate every 3 minutes between normal pace and brisk walking
- This improves your cardiovascular fitness without running

Weekly schedule:
- Mon/Wed/Fri: Combination exercises + walk
- Tue/Thu/Sat: Only walk + stretching
- Sun: Rest

Action step: Try the lunge today. Start without weight, with a chair next to you. If it is too challenging, make the step smaller.',
  'exercise', 25, 2
FROM public.program_weeks pw WHERE pw.week_number = 6;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Recepten voor gewrichtsgezondheid',
  'Recipes for joint health',
  'Je weet nu welke voedingsstoffen belangrijk zijn. Maar hoe vertaal je dat naar concrete maaltijden? Hier zijn vijf bewezen receptideeën die boordevol gewrichtsvriendelijke voedingsstoffen zitten.

1. Power-ontbijt: Kurkuma Havermout
Havermout met amandelmelk, 1 theelepel kurkuma, een snuf zwarte peper (versterkt de opname van kurkuma 20x), blauwe bessen en walnoten. Klaar in 5 minuten. Boordevol: omega-3, antioxidanten, vezels.

2. Lunch: Sardine Salade
Sardines uit blik (op olijfolie) op een bedje van rucola, tomaat, komkommer en avocado. Dressing: olijfolie, citroensap, knoflook. Klinkt misschien niet sexy, maar sardines zijn de absolute kampioen omega-3 en vitamine D. En in een goede salade zijn ze heerlijk.

3. Snack: Gouden Melk
Verwarm (plantaardige) melk met kurkuma, gember, kaneel en een beetje honing. Dit is een traditioneel drankje uit India dat al eeuwen gebruikt wordt. De combinatie van kurkuma en gember is krachtig ontstekingsremmend.

4. Avondeten: Gebakken Zalm met Groenten
Zalm in de oven (200 graden, 12-15 minuten) met broccoli, zoete aardappel en knoflook, alles overgoten met olijfolie. Bestrooi met lijnzaad voor extra omega-3. Dit is de ultieme gewrichts-maaltijd.

5. Dessert: Kersen Yoghurt Bowl
Griekse yoghurt met verse of bevroren kersen (of kersensap), donkere chocolade (70%+) en amandelen. Kersen bevatten anthocyaninen — krachtige antioxidanten.

De kookregel
Maak het jezelf makkelijk. Kook in bulk en bewaar porties in de vriezer. Maak zondag een grote pan soep of stoofpot, en je hebt voor drie dagen lunch.

Bekijk de receptenpagina in de app voor meer recepten met automatische boodschappenlijsten.

Concrete actie: Kies een van deze vijf recepten en maak het deze week. Ga naar de receptenpagina in de app voor de volledige recepten met ingredientenlijsten.',

  'You now know which nutrients are important. But how do you translate that to actual meals? Here are five proven recipe ideas packed with joint-friendly nutrients.

1. Power breakfast: Turmeric Oatmeal
Oatmeal with almond milk, 1 teaspoon turmeric, a pinch of black pepper (enhances turmeric absorption 20x), blueberries and walnuts. Ready in 5 minutes. Packed with: omega-3, antioxidants, fibre.

2. Lunch: Sardine Salad
Canned sardines (in olive oil) on a bed of rocket, tomato, cucumber and avocado. Dressing: olive oil, lemon juice, garlic. Might not sound sexy, but sardines are the absolute champion of omega-3 and vitamin D. And in a good salad they are delicious.

3. Snack: Golden Milk
Heat (plant-based) milk with turmeric, ginger, cinnamon and a bit of honey. This is a traditional drink from India that has been used for centuries. The combination of turmeric and ginger is powerfully anti-inflammatory.

4. Dinner: Baked Salmon with Vegetables
Salmon in the oven (200 degrees, 12-15 minutes) with broccoli, sweet potato and garlic, all drizzled with olive oil. Sprinkle with flaxseed for extra omega-3. This is the ultimate joint-health meal.

5. Dessert: Cherry Yoghurt Bowl
Greek yoghurt with fresh or frozen cherries (or cherry juice), dark chocolate (70%+) and almonds. Cherries contain anthocyanins — powerful antioxidants.

The cooking rule
Make it easy on yourself. Cook in bulk and store portions in the freezer. Make a big pot of soup or stew on Sunday, and you have lunch for three days.

Check the recipes page in the app for more recipes with automatic shopping lists.

Action step: Choose one of these five recipes and make it this week. Go to the recipes page in the app for the full recipes with ingredient lists.',
  'nutrition', 15, 3
FROM public.program_weeks pw WHERE pw.week_number = 6;


-- ── WEEK 7: Stress en ontspanning ───────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Stress en je gewrichten',
  'Stress and your joints',
  'In week 2 heb je geleerd dat pijn beinvloed wordt door meer dan alleen je gewricht. Stress is een van de krachtigste versterkers van pijn. In deze module leer je waarom, en wat je eraan kunt doen.

Hoe stress pijn verergert
Als je gestrest bent, gebeurt er van alles in je lichaam:
- Je spieren spannen aan (vooral nek, schouders en rug). Die spanning verhoogt de druk op je gewrichten.
- Je stresshormoon cortisol stijgt. Kortdurend is dat nuttig, maar chronisch verhoogd cortisol verhoogt ontsteking.
- Je zenuwstelsel wordt overgevoelig. Dezelfde prikkel voelt intenser als je gestrest bent.
- Je slaapt slechter. En slechte slaap verlaagt je pijndrempel (week 4).

Het stress-pijn-stress-spiraal
Stress verergert pijn. Meer pijn veroorzaakt meer stress. Meer stress verergert de pijn weer. Dit is een vicieuze cirkel die je bewust moet doorbreken.

Stressoren herkennen
Niet alle stress is slecht. Korte stress (een deadline, een spannende wedstrijd) is normaal en zelfs nuttig. Het probleem is chronische stress — stress die niet stopt.

Veel voorkomende bronnen:
- Werk: hoge werkdruk, conflicten, onzekerheid
- Relaties: spanningen thuis, eenzaamheid
- Gezondheid: zorgen over je klachten, onzekerheid over de toekomst
- Financien: geldzorgen
- Perfectionisme: het gevoel dat je niet genoeg doet

Wat kun je beinvloeden?
Maak twee lijsten:
1. Stressoren die je kunt veranderen (minder taken aannemen, een gesprek aangaan)
2. Stressoren die je niet kunt veranderen (je gewrichtsklachten zelf)

Voor categorie 1: maak een plan om iets te veranderen.
Voor categorie 2: leer ermee omgaan met de technieken uit de volgende module.

Concrete actie: Schrijf je top-3 stressbronnen op. Zet bij elke bron of je het kunt veranderen of niet. Dit is je startpunt voor de volgende module.',

  'In week 2 you learned that pain is influenced by more than just your joint. Stress is one of the most powerful amplifiers of pain. In this module you will learn why, and what you can do about it.

How stress worsens pain
When you are stressed, a lot happens in your body:
- Your muscles tense up (especially neck, shoulders and back). That tension increases pressure on your joints.
- Your stress hormone cortisol rises. Short-term that is useful, but chronically elevated cortisol increases inflammation.
- Your nervous system becomes oversensitive. The same stimulus feels more intense when you are stressed.
- You sleep worse. And poor sleep lowers your pain threshold (week 4).

The stress-pain-stress spiral
Stress worsens pain. More pain causes more stress. More stress worsens pain again. This is a vicious cycle that you must consciously break.

Recognising stressors
Not all stress is bad. Short-term stress (a deadline, an exciting match) is normal and even useful. The problem is chronic stress — stress that does not stop.

Common sources:
- Work: high workload, conflicts, uncertainty
- Relationships: tensions at home, loneliness
- Health: worries about your complaints, uncertainty about the future
- Finances: money worries
- Perfectionism: the feeling that you are not doing enough

What can you influence?
Make two lists:
1. Stressors you can change (take on fewer tasks, have a conversation)
2. Stressors you cannot change (your joint issues themselves)

For category 1: make a plan to change something.
For category 2: learn to cope with the techniques in the next module.

Action step: Write down your top 3 stress sources. Note for each source whether you can change it or not. This is your starting point for the next module.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 7;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Ademhaling en ontspanning',
  'Breathing and relaxation',
  'In week 2 heb je de 4-4-6 ademhaling geleerd. Nu breiden we je ontspanningstoolbox uit met drie extra technieken die bewezen effectief zijn bij stressvermindering en pijnbeheer.

Techniek 1: Bodyscan (10 minuten)
Dit is een mindfulness-techniek waarbij je systematisch je aandacht door je lichaam laat gaan.
- Ga comfortabel liggen of zitten, sluit je ogen
- Begin bij je voeten. Merk op wat je voelt — spanning, warmte, tintelingen
- Verplaats je aandacht langzaam omhoog: kuiten, knieen, bovenbenen, heupen
- Bij elk lichaamsdeel: adem erin en laat de spanning los bij het uitademen
- Ga door naar buik, borst, schouders, armen, handen, nek, gezicht
- Eindig met een paar diepe ademhalingen

Tip: als je gedachten afdwalen (en dat zullen ze), breng je aandacht gewoon terug. Dat is geen falen — dat IS de oefening.

Techniek 2: Progressieve spierontspanning (8 minuten)
- Span een spiergroep aan gedurende 5 seconden, en ontspan dan 10 seconden
- Volgorde: voeten, kuiten, bovenbenen, buik, handen, armen, schouders, gezicht
- Het contrast tussen spanning en ontspanning leert je lichaam het verschil herkennen
- Vooral effectief voor voor het slapengaan

Techniek 3: 5-4-3-2-1 Grounding (3 minuten)
Voor momenten van acute stress of pijn:
- Benoem 5 dingen die je ZIET
- Benoem 4 dingen die je VOELT (textuur van je kleding, stoel onder je)
- Benoem 3 dingen die je HOORT
- Benoem 2 dingen die je RUIKT
- Benoem 1 ding dat je PROEFT

Dit haalt je uit je hoofd en brengt je terug naar het hier en nu. Pijn en stress worden erger door piekeren — deze techniek doorbreekt dat.

Wanneer gebruiken?
- Bodyscan: ''s ochtends of voor het slapen, als dagelijkse routine
- Progressieve spierontspanning: voor het slapen of bij hoge spanning
- 5-4-3-2-1: bij acute stress of een pijnpiek

Concrete actie: Probeer vanavond de bodyscan. Zoek een rustige plek, zet een timer op 10 minuten. Je hoeft niets te doen behalve luisteren naar je lichaam.',

  'In week 2 you learned the 4-4-6 breathing. Now we expand your relaxation toolbox with three extra techniques that are proven effective for stress reduction and pain management.

Technique 1: Body scan (10 minutes)
This is a mindfulness technique where you systematically move your attention through your body.
- Lie or sit comfortably, close your eyes
- Start at your feet. Notice what you feel — tension, warmth, tingling
- Slowly move your attention upward: calves, knees, thighs, hips
- At each body part: breathe into it and release the tension when exhaling
- Continue to abdomen, chest, shoulders, arms, hands, neck, face
- End with a few deep breaths

Tip: if your thoughts wander (and they will), simply bring your attention back. That is not failing — that IS the exercise.

Technique 2: Progressive muscle relaxation (8 minutes)
- Tense a muscle group for 5 seconds, then relax for 10 seconds
- Order: feet, calves, thighs, abdomen, hands, arms, shoulders, face
- The contrast between tension and relaxation teaches your body to recognise the difference
- Especially effective before bedtime

Technique 3: 5-4-3-2-1 Grounding (3 minutes)
For moments of acute stress or pain:
- Name 5 things you SEE
- Name 4 things you FEEL (texture of your clothing, chair beneath you)
- Name 3 things you HEAR
- Name 2 things you SMELL
- Name 1 thing you TASTE

This pulls you out of your head and brings you back to the here and now. Pain and stress get worse through worrying — this technique breaks that cycle.

When to use?
- Body scan: mornings or before bed, as a daily routine
- Progressive muscle relaxation: before bed or during high tension
- 5-4-3-2-1: during acute stress or a pain spike

Action step: Try the body scan tonight. Find a quiet spot, set a timer for 10 minutes. You do not need to do anything except listen to your body.',
  'mindset', 15, 2
FROM public.program_weeks pw WHERE pw.week_number = 7;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegen in week 7',
  'Movement in week 7',
  'Je bent nu voorbij de helft. Je lichaam is sterker en wendbaarder dan 6 weken geleden. Deze week combineren we beweging met de ontspanningstechnieken die je net hebt geleerd.

Mindful bewegen
Het idee is simpel: in plaats van te bewegen terwijl je aan je boodschappenlijst denkt, ga je je volledig focussen op de beweging zelf. Dit combineert de fysieke voordelen van bewegen met de mentale voordelen van mindfulness.

Mindful wandelen (20 minuten):
- Loop in een rustig tempo
- Focus de eerste 5 minuten op je voeten: hoe voelt elke stap? Hiel, voetboog, tenen.
- Focus de volgende 5 minuten op je ademhaling: synchroon met je stappen
- Focus de volgende 5 minuten op je omgeving: wat zie je, hoor je, ruik je?
- De laatste 5 minuten: vrij — merk op hoe je lichaam zich voelt

Krachtoefeningen met ademfocus:
Doe je normale krachtroutine (squats, lunges, bridges, planks) maar voeg toe:
- Adem uit bij de inspanning, adem in bij het ontspannen
- Tel je ademhalingen in plaats van herhalingen
- Pauzeer 3 seconden tussen elke herhaling
- Merk spanning op in lichaamsdelen die niet bij de oefening betrokken zijn — laat die los

Avond stretching als ontspanning:
Combineer je rekoefeningen met de progressieve spierontspanning:
- Rek een spiergroep 30 seconden
- Span de spier daarna 5 seconden aan
- Ontspan en rek opnieuw 30 seconden — je zult merken dat je verder kunt

Dit heet contract-relax stretching en is een van de meest effectieve manieren om je flexibiliteit te verbeteren.

Weekschema:
- Ma/wo/vr: Krachtoefeningen met ademfocus + mindful wandeling
- Di/do: Mindful wandeling + avond stretching
- Za: Langere wandeling (30 min) in de natuur als het kan
- Zo: Rust + bodyscan

Concrete actie: Doe vandaag een mindful wandeling van 15 minuten. Laat je telefoon thuis (of op vliegtuigmodus). Focus op je zintuigen.',

  'You are now past the halfway point. Your body is stronger and more agile than 6 weeks ago. This week we combine movement with the relaxation techniques you have just learned.

Mindful movement
The idea is simple: instead of moving while thinking about your shopping list, you will fully focus on the movement itself. This combines the physical benefits of movement with the mental benefits of mindfulness.

Mindful walking (20 minutes):
- Walk at a calm pace
- Focus the first 5 minutes on your feet: how does each step feel? Heel, arch, toes.
- Focus the next 5 minutes on your breathing: synchronised with your steps
- Focus the next 5 minutes on your surroundings: what do you see, hear, smell?
- The last 5 minutes: free — notice how your body feels

Strength exercises with breathing focus:
Do your normal strength routine (squats, lunges, bridges, planks) but add:
- Breathe out during effort, breathe in when relaxing
- Count your breaths instead of repetitions
- Pause 3 seconds between each repetition
- Notice tension in body parts not involved in the exercise — release it

Evening stretching as relaxation:
Combine your stretching exercises with progressive muscle relaxation:
- Stretch a muscle group for 30 seconds
- Then tense the muscle for 5 seconds
- Relax and stretch again for 30 seconds — you will notice you can go further

This is called contract-relax stretching and is one of the most effective ways to improve your flexibility.

Weekly schedule:
- Mon/Wed/Fri: Strength exercises with breathing focus + mindful walk
- Tue/Thu: Mindful walk + evening stretching
- Sat: Longer walk (30 min) in nature if possible
- Sun: Rest + body scan

Action step: Do a mindful walk of 15 minutes today. Leave your phone at home (or on airplane mode). Focus on your senses.',
  'exercise', 20, 3
FROM public.program_weeks pw WHERE pw.week_number = 7;


-- ── WEEK 8: Bewegen in het dagelijks leven ──────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Ergonomie en dagelijkse hacks',
  'Ergonomics and daily hacks',
  'Je kunt drie keer per week trainen, maar als je de rest van de dag verkeerd zit, staat of beweegt, mis je het grootste deel van het plaatje. In deze module leer je hoe je je dagelijks leven bewegingsvriendelijker maakt.

Zitten: de grootste vijand
De gemiddelde Nederlander zit 9 uur per dag. Dat is schadelijker dan je denkt — niet alleen voor je gewrichten, maar voor je hele lichaam. De oplossing is niet een betere stoel (al helpt dat), maar minder lang achter elkaar zitten.

De 30-30 regel:
- Elke 30 minuten zitten: sta 30 seconden op
- Loop even naar de keuken, doe een paar kniebuigingen, rek je uit
- Zet een timer als je het vergeet

Sta-zit-afwisseling:
- Werk je achter een bureau? Overweeg een sta-bureau of een verhoging voor je laptop
- Wissel elk uur: 45 minuten zitten, 15 minuten staan
- Sta tijdens telefoongesprekken

Tillen en bukken
- Buig door je knieen, niet door je rug
- Houd het voorwerp dicht bij je lichaam
- Draai niet terwijl je tilt — verplaats je voeten
- Te zwaar? Vraag hulp of gebruik een hulpmiddel

Autorijden
- Stel je stoel zo in dat je knieen iets hoger zijn dan je heupen
- Steun je onderrug met een kussentje
- Bij lange ritten: stop elke 45-60 minuten voor een korte wandeling

Traplopen
- Gebruik de trap in plaats van de lift (je bent er klaar voor na 7 weken training!)
- Ga rustig, gebruik de leuning als steun
- Leid met je sterkste been omhoog, met je minder sterke been omlaag

Huishouden als training
- Stofzuigen: maak er lunges van (grote stappen met het apparaat)
- Koken: doe kuitheffen terwijl je aan het aanrecht staat
- Tuinieren: wissel elke 10 minuten van houding
- Boodschappen: draag de tassen in beide handen voor balans

Concrete actie: Implementeer vandaag de 30-30 regel. Zet een timer op je telefoon die elk half uur afgaat. Sta op, beweeg 30 seconden, ga weer zitten. Na een week is het een automatisme.',

  'You can train three times a week, but if you sit, stand or move incorrectly the rest of the day, you are missing the biggest part of the picture. In this module you learn how to make your daily life more movement-friendly.

Sitting: the biggest enemy
The average Dutch person sits 9 hours per day. That is more harmful than you think — not just for your joints, but for your entire body. The solution is not a better chair (though that helps), but sitting for shorter periods.

The 30-30 rule:
- Every 30 minutes of sitting: stand up for 30 seconds
- Walk to the kitchen, do a few squats, stretch
- Set a timer if you forget

Sit-stand alternation:
- Work at a desk? Consider a standing desk or a riser for your laptop
- Alternate every hour: 45 minutes sitting, 15 minutes standing
- Stand during phone calls

Lifting and bending
- Bend through your knees, not your back
- Keep the object close to your body
- Do not twist while lifting — move your feet
- Too heavy? Ask for help or use an aid

Driving
- Adjust your seat so your knees are slightly higher than your hips
- Support your lower back with a small cushion
- On long drives: stop every 45-60 minutes for a short walk

Stair climbing
- Use the stairs instead of the lift (you are ready after 7 weeks of training!)
- Go calmly, use the railing for support
- Lead with your stronger leg going up, with your weaker leg going down

Household as training
- Vacuuming: turn it into lunges (big steps with the appliance)
- Cooking: do calf raises while standing at the counter
- Gardening: change position every 10 minutes
- Shopping: carry bags in both hands for balance

Action step: Implement the 30-30 rule today. Set a timer on your phone that goes off every half hour. Stand up, move for 30 seconds, sit back down. After a week it will be automatic.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 8;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Gewoontes bouwen',
  'Building habits',
  'Je hebt nu 7 weken lang nieuwe gewoontes aangeleerd: bewegen, beter eten, beter slapen, ontspannen. Sommige zijn misschien al automatisch. Andere vragen nog moeite. In deze module leer je hoe je gedragsverandering laat beklijven.

Waarom vallen we terug?
Motivatie is eindig. Die eerste enthousiaste weken zijn geweldig, maar motivatie gaat altijd op en neer. De sleutel is niet meer motivatie — het zijn betere gewoontes.

De gewoonte-loop
Elke gewoonte bestaat uit drie delen:
1. Trigger: wat zet de gewoonte in gang? (Voorbeeld: je alarm gaat)
2. Routine: de gewoonte zelf (Voorbeeld: rekoefeningen doen)
3. Beloning: wat krijg je ervoor terug? (Voorbeeld: je voelt je soepeler)

De truc is om de trigger zo duidelijk mogelijk te maken en de drempel zo laag mogelijk.

Habit stacking
De meest effectieve manier om een nieuwe gewoonte te vormen is door hem te koppelen aan iets dat je al doet:
- "Na mijn ochtendkoffie doe ik 5 minuten rekoefeningen"
- "Als ik thuiskom van werk ga ik eerst 15 minuten wandelen"
- "Tijdens het koken doe ik kuitheffen"
- "Voor ik ga slapen doe ik de ademhalingsoefening"

De 2-minutenregel
Als een gewoonte te groot voelt, maak hem kleiner. Zo klein dat je geen excuus kunt bedenken:
- "Ik doe 1 squat" (in plaats van een hele training)
- "Ik loop tot het einde van de straat" (in plaats van 20 minuten)
- "Ik eet 1 walnoot" (in plaats van een hele maaltijd omgooien)

Het punt is niet de actie zelf, maar het feit dat je de gewoonte bevestigt. 1 squat elke dag is beter dan een perfect schema dat je na twee weken laat vallen.

Terugval is normaal
Je gaat dagen missen. Dat is geen falen — dat is menselijk. De regel: mis nooit twee keer achter elkaar. Een dag missen is een ongelukje. Twee dagen missen is het begin van een nieuwe (slechte) gewoonte.

Concrete actie: Kies je belangrijkste gewoonte uit dit programma en koppel het aan een bestaande trigger met habit stacking. Schrijf de zin op en plak het ergens zichtbaar.',

  'You have now been learning new habits for 7 weeks: moving, eating better, sleeping better, relaxing. Some may already be automatic. Others still take effort. In this module you learn how to make behaviour change stick.

Why do we relapse?
Motivation is finite. Those first enthusiastic weeks are great, but motivation always goes up and down. The key is not more motivation — it is better habits.

The habit loop
Every habit consists of three parts:
1. Trigger: what starts the habit? (Example: your alarm goes off)
2. Routine: the habit itself (Example: doing stretching exercises)
3. Reward: what do you get in return? (Example: you feel more flexible)

The trick is to make the trigger as clear as possible and the threshold as low as possible.

Habit stacking
The most effective way to form a new habit is to attach it to something you already do:
- "After my morning coffee I do 5 minutes of stretching"
- "When I get home from work I first walk for 15 minutes"
- "While cooking I do calf raises"
- "Before I go to sleep I do the breathing exercise"

The 2-minute rule
If a habit feels too big, make it smaller. So small that you cannot think of an excuse:
- "I do 1 squat" (instead of a full workout)
- "I walk to the end of the street" (instead of 20 minutes)
- "I eat 1 walnut" (instead of overhauling an entire meal)

The point is not the action itself, but the fact that you confirm the habit. 1 squat every day is better than a perfect schedule that you drop after two weeks.

Relapse is normal
You will miss days. That is not failure — that is human. The rule: never miss twice in a row. Missing one day is an accident. Missing two days is the beginning of a new (bad) habit.

Action step: Choose your most important habit from this programme and attach it to an existing trigger using habit stacking. Write the sentence down and stick it somewhere visible.',
  'mindset', 15, 2
FROM public.program_weeks pw WHERE pw.week_number = 8;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Bewegen in week 8',
  'Movement in week 8',
  'Week 8 — twee maanden bewegen! Je oefeningen zijn nu serieus. Deze week introduceren we functionele oefeningen: bewegingen die direct vertalen naar je dagelijks leven.

Functionele oefeningen
Het verschil met reguliere krachtoefeningen? Functionele oefeningen trainen bewegingspatronen, niet individuele spieren. Ze maken je beter in de dingen die je elke dag doet: opstaan, traplopen, bukken, tillen.

Oefening 1: Opstaan zonder handen
- Ga zitten op een stoel
- Sta op zonder je handen te gebruiken
- Ga weer zitten, langzaam en gecontroleerd
- 3 sets van 10
- Te makkelijk? Gebruik een lagere stoel of doe het op een been

Oefening 2: Farmer''s walk
- Pak twee zware tassen of flessen water (2-5 kg per hand)
- Loop 1 minuut door je huis met rechte rug en schouders naar achteren
- 3 sets
- Dit traint grip, schouders, core en looppatroon tegelijk

Oefening 3: Stap en reik
- Zet een stap naar voren (lunge-positie)
- Reik met beide handen naar de grond naast je voorste voet
- Kom terug omhoog en wissel van been
- 3 sets van 8 per kant
- Combineert kracht, balans en flexibiliteit

Oefening 4: Deurpost rij
- Ga voor een open deur staan, pak de deurposten vast
- Leun iets naar achteren, armen gestrekt
- Trek jezelf naar de deur toe (roei-beweging)
- 3 sets van 10
- Traint je rugspieren — belangrijk voor houding

Wandeling upgrade:
- 25 minuten met intervallen: 2 minuten normaal, 1 minuut stevig
- Voeg een heuvel of trap toe als dat mogelijk is

Weekschema:
- Ma/wo/vr: Functionele oefeningen + interval wandeling
- Di/do: Mindful wandeling + rekoefeningen
- Za: Langere wandeling of een activiteit die je leuk vindt (fietsen, zwemmen)
- Zo: Rust

Concrete actie: Probeer nu de "opstaan zonder handen" oefening. Hoe makkelijk gaat het? Dit is een van de beste indicatoren van functionele kracht bij gewrichtsklachten.',

  'Week 8 — two months of movement! Your exercises are now serious. This week we introduce functional exercises: movements that directly translate to your daily life.

Functional exercises
The difference with regular strength exercises? Functional exercises train movement patterns, not individual muscles. They make you better at the things you do every day: getting up, climbing stairs, bending, lifting.

Exercise 1: Stand up without hands
- Sit on a chair
- Stand up without using your hands
- Sit back down, slowly and controlled
- 3 sets of 10
- Too easy? Use a lower chair or do it on one leg

Exercise 2: Farmer''s walk
- Grab two heavy bags or water bottles (2-5 kg per hand)
- Walk 1 minute through your house with straight back and shoulders back
- 3 sets
- This trains grip, shoulders, core and walking pattern simultaneously

Exercise 3: Step and reach
- Take a step forward (lunge position)
- Reach with both hands to the ground next to your front foot
- Come back up and switch legs
- 3 sets of 8 per side
- Combines strength, balance and flexibility

Exercise 4: Doorframe row
- Stand in front of an open door, grab the doorframe
- Lean slightly back, arms extended
- Pull yourself toward the door (rowing motion)
- 3 sets of 10
- Trains your back muscles — important for posture

Walk upgrade:
- 25 minutes with intervals: 2 minutes normal, 1 minute brisk
- Add a hill or stairs if possible

Weekly schedule:
- Mon/Wed/Fri: Functional exercises + interval walk
- Tue/Thu: Mindful walk + stretching
- Sat: Longer walk or an activity you enjoy (cycling, swimming)
- Sun: Rest

Action step: Try the "stand up without hands" exercise now. How easy is it? This is one of the best indicators of functional strength for joint issues.',
  'exercise', 25, 3
FROM public.program_weeks pw WHERE pw.week_number = 8;


-- ── WEEK 9-12: Placeholder modules ─────────────────────────────────────────

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Terugblik op je reis',
  'Looking back at your journey',
  'Deze module wordt binnenkort gevuld met uitgebreide content over het herhalen en verdiepen van de belangrijkste lessen uit de eerste 8 weken.',
  'This module will soon be filled with comprehensive content about reviewing and deepening the key lessons from the first 8 weeks.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 9;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Verdiepingsoefeningen',
  'Advanced exercises',
  'Deze module wordt binnenkort gevuld met geavanceerde oefeningen die voortbouwen op alles wat je tot nu toe hebt geleerd.',
  'This module will soon be filled with advanced exercises that build on everything you have learned so far.',
  'exercise', 25, 2
FROM public.program_weeks pw WHERE pw.week_number = 9;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Je omgeving betrekken',
  'Involving your surroundings',
  'Deze module wordt binnenkort gevuld met content over hoe je familie, vrienden en collega''s kunt betrekken bij je programma.',
  'This module will soon be filled with content about how to involve family, friends and colleagues in your programme.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 10;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Communiceren over je behoeften',
  'Communicating your needs',
  'Deze module wordt binnenkort gevuld met praktische communicatietips voor het bespreken van je gewrichtsklachten en behoeften met je omgeving.',
  'This module will soon be filled with practical communication tips for discussing your joint issues and needs with those around you.',
  'mindset', 15, 2
FROM public.program_weeks pw WHERE pw.week_number = 10;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Je persoonlijke plan',
  'Your personal plan',
  'Deze module wordt binnenkort gevuld met een framework om je eigen zelfmanagementplan op te stellen voor na het programma.',
  'This module will soon be filled with a framework for creating your own self-management plan for after the programme.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 11;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Onderhoud en aanpassing',
  'Maintenance and adjustment',
  'Deze module wordt binnenkort gevuld met content over hoe je je beweeg- en leefstijlroutines aanpast aan veranderende omstandigheden.',
  'This module will soon be filled with content about how to adjust your movement and lifestyle routines to changing circumstances.',
  'exercise', 20, 2
FROM public.program_weeks pw WHERE pw.week_number = 11;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Vier je voortgang',
  'Celebrate your progress',
  'Deze module wordt binnenkort gevuld met een terugblik op je 12-weken reis, inclusief het vergelijken van je start- en eindscores.',
  'This module will soon be filled with a review of your 12-week journey, including comparing your start and end scores.',
  'education', 15, 1
FROM public.program_weeks pw WHERE pw.week_number = 12;

INSERT INTO public.program_modules (week_id, title_nl, title_en, content_nl, content_en, module_type, duration_minutes, sort_order)
SELECT pw.id,
  'Vooruit kijken',
  'Looking ahead',
  'Deze module wordt binnenkort gevuld met content over het stellen van nieuwe doelen en het plannen van de komende maanden.',
  'This module will soon be filled with content about setting new goals and planning the months ahead.',
  'mindset', 15, 2
FROM public.program_weeks pw WHERE pw.week_number = 12;
