import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'public', 'downloads');
fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 60 });
const outputPath = path.join(outputDir, '7-dagen-beweegplan.pdf');
doc.pipe(fs.createWriteStream(outputPath));

const BLUE = '#2563EB';
const DARK = '#1f2937';
const GRAY = '#6b7280';
const LIGHT_BLUE = '#eff6ff';

function drawHeader(doc, dayNum, title) {
  doc.addPage();
  // Blue top bar
  doc.rect(0, 0, doc.page.width, 6).fill(BLUE);
  doc.moveDown(1.5);
  // Day badge
  doc.roundedRect(60, doc.y, 90, 32, 6).fill(BLUE);
  doc.fill('#ffffff').fontSize(14).font('Helvetica-Bold')
    .text(`Dag ${dayNum}`, 60, doc.y + 8, { width: 90, align: 'center' });
  doc.moveDown(2.5);
  doc.fill(DARK).fontSize(22).font('Helvetica-Bold').text(title, 60);
  doc.moveDown(0.3);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.moveDown(1);
}

function drawExercise(doc, num, name, setsReps, line1, line2) {
  const startY = doc.y;
  // Number circle
  doc.circle(78, startY + 12, 14).fill(LIGHT_BLUE);
  doc.fill(BLUE).fontSize(13).font('Helvetica-Bold')
    .text(String(num), 66, startY + 5, { width: 24, align: 'center' });
  // Exercise content
  const xContent = 102;
  doc.fill(DARK).fontSize(14).font('Helvetica-Bold').text(name, xContent, startY);
  doc.fill(BLUE).fontSize(11).font('Helvetica').text(setsReps, xContent, doc.y + 2);
  doc.fill(GRAY).fontSize(10.5).font('Helvetica').text(`${line1} ${line2}`, xContent, doc.y + 3, { width: 420 });
  doc.moveDown(1.8);
}

// ─── PAGE 1: COVER ──────────────────────────
doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLUE);

// Logo text
doc.fill('#ffffff').fontSize(18).font('Helvetica-Bold')
  .text('ArtroCare', 60, 180, { align: 'center' });

doc.moveDown(3);
doc.fill('#ffffff').fontSize(36).font('Helvetica-Bold')
  .text('7-Dagen Artrose\nBeweegplan', { align: 'center', lineGap: 6 });

doc.moveDown(1.5);
doc.fill('#bfdbfe').fontSize(16).font('Helvetica')
  .text('Dagelijks 15 minuten bewegen\nvoor soepelere gewrichten', { align: 'center', lineGap: 4 });

doc.moveDown(1);
doc.moveTo(doc.page.width / 2 - 40, doc.y).lineTo(doc.page.width / 2 + 40, doc.y)
  .strokeColor('#ffffff').strokeOpacity(0.4).lineWidth(1).stroke();
doc.strokeOpacity(1);

doc.moveDown(1);
doc.fill('#93c5fd').fontSize(12).font('Helvetica')
  .text('Geen speciale apparatuur nodig', { align: 'center' });

// Bottom
doc.fill('#ffffff').fontSize(11).font('Helvetica')
  .text('artrocare.app', 60, doc.page.height - 80, { align: 'center' });

doc.fill('#bfdbfe').fontSize(9).font('Helvetica')
  .text('Begeleidingsprogramma bij gewrichtsklachten', 60, doc.page.height - 60, { align: 'center' });

// ─── PAGE 2: INTRODUCTIE ────────────────────
doc.addPage();
doc.rect(0, 0, doc.page.width, 6).fill(BLUE);
doc.moveDown(2);

doc.fill(DARK).fontSize(24).font('Helvetica-Bold')
  .text('Welkom bij je Beweegplan');
doc.moveDown(1);
doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
doc.moveDown(1);

doc.fill(GRAY).fontSize(11.5).font('Helvetica')
  .text(
    'Dit beweegplan is ontworpen voor mensen met gewrichtsklachten die willen starten met dagelijks bewegen. ' +
    'Het programma duurt 7 dagen, met elke dag 15 minuten eenvoudige oefeningen. Je hebt geen speciale apparatuur nodig \u2014 ' +
    'alleen een stoel en een muur.\n\n' +
    'De oefeningen richten zich op het versterken en soepel houden van je knie\u00ebn en heupen. ' +
    'We bouwen geleidelijk op: de eerste dagen zijn rustig, halverwege de week wordt het iets intensiever, ' +
    'en aan het eind van de week daag je jezelf een beetje meer uit.\n\n' +
    'Luister altijd naar je lichaam. Lichte spierpijn na het bewegen is normaal en verdwijnt meestal binnen 24-48 uur. ' +
    'Scherpe pijn tijdens een oefening? Stop en sla die oefening over.',
    { width: 475, lineGap: 4 }
  );

