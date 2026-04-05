-- =============================================
-- Seed: Supplements Content — 8 stoffen
-- ArtroCare supplementen-kennisbank
-- =============================================

DELETE FROM public.supplements;

-- 1. Omega-3 (EPA/DHA)
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Omega-3 (EPA/DHA)',
  'Omega-3 (EPA/DHA)',

  E'Omega-3 vetzuren zijn essentiële vetzuren die je lichaam niet zelf kan aanmaken. De twee belangrijkste vormen zijn EPA (eicosapentaeenzuur) en DHA (docosahexaeenzuur), die vooral voorkomen in vette vis zoals zalm, makreel, haring en sardines. Plantaardige bronnen zoals lijnzaad, chiazaad en walnoten bevatten ALA, een voorloper die je lichaam in beperkte mate kan omzetten naar EPA en DHA.\n\nVolgens de Europese Autoriteit voor Voedselveiligheid (EFSA) draagt EPA/DHA bij aan een normale hartfunctie. Dit effect wordt bereikt bij een dagelijkse inname van minimaal 250 mg EPA en DHA samen. Daarnaast is er groeiend wetenschappelijk onderzoek naar de rol van omega-3 bij het ondersteunen van gewrichtsfunctie en algeheel welzijn.\n\nOmega-3 vetzuren zijn een van de best onderzochte voedingsstoffen. De Gezondheidsraad adviseert twee keer per week vette vis te eten. Als je geen of weinig vis eet, kan een supplement een optie zijn. Kies dan een supplement op basis van visolie of algenolie (de plantaardige variant) met een duidelijke vermelding van het EPA- en DHA-gehalte.\n\nLet op: omega-3 kan een bloedverdunnend effect hebben. Als je bloedverdunners gebruikt (zoals acenocoumarol of warfarine), overleg dan altijd eerst met je arts voordat je start met een omega-3 supplement.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Omega-3 fatty acids are essential fats that your body cannot produce on its own. The two most important forms are EPA (eicosapentaenoic acid) and DHA (docosahexaenoic acid), found primarily in fatty fish such as salmon, mackerel, herring and sardines. Plant-based sources like flaxseed, chia seeds and walnuts contain ALA, a precursor that your body can convert to EPA and DHA in limited amounts.\n\nAccording to the European Food Safety Authority (EFSA), EPA/DHA contributes to normal heart function. This effect is achieved with a daily intake of at least 250 mg of EPA and DHA combined. Additionally, there is growing scientific research into the role of omega-3 in supporting joint function and overall well-being.\n\nOmega-3 fatty acids are among the most researched nutrients. Health authorities recommend eating fatty fish twice a week. If you eat little or no fish, a supplement may be an option. Choose a supplement based on fish oil or algae oil (the plant-based alternative) with clear labelling of EPA and DHA content.\n\nNote: omega-3 may have a blood-thinning effect. If you use blood thinners (such as acenocoumarol or warfarin), always consult your doctor before starting an omega-3 supplement.\n\nDiscuss with your therapist whether this suits your situation.',

  '1000-2000 mg EPA+DHA per dag',
  '1000-2000 mg EPA+DHA per day',
  'Bij de maaltijd, voor betere opname',
  'With a meal, for better absorption',
  ARRAY['Draagt bij aan normale hartfunctie (EU-claim)', 'Bron van essentiële vetzuren', 'Ondersteunt algeheel welzijn'],
  ARRAY['Contributes to normal heart function (EU claim)', 'Source of essential fatty acids', 'Supports overall well-being'],
  'Kan een bloedverdunnend effect hebben. Overleg met je arts bij gebruik van bloedverdunners (acenocoumarol, warfarine).',
  'May have a blood-thinning effect. Consult your doctor if using blood thinners (acenocoumarol, warfarin).',
  'Niet gebruiken bij visallergie (kies algenolie). Voorzichtigheid bij gepland chirurgisch ingrijpen.',
  'Do not use with fish allergy (choose algae oil). Use caution before planned surgery.',
  'strong', 'vetzuren', false,
  'Kies een supplement met keurmerk (GOED, MSC). Bewaar in de koelkast na openen.',
  'Choose a supplement with quality certification. Store in the fridge after opening.'
);

-- 2. Vitamine D3
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Vitamine D3',
  'Vitamin D3',

  E'Vitamine D is een vetoplosbare vitamine die een belangrijke rol speelt bij de opname van calcium en fosfor, essentieel voor sterke botten. Je lichaam maakt vitamine D aan onder invloed van zonlicht (UVB-straling) op de huid. In Nederland is de zonkracht van oktober tot maart echter te zwak om voldoende vitamine D aan te maken. Naar schatting heeft 40-60% van de bevolking een tekort.\n\nVolgens de EFSA draagt vitamine D bij aan het behoud van normale botten en een normale spierfunctie. Dit zijn officieel goedgekeurde EU-gezondheidsclaims. Daarnaast draagt vitamine D bij aan de normale werking van het immuunsysteem.\n\nDe belangrijkste voedingsbronnen zijn vette vis (zalm, haring, makreel), eieren en verrijkte producten zoals margarine en sommige zuivelproducten. De Gezondheidsraad adviseert 10 microgram (400 IE) per dag als aanvulling voor volwassenen tot 70 jaar, en 20 microgram (800 IE) boven de 70 jaar.\n\nVitamine D3 (cholecalciferol) wordt beter opgenomen dan D2 (ergocalciferol). Neem het in bij een maaltijd met vet voor optimale opname. Bij een vastgesteld tekort kan je arts een hogere dosering voorschrijven.\n\nBij gebruik van calciumsupplementen is het verstandig om de combinatie met vitamine D te bespreken met je arts, omdat vitamine D de calciumopname verhoogt.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Vitamin D is a fat-soluble vitamin that plays an important role in the absorption of calcium and phosphorus, essential for strong bones. Your body produces vitamin D when sunlight (UVB radiation) hits your skin. In the Netherlands, however, sun strength from October to March is too weak to produce sufficient vitamin D. An estimated 40-60% of the population is deficient.\n\nAccording to EFSA, vitamin D contributes to the maintenance of normal bones and normal muscle function. These are officially approved EU health claims. Additionally, vitamin D contributes to the normal functioning of the immune system.\n\nThe main dietary sources are fatty fish (salmon, herring, mackerel), eggs and fortified products such as margarine and some dairy products. Health authorities recommend 10 micrograms (400 IU) per day as a supplement for adults up to 70 years, and 20 micrograms (800 IU) above 70 years.\n\nVitamin D3 (cholecalciferol) is better absorbed than D2 (ergocalciferol). Take it with a meal containing fat for optimal absorption. If a deficiency is confirmed, your doctor may prescribe a higher dose.\n\nWhen using calcium supplements, it is wise to discuss the combination with vitamin D with your doctor, as vitamin D increases calcium absorption.\n\nDiscuss with your therapist whether this suits your situation.',

  '10-20 microgram (400-800 IE) per dag',
  '10-20 micrograms (400-800 IU) per day',
  'Bij een maaltijd met vet',
  'With a meal containing fat',
  ARRAY['Draagt bij aan behoud van normale botten (EU-claim)', 'Draagt bij aan normale spierfunctie (EU-claim)', 'Draagt bij aan normaal immuunsysteem (EU-claim)'],
  ARRAY['Contributes to maintenance of normal bones (EU claim)', 'Contributes to normal muscle function (EU claim)', 'Contributes to normal immune function (EU claim)'],
  'Verhoogt calciumopname. Overleg bij gebruik van calciumsupplementen.',
  'Increases calcium absorption. Discuss when using calcium supplements.',
  'Niet meer dan 100 microgram (4000 IE) per dag zonder medisch advies.',
  'Do not exceed 100 micrograms (4000 IU) per day without medical advice.',
  'strong', 'vitaminen', false,
  'Laat bij twijfel je bloedwaarden controleren via je huisarts.',
  'If in doubt, have your blood levels checked by your GP.'
);