doc.moveDown(2);

// Tip box
const tipY = doc.y;
doc.roundedRect(60, tipY, 475, 80, 8).fill(LIGHT_BLUE);
doc.fill(BLUE).fontSize(12).font('Helvetica-Bold').text('\u2728 Tip', 80, tipY + 14);
doc.fill(DARK).fontSize(10.5).font('Helvetica')
  .text(
    'Kies een vast moment op de dag voor je oefeningen \u2014 bijvoorbeeld \u2019s ochtends na het opstaan of \u2019s middags na de lunch. ' +
    'Een vaste routine maakt het makkelijker om vol te houden.',
    80, tipY + 32, { width: 435, lineGap: 3 }
  );

doc.moveDown(5);
// Legend
doc.fill(GRAY).fontSize(10).font('Helvetica')
  .text('Moeilijkheidsgraad: \u2605 Makkelijk (dag 1-2)  \u2605\u2605 Gemiddeld (dag 3-5)  \u2605\u2605\u2605 Uitdagend (dag 6-7)', 60, doc.y, { width: 475, align: 'center' });

// ─── PAGES 3-9: DAG 1 t/m 7 ─────────────────

const DAYS = [
  {
    day: 1, title: 'Soepel worden  \u2605',
    exercises: [
      ['Zittende kniestrekking', '2 x 10 per been', 'Zit op een stoel, strek je been langzaam naar voren tot het knie gestrekt is.', 'Houd 2 seconden vast en laat langzaam zakken.'],
      ['Heupbuiging staand', '2 x 8 per been', 'Sta achter een stoel en til je knie naar je borst.', 'Houd de stoel vast voor balans.'],
      ['Enkelcirkels', '2 x 10 per voet', 'Zit op een stoel en draai je voet in cirkels.', 'Doe 10 rondjes met de klok mee, dan 10 tegen de klok in.'],
    ],
  },
  {
    day: 2, title: 'Mobiliteit opbouwen  \u2605',
    exercises: [
      ['Hielschuivers', '2 x 10 per been', 'Lig op je rug, schuif je hiel naar je billen door je knie te buigen.', 'Houd even vast en schuif langzaam terug.'],
      ['Staande heupabductie', '2 x 8 per been', 'Sta naast een stoel, beweeg je been zijwaarts van je lichaam af.', 'Houd je romp recht en beweeg gecontroleerd.'],
      ['Kuitstrekking aan de muur', '2 x 20 sec per been', 'Plaats je handen tegen de muur, zet \u00e9\u00e9n voet naar achteren.', 'Duw je achterhiel in de grond tot je een rek voelt in je kuit.'],
    ],
  },
  {
    day: 3, title: 'Kracht beginnen  \u2605\u2605',
    exercises: [
      ['Mini-squats met stoel', '2 x 10', 'Ga voor een stoel staan, zak alsof je gaat zitten en kom weer omhoog.', 'Raak de stoel net aan maar ga niet volledig zitten.'],
      ['Bruggetje', '2 x 10', 'Lig op je rug, voeten plat op de grond. Til je heupen op.', 'Knijp je bilspieren samen bovenin en laat langzaam zakken.'],
      ['Zittende beenheffer', '2 x 8 per been', 'Zit op een stoel, strek je been en houd 3 seconden vast.', 'Laat langzaam zakken zonder de grond te raken.'],
    ],
  },
  {
    day: 4, title: 'Balans en stabiliteit  \u2605\u2605',
    exercises: [
      ['Op \u00e9\u00e9n been staan', '3 x 20 sec per been', 'Sta naast een stoel en til \u00e9\u00e9n voet van de grond.', 'Gebruik de stoel alleen als je je balans verliest.'],
      ['Zijwaartse stap', '2 x 10 per kant', 'Zet een stap opzij, buig licht door je knie\u00ebn en stap terug.', 'Houd je rug recht en kijk vooruit.'],
      ['Tenen heffen', '2 x 12', 'Sta achter een stoel, kom op je tenen omhoog.', 'Houd 2 seconden vast bovenin en laat langzaam zakken.'],
    ],
  },
  {
    day: 5, title: 'Combinatie-oefeningen  \u2605\u2605',
    exercises: [
      ['Stoel-squat met armheffen', '2 x 10', 'Zak naar de stoel en til tegelijk je armen naar voren.', 'Kom omhoog en laat je armen weer zakken.'],
      ['Staande kniebuiging', '2 x 10 per been', 'Sta op \u00e9\u00e9n been en buig je knie van het andere been naar achteren.', 'Probeer je hiel richting je bil te brengen.'],
      ['Wandelen op de plaats', '2 x 1 minuut', 'Loop op de plaats met hoge knie\u00ebn.', 'Zwaai je armen mee en houd een stevig tempo aan.'],
    ],
  },
  {
    day: 6, title: 'Kracht verdiepen  \u2605\u2605\u2605',
    exercises: [
      ['Wandsit', '3 x 15 sec', 'Leun met je rug tegen de muur en zak tot je knie\u00ebn 90 graden zijn.', 'Houd deze positie aan. Adem rustig door.'],
      ['Stap-op (traptreden)', '2 x 8 per been', 'Gebruik de onderste traptrede. Stap op met \u00e9\u00e9n been en stap weer af.', 'Duw af vanuit je hiel, niet je tenen.'],
      ['Liggende beenheffer zijwaarts', '2 x 10 per been', 'Lig op je zij, til je bovenste been langzaam omhoog.', 'Houd je been gestrekt en laat langzaam zakken.'],
    ],
  },
  {
    day: 7, title: 'Alles samen  \u2605\u2605\u2605',
    exercises: [
      ['Squat met 3 sec pauze', '2 x 8', 'Zak in een squat en houd 3 seconden onderaan vast.', 'Kom gecontroleerd omhoog. Gebruik de stoel als backup.'],
      ['Uitvalspas naar voren', '2 x 6 per been', 'Doe een grote stap naar voren, buig beide knie\u00ebn tot 90 graden.', 'Duw jezelf terug naar de startpositie.'],
      ['Bruggetje met 1 been', '2 x 6 per been', 'Lig op je rug, strek \u00e9\u00e9n been en til je heupen op met het andere.', 'Wissel na elke set van been.'],
    ],
  },
];

for (const day of DAYS) {
  drawHeader(doc, day.day, day.title);
  for (let i = 0; i < day.exercises.length; i++) {
    const [name, setsReps, line1, line2] = day.exercises[i];
    drawExercise(doc, i + 1, name, setsReps, line1, line2);
  }
  // Bottom reminder
  doc.fill(GRAY).fontSize(9).font('Helvetica')
    .text('\u23f1 Totale tijd: ~15 minuten  \u00b7  Luister naar je lichaam  \u00b7  artrocare.app', 60, doc.page.height - 50, { width: 475, align: 'center' });
}

// ─── PAGE 10: CTA ──────────────────────────
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLUE);

doc.fill('#ffffff').fontSize(14).font('Helvetica')
  .text('\u2705 7-Dagen Beweegplan voltooid!', 60, 200, { align: 'center' });

doc.moveDown(2);
doc.fill('#ffffff').fontSize(30).font('Helvetica-Bold')
  .text('Klaar voor meer?', { align: 'center' });

doc.moveDown(1);
doc.fill('#bfdbfe').fontSize(14).font('Helvetica')
  .text(
    'Start het volledige 12-weken ArtroCare programma.\nPersoonlijk oefenprogramma, voedingsadvies, slaapcoaching,\npijneducatie en begeleiding door je fysiotherapeut.',
    { align: 'center', lineGap: 4 }
  );

doc.moveDown(2);

// Price badge
const badgeY = doc.y;
doc.roundedRect(doc.page.width / 2 - 120, badgeY, 240, 70, 12).fill('#ffffff');
doc.fill(GRAY).fontSize(11).font('Helvetica')
  .text('Founding members betalen slechts', doc.page.width / 2 - 120, badgeY + 12, { width: 240, align: 'center' });
doc.fill(BLUE).fontSize(32).font('Helvetica-Bold')
  .text('\u20ac97', doc.page.width / 2 - 120, badgeY + 30, { width: 240, align: 'center' });

doc.moveDown(5);
doc.fill('#ffffff').fontSize(16).font('Helvetica-Bold')
  .text('Ga naar artrocare.app', { align: 'center' });

doc.moveDown(1);
doc.fill('#93c5fd').fontSize(11).font('Helvetica')
  .text('De eerste 50 deelnemers krijgen founding member toegang.', { align: 'center' });

// Footer
doc.fill('#bfdbfe').fontSize(9).font('Helvetica')
  .text('ArtroCare \u00b7 Begeleidingsprogramma bij gewrichtsklachten \u00b7 artrocare.app', 60, doc.page.height - 50, { align: 'center', width: 475 });

// ─── DONE ──────────────────────────────────
doc.end();
console.log(`PDF generated: ${outputPath}`);