-- 3. Magnesium
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Magnesium',
  'Magnesium',

  E'Magnesium is een mineraal dat betrokken is bij meer dan 300 enzymatische processen in je lichaam. Het speelt een rol bij spierfunctie, zenuwfunctie, energieproductie en de aanmaak van eiwitten. Veel mensen krijgen via hun dagelijkse voeding niet voldoende magnesium binnen.\n\nVolgens de EFSA draagt magnesium bij aan een normale spierfunctie. Dit is een officieel goedgekeurde EU-gezondheidsclaim. Daarnaast draagt magnesium bij aan de instandhouding van normale botten, een normale werking van het zenuwstelsel, en een normaal energieleverend metabolisme.\n\nGoede voedingsbronnen van magnesium zijn noten (vooral cashewnoten en amandelen), groene bladgroenten (spinazie, boerenkool), volkoren producten, peulvruchten en donkere chocolade. De aanbevolen dagelijkse hoeveelheid voor volwassenen is 300-400 mg.\n\nEr bestaan verschillende vormen van magnesiumsupplementen. Magnesiumcitraat en magnesiumbisglycinaat worden over het algemeen beter opgenomen dan magnesiumoxide. Magnesiumbisglycinaat wordt vaak aanbevolen voor avondgebruik vanwege het ontspannende effect.\n\nBelangrijk: magnesium kan de opname van bepaalde antibiotica (tetracyclines, quinolonen) verminderen. Neem magnesium minimaal 2 uur gescheiden van deze medicijnen. Bij nierproblemen is voorzichtigheid geboden.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Magnesium is a mineral involved in more than 300 enzymatic processes in your body. It plays a role in muscle function, nerve function, energy production and protein synthesis. Many people do not get sufficient magnesium through their daily diet.\n\nAccording to EFSA, magnesium contributes to normal muscle function. This is an officially approved EU health claim. Additionally, magnesium contributes to the maintenance of normal bones, normal functioning of the nervous system, and normal energy-yielding metabolism.\n\nGood dietary sources of magnesium include nuts (especially cashews and almonds), green leafy vegetables (spinach, kale), wholegrain products, legumes and dark chocolate. The recommended daily amount for adults is 300-400 mg.\n\nThere are different forms of magnesium supplements. Magnesium citrate and magnesium bisglycinate are generally better absorbed than magnesium oxide. Magnesium bisglycinate is often recommended for evening use due to its relaxing effect.\n\nImportant: magnesium can reduce the absorption of certain antibiotics (tetracyclines, quinolones). Take magnesium at least 2 hours apart from these medicines. Caution is needed with kidney problems.\n\nDiscuss with your therapist whether this suits your situation.',

  '300-400 mg per dag',
  '300-400 mg per day',
  '''s Avonds, bij de maaltijd',
  'In the evening, with a meal',
  ARRAY['Draagt bij aan normale spierfunctie (EU-claim)', 'Draagt bij aan instandhouding van normale botten (EU-claim)', 'Draagt bij aan normaal zenuwstelsel (EU-claim)'],
  ARRAY['Contributes to normal muscle function (EU claim)', 'Contributes to maintenance of normal bones (EU claim)', 'Contributes to normal nervous system (EU claim)'],
  'Kan opname van bepaalde antibiotica verminderen (tetracyclines, quinolonen). Neem 2 uur gescheiden.',
  'May reduce absorption of certain antibiotics (tetracyclines, quinolones). Take 2 hours apart.',
  'Voorzichtigheid bij nierproblemen. Hoge doseringen kunnen maag-darmklachten veroorzaken.',
  'Caution with kidney problems. High doses may cause gastrointestinal complaints.',
  'moderate', 'mineralen', false,
  'Begin met een lage dosis en bouw op om maag-darmklachten te voorkomen.',
  'Start with a low dose and build up to prevent gastrointestinal complaints.'
);

-- 4. Curcumine
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Curcumine',
  'Curcumin',

  E'Curcumine is de actieve stof in kurkuma (Curcuma longa), een specerij die al eeuwenlang wordt gebruikt in de Aziatische keuken en traditionele kruidkunde. Het is de stof die kurkuma zijn kenmerkende gele kleur geeft.\n\nEr zijn momenteel geen goedgekeurde EU-gezondheidsclaims voor curcumine. Het is echter een voedingsstof waar veel wetenschappelijk onderzoek naar wordt gedaan. Meerdere studies onderzoeken de eigenschappen van curcumine, en het wetenschappelijk bewijs groeit. Het is belangrijk om te benadrukken dat de resultaten van studies niet automatisch betekenen dat curcumine als supplement dezelfde effecten heeft.\n\nEen bekend kenmerk van curcumine is de lage biobeschikbaarheid: je lichaam neemt het slecht op. Daarom bevatten veel supplementen toevoegingen zoals piperine (zwarte peper-extract) of worden ze aangeboden in een speciale formulering (zoals micellen of fytosomen) om de opname te verbeteren.\n\nKurkuma als specerij in je dagelijkse voeding is een eenvoudige manier om curcumine binnen te krijgen. Combineer het altijd met een beetje zwarte peper en vet (olijfolie) voor betere opname.\n\nBelangrijk: curcumine kan een bloedverdunnend effect hebben en is niet geschikt bij galstenen of galwegaandoeningen. Overleg altijd met je arts als je bloedverdunners gebruikt of galproblemen hebt.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Curcumin is the active compound in turmeric (Curcuma longa), a spice that has been used for centuries in Asian cuisine and traditional herbalism. It is the substance that gives turmeric its characteristic yellow colour.\n\nThere are currently no approved EU health claims for curcumin. However, it is a nutrient that is the subject of extensive scientific research. Multiple studies are investigating the properties of curcumin, and scientific evidence is growing. It is important to emphasise that study results do not automatically mean that curcumin as a supplement has the same effects.\n\nA well-known characteristic of curcumin is its low bioavailability: your body absorbs it poorly. Therefore, many supplements contain additions such as piperine (black pepper extract) or are offered in special formulations (such as micelles or phytosomes) to improve absorption.\n\nTurmeric as a spice in your daily diet is a simple way to get curcumin. Always combine it with a little black pepper and fat (olive oil) for better absorption.\n\nImportant: curcumin may have a blood-thinning effect and is not suitable for gallstones or bile duct disorders. Always consult your doctor if you use blood thinners or have gallbladder problems.\n\nDiscuss with your therapist whether this suits your situation.',

  '500-1000 mg curcumine per dag (met piperine)',
  '500-1000 mg curcumin per day (with piperine)',
  'Bij de maaltijd met vet en zwarte peper',
  'With a meal containing fat and black pepper',
  ARRAY['Voedingsstof met groeiend wetenschappelijk onderzoek', 'Actieve stof uit kurkuma', 'Eeuwenlang gebruikt in traditionele kruidkunde'],
  ARRAY['Nutrient with growing scientific research', 'Active compound from turmeric', 'Used for centuries in traditional herbalism'],
  'Kan bloedverdunnend effect hebben. Niet combineren met bloedverdunners zonder arts te raadplegen.',
  'May have blood-thinning effect. Do not combine with blood thinners without consulting a doctor.',
  'Niet gebruiken bij galstenen of galwegaandoeningen. Niet tijdens zwangerschap in hoge doseringen.',
  'Do not use with gallstones or bile duct disorders. Not in high doses during pregnancy.',
  'moderate', 'plantaardige stoffen', true,
  'Kies een supplement met verbeterde biobeschikbaarheid (piperine, micellen of fytosomen).',
  'Choose a supplement with enhanced bioavailability (piperine, micelles or phytosomes).'
);

-- 5. Collageen (type II)
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Collageen (type II)',
  'Collagen (type II)',

  E'Collageen is het meest voorkomende eiwit in je lichaam en een belangrijk bouwmateriaal van kraakbeen, pezen, banden en huid. Type II collageen is de specifieke vorm die voorkomt in gewrichtskraakbeen.\n\nEr zijn geen goedgekeurde EU-gezondheidsclaims voor collageensupplementen. Collageen wordt gepresenteerd als voedingsstof en eiwitbron. Er lopen diverse wetenschappelijke studies naar de effecten van collageensupplementen, maar het bewijs is nog beperkt en de resultaten zijn wisselend.\n\nJe lichaam maakt zelf collageen aan, mits het voldoende bouwstoffen heeft: aminozuren (uit eiwit), vitamine C, zink en koper. Een gevarieerd dieet met voldoende eiwit ondersteunt de eigen collageenproductie. Traditionele voedingsbronnen zijn botbouillon, kippenhuid en visgelatine.\n\nCollageensupplementen zijn er in twee vormen: gehydrolyseerd collageen (collageen peptiden) en ongedenatureerd type II collageen (UC-II). Deze werken op verschillende manieren en worden in verschillende doseringen gebruikt. Gehydrolyseerd collageen wordt doorgaans in hogere doseringen ingenomen (5-10 gram), terwijl UC-II in veel lagere doseringen wordt gebruikt (40 mg).\n\nCollageensupplementen worden over het algemeen goed verdragen. Er zijn weinig bekende interacties met andere supplementen of medicijnen.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Collagen is the most abundant protein in your body and an important building material for cartilage, tendons, ligaments and skin. Type II collagen is the specific form found in joint cartilage.\n\nThere are no approved EU health claims for collagen supplements. Collagen is presented as a nutrient and protein source. Various scientific studies are ongoing into the effects of collagen supplements, but evidence is still limited and results are mixed.\n\nYour body produces collagen itself, provided it has sufficient building blocks: amino acids (from protein), vitamin C, zinc and copper. A varied diet with sufficient protein supports your own collagen production. Traditional dietary sources include bone broth, chicken skin and fish gelatine.\n\nCollagen supplements come in two forms: hydrolysed collagen (collagen peptides) and undenatured type II collagen (UC-II). These work in different ways and are used in different dosages. Hydrolysed collagen is typically taken in higher doses (5-10 grams), while UC-II is used in much lower doses (40 mg).\n\nCollagen supplements are generally well tolerated. There are few known interactions with other supplements or medicines.\n\nDiscuss with your therapist whether this suits your situation.',

  '40 mg UC-II of 5-10 g gehydrolyseerd collageen per dag',
  '40 mg UC-II or 5-10 g hydrolysed collagen per day',
  'Op een lege maag (UC-II) of bij de maaltijd (gehydrolyseerd)',
  'On an empty stomach (UC-II) or with a meal (hydrolysed)',
  ARRAY['Eiwit en bouwstof van kraakbeen', 'Voedingsstof met lopend onderzoek', 'Over het algemeen goed verdragen'],
  ARRAY['Protein and building block of cartilage', 'Nutrient with ongoing research', 'Generally well tolerated'],
  'Geen bekende significante interacties.',
  'No known significant interactions.',
  'Niet gebruiken bij bekende allergie voor de bron (kip, vis, rund).',
  'Do not use with known allergy to the source (chicken, fish, bovine).',
  'limited', 'eiwitten', true,
  'Combineer met vitamine C voor ondersteuning van de eigen collageenproductie.',
  'Combine with vitamin C to support your own collagen production.'
);

-- 6. Vitamine C
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Vitamine C',
  'Vitamin C',

  E'Vitamine C (ascorbinezuur) is een wateroplosbare vitamine die je lichaam niet zelf kan aanmaken of opslaan. Je hebt daarom dagelijks een nieuwe aanvoer nodig via voeding of suppletie.\n\nVolgens de EFSA draagt vitamine C bij aan de normale collageenvorming voor het normaal functioneren van kraakbeen. Dit is een officieel goedgekeurde EU-gezondheidsclaim die direct relevant is bij gewrichtsklachten. Collageen is het belangrijkste structurele eiwit in kraakbeen, en vitamine C is essentieel voor de aanmaak ervan.\n\nDaarnaast draagt vitamine C bij aan de bescherming van cellen tegen oxidatieve stress, een normaal functionerend immuunsysteem, en een normaal energieleverend metabolisme.\n\nUitstekende voedingsbronnen zijn paprika (de allerbeste bron), kiwi, aardbeien, citrusvruchten (sinaasappel, citroen), broccoli en spruitjes. Met een gevarieerd dieet met voldoende groenten en fruit kun je gemakkelijk aan de aanbevolen hoeveelheid komen.\n\nDe aanbevolen dagelijkse hoeveelheid voor volwassenen is 75 mg. Veel supplementen bevatten hogere doseringen (500-1000 mg). Je lichaam kan maximaal ongeveer 200 mg per keer opnemen; hogere doseringen worden grotendeels via de urine uitgescheiden.\n\nVitamine C is over het algemeen zeer veilig. Zeer hoge doseringen (meer dan 2000 mg per dag) kunnen maag-darmklachten veroorzaken bij gevoelige personen.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Vitamin C (ascorbic acid) is a water-soluble vitamin that your body cannot produce or store on its own. You therefore need a daily fresh supply through diet or supplementation.\n\nAccording to EFSA, vitamin C contributes to normal collagen formation for the normal functioning of cartilage. This is an officially approved EU health claim directly relevant to joint issues. Collagen is the most important structural protein in cartilage, and vitamin C is essential for its production.\n\nAdditionally, vitamin C contributes to the protection of cells from oxidative stress, a normally functioning immune system, and normal energy-yielding metabolism.\n\nExcellent dietary sources include bell peppers (the very best source), kiwi, strawberries, citrus fruits (orange, lemon), broccoli and Brussels sprouts. With a varied diet with sufficient vegetables and fruit, you can easily meet the recommended amount.\n\nThe recommended daily amount for adults is 75 mg. Many supplements contain higher doses (500-1000 mg). Your body can absorb a maximum of approximately 200 mg at a time; higher doses are largely excreted through urine.\n\nVitamin C is generally very safe. Very high doses (more than 2000 mg per day) may cause gastrointestinal complaints in sensitive individuals.\n\nDiscuss with your therapist whether this suits your situation.',

  '75-200 mg per dag (via voeding of supplement)',
  '75-200 mg per day (through diet or supplement)',
  'Verdeeld over de dag, bij de maaltijd',
  'Spread throughout the day, with meals',
  ARRAY['Draagt bij aan normale collageenvorming voor kraakbeen (EU-claim)', 'Draagt bij aan bescherming tegen oxidatieve stress (EU-claim)', 'Draagt bij aan normaal immuunsysteem (EU-claim)'],
  ARRAY['Contributes to normal collagen formation for cartilage (EU claim)', 'Contributes to protection against oxidative stress (EU claim)', 'Contributes to normal immune function (EU claim)'],
  'Geen bekende significante interacties bij normale doseringen.',
  'No known significant interactions at normal dosages.',
  'Zeer hoge doseringen (>2000 mg/dag) kunnen maagklachten veroorzaken. Voorzichtigheid bij nierstenen in de voorgeschiedenis.',
  'Very high doses (>2000 mg/day) may cause stomach complaints. Caution with history of kidney stones.',
  'strong', 'vitaminen', false,
  'Voeding is de beste bron. Een supplement is zelden nodig bij gevarieerde voeding.',
  'Food is the best source. A supplement is rarely needed with a varied diet.'
);

-- 7. Zink
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Zink',
  'Zinc',

  E'Zink is een essentieel sporenelement dat betrokken is bij meer dan 200 enzymatische reacties in je lichaam. Het speelt een rol bij celdeling, eiwitproductie, wondgenezing en het immuunsysteem. Je lichaam kan zink niet opslaan, dus je hebt een dagelijkse aanvoer nodig.\n\nVolgens de EFSA draagt zink bij aan het normaal functioneren van het immuunsysteem. Dit is een officieel goedgekeurde EU-gezondheidsclaim. Daarnaast draagt zink bij aan de bescherming van cellen tegen oxidatieve stress, het in stand houden van normale botten, en een normaal metabolisme van vetzuren.\n\nGoede voedingsbronnen van zink zijn vlees (vooral rund en lam), schaaldieren (oesters zijn de rijkste bron), pompoenpitten, cashewnoten, kikkererwten en volkoren producten. Plantaardige bronnen bevatten fytaat, dat de opname van zink kan verminderen. Vegetariërs en veganisten hebben daarom mogelijk een hogere behoefte.\n\nDe aanbevolen dagelijkse hoeveelheid is 7-9 mg voor volwassenen. Zinksupplementen zijn beschikbaar in verschillende vormen; zinkpicolinaat en zinkbisglycinaat worden over het algemeen goed opgenomen.\n\nBelangrijk: langdurig gebruik van hoge doseringen zink (meer dan 25 mg/dag) kan de koperopname verstoren. Neem zink niet tegelijk in met ijzersupplementen, omdat ze elkaars opname kunnen verminderen.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Zinc is an essential trace element involved in more than 200 enzymatic reactions in your body. It plays a role in cell division, protein production, wound healing and the immune system. Your body cannot store zinc, so you need a daily supply.\n\nAccording to EFSA, zinc contributes to the normal functioning of the immune system. This is an officially approved EU health claim. Additionally, zinc contributes to the protection of cells from oxidative stress, maintaining normal bones, and normal metabolism of fatty acids.\n\nGood dietary sources of zinc include meat (especially beef and lamb), shellfish (oysters are the richest source), pumpkin seeds, cashew nuts, chickpeas and wholegrain products. Plant-based sources contain phytate, which can reduce zinc absorption. Vegetarians and vegans may therefore have a higher requirement.\n\nThe recommended daily amount is 7-9 mg for adults. Zinc supplements are available in different forms; zinc picolinate and zinc bisglycinate are generally well absorbed.\n\nImportant: prolonged use of high doses of zinc (more than 25 mg/day) can disrupt copper absorption. Do not take zinc at the same time as iron supplements, as they can reduce each other''s absorption.\n\nDiscuss with your therapist whether this suits your situation.',

  '7-15 mg per dag',
  '7-15 mg per day',
  'Bij de maaltijd (vermindert maagklachten)',
  'With a meal (reduces stomach complaints)',
  ARRAY['Draagt bij aan normaal functioneren immuunsysteem (EU-claim)', 'Draagt bij aan bescherming tegen oxidatieve stress (EU-claim)', 'Draagt bij aan instandhouding normale botten (EU-claim)'],
  ARRAY['Contributes to normal immune function (EU claim)', 'Contributes to protection against oxidative stress (EU claim)', 'Contributes to maintenance of normal bones (EU claim)'],
  'Kan koperopname verstoren bij hoge doseringen. Niet tegelijk innemen met ijzersupplementen.',
  'May disrupt copper absorption at high doses. Do not take at the same time as iron supplements.',
  'Niet meer dan 25 mg per dag zonder medisch advies. Voorzichtigheid bij nierinsufficiëntie.',
  'Do not exceed 25 mg per day without medical advice. Caution with kidney insufficiency.',
  'moderate', 'mineralen', true,
  'Kies zinkpicolinaat of zinkbisglycinaat voor betere opname.',
  'Choose zinc picolinate or zinc bisglycinate for better absorption.'
);

-- 8. Boswellia
INSERT INTO public.supplements (
  name_nl, name_en, description_nl, description_en,
  dosage_nl, dosage_en, timing_nl, timing_en,
  benefits_nl, benefits_en,
  interactions_nl, interactions_en,
  contraindications_nl, contraindications_en,
  evidence_level, category, is_premium,
  safety_notes_nl, safety_notes_en
) VALUES (
  'Boswellia',
  'Boswellia',

  E'Boswellia (Boswellia serrata), ook wel Indische wierook genoemd, is een harsextract uit de boswelliaboom die voorkomt in India, Afrika en het Midden-Oosten. Het wordt al eeuwenlang gebruikt in de Ayurvedische traditie en is een van de oudst bekende kruiden in die traditie.\n\nEr zijn geen goedgekeurde EU-gezondheidsclaims voor boswellia. Het wordt gepresenteerd als een traditioneel kruid waar momenteel wetenschappelijk onderzoek naar loopt. Er zijn diverse studies gepubliceerd die de eigenschappen van boswelliazuren (de actieve stoffen) onderzoeken, maar het bewijs is nog onvoldoende voor officiële gezondheidsclaims.\n\nDe actieve stoffen in boswellia worden boswelliazuren (AKBA) genoemd. Supplementen worden vaak gestandaardiseerd op het gehalte aan deze stoffen. Kies bij voorkeur een supplement dat gestandaardiseerd is op minimaal 30% boswelliazuren.\n\nBoswellia wordt over het algemeen goed verdragen. Milde maag-darmklachten kunnen voorkomen bij sommige mensen. Het gebruik van boswellia in combinatie met NSAID''s (ontstekingsremmende pijnstillers zoals ibuprofen, diclofenac of naproxen) dient met voorzichtigheid te gebeuren. Overleg altijd met je arts als je NSAID''s gebruikt.\n\nNiet gebruiken tijdens zwangerschap of borstvoeding vanwege onvoldoende veiligheidsgegevens.\n\nOverleg met je therapeut of dit bij jouw situatie past.',

  E'Boswellia (Boswellia serrata), also known as Indian frankincense, is a resin extract from the boswellia tree found in India, Africa and the Middle East. It has been used for centuries in Ayurvedic tradition and is one of the oldest known herbs in that tradition.\n\nThere are no approved EU health claims for boswellia. It is presented as a traditional herb currently under scientific investigation. Various studies have been published examining the properties of boswellic acids (the active compounds), but evidence is not yet sufficient for official health claims.\n\nThe active substances in boswellia are called boswellic acids (AKBA). Supplements are often standardised to the content of these substances. Preferably choose a supplement standardised to at least 30% boswellic acids.\n\nBoswellia is generally well tolerated. Mild gastrointestinal complaints may occur in some people. The use of boswellia in combination with NSAIDs (anti-inflammatory painkillers such as ibuprofen, diclofenac or naproxen) should be done with caution. Always consult your doctor if you use NSAIDs.\n\nDo not use during pregnancy or breastfeeding due to insufficient safety data.\n\nDiscuss with your therapist whether this suits your situation.',

  '300-500 mg gestandaardiseerd extract per dag',
  '300-500 mg standardised extract per day',
  'Bij de maaltijd, verdeeld over 2-3 doses',
  'With a meal, divided into 2-3 doses',
  ARRAY['Traditioneel kruid met eeuwenlange geschiedenis', 'Actief onderzoek naar boswelliazuren', 'Over het algemeen goed verdragen'],
  ARRAY['Traditional herb with centuries of history', 'Active research into boswellic acids', 'Generally well tolerated'],
  'Voorzichtigheid bij combinatie met NSAID''s (ibuprofen, diclofenac, naproxen). Overleg met je arts.',
  'Caution when combining with NSAIDs (ibuprofen, diclofenac, naproxen). Consult your doctor.',
  'Niet gebruiken tijdens zwangerschap of borstvoeding. Niet bij bekende allergie voor wierook of harsproducten.',
  'Do not use during pregnancy or breastfeeding. Not with known allergy to frankincense or resin products.',
  'limited', 'plantaardige stoffen', true,
  'Kies een supplement gestandaardiseerd op minimaal 30% boswelliazuren (AKBA).',
  'Choose a supplement standardised to at least 30% boswellic acids (AKBA).'
);
