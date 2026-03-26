import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, CheckCircle, TrendingUp, Dumbbell, BookOpen, Apple,
  Star, ArrowRight, Shield, Moon, Brain, Menu, X, Sparkles, Pill, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

const PILLARS = [
  { icon: Dumbbell, label: 'Bewegen',       color: 'text-blue-600 bg-blue-50' },
  { icon: BookOpen, label: 'Educatie',      color: 'text-amber-600 bg-amber-50' },
  { icon: Apple,    label: 'Voeding',       color: 'text-orange-600 bg-orange-50' },
  { icon: Moon,     label: 'Slaap',         color: 'text-indigo-600 bg-indigo-50' },
  { icon: Brain,    label: 'Mentaal',       color: 'text-purple-600 bg-purple-50' },
  { icon: Pill,     label: 'Medicatie & supplementen', color: 'text-rose-600 bg-rose-50' },
];

const BENEFITS = [
  {
    icon: Dumbbell,
    title: 'Bewegen: effectief oefenprogramma',
    desc: 'Gebaseerd op de KNGF-richtlijn én internationaal erkende en effectieve programma\'s die in meer dan 30 landen worden toegepast. Gericht op kracht, balans én pijnreductie — aangepast aan jouw niveau.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: BookOpen,
    title: 'Educatie: begrijp je aandoening',
    desc: 'Educatie is een onmisbaar onderdeel van effectieve artrosezorg. Artrocare biedt korte, begrijpelijke lessen over artrose, pijn en leefstijl. Want wie zijn aandoening begrijpt, kan er beter mee omgaan.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Apple,
    title: 'Voeding die ontstekingen beïnvloedt',
    desc: 'Welke voedingspatronen helpen bij artrose? Wat zegt het onderzoek over omega-3, vitamine D en ontstekingsremmende voeding? Praktische adviezen, geen dieet.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Moon,
    title: 'Slaap & herstel',
    desc: 'Slechte slaap versterkt pijnbeleving. Artrocare helpt je begrijpen hoe slaap en herstel bijdragen aan minder pijn en meer energie overdag.',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    icon: Brain,
    title: 'Mentaal welzijn',
    desc: 'Pijn is niet alleen lichamelijk. Artrocare besteedt aandacht aan hoe gedachten, stress en stemming je pijnbeleving beïnvloeden — met praktische handvatten.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Pill,
    title: 'Medicatie & supplementen',
    desc: 'Wat helpt wel, wat helpt niet? Artrocare geeft inzicht in veelgebruikte pijnmedicatie en supplementen bij artrose — zodat je goed geïnformeerd het gesprek aangaat met je arts of therapeut.',
    color: 'text-rose-600 bg-rose-50',
  },
];

const TESTIMONIALS = [
  {
    text: 'Na drie weken merk ik echt verschil bij het traplopen. De oefeningen zijn uitdagend maar haalbaar.',
    name: 'Marieke, 58',
    condition: 'Knieartrose',
    initials: 'M',
  },
  {
    text: 'Eindelijk een app die uitlegt waaróm ik iets moet doen. Dat motiveert veel meer.',
    name: 'Hans, 64',
    condition: 'Heupartrose',
    initials: 'H',
  },
  {
    text: 'Mijn fysiotherapeut kan nu precies zien hoe het met me gaat. Dat geeft een veilig gevoel.',
    name: 'Ria, 71',
    condition: 'Knieartrose',
    initials: 'R',
  },
];

const STEPS = [
  { step: '1', title: 'Uitnodiging ontvangen', desc: 'Je fysiotherapeut stuurt je een persoonlijke uitnodigingslink.' },
  { step: '2', title: 'Account aanmaken', desc: 'In 2 minuten een account — gratis voor patiënten.' },
  { step: '3', title: 'Programma starten', desc: 'Jouw oefenprogramma staat klaar. Begin vandaag nog.' },
];

const FOR_WHO = [
  { title: 'Milde klachten', desc: 'Net de diagnose artrose of milde klachten? Artrocare helpt je vroeg de juiste gewoonten op te bouwen.' },
  { title: 'Langdurige artrose', desc: 'Al jaren last van artrose? Artrocare biedt structuur, inzicht en begeleiding om actief te blijven.' },
  { title: 'Voorbereiding op operatie', desc: 'Een knie- of heupoperatie in zicht? Een goede voorbereiding verbetert aantoonbaar het herstel.' },
  { title: 'Herstel na operatie', desc: 'Nazorg na een prothese? Artrocare begeleidt je stap voor stap terug naar optimale functie en dagelijks bewegen.' },
];

export default function LandingPatient() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
            <Heart className="w-5 h-5 text-blue-600" /> Artrocare
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#aanpak" className="hover:text-blue-600">Onze aanpak</a>
            <a href="#voordelen" className="hover:text-blue-600">Alles wat je krijgt</a>
            <a href="#voor-wie" className="hover:text-blue-600">Voor wie</a>
            <a href="#ervaringen" className="hover:text-blue-600">Ervaringen</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="outline" size="sm">Inloggen</Button></Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            <a href="#aanpak" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Onze aanpak</a>
            <a href="#voordelen" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Alles wat je krijgt</a>
            <a href="#voor-wie" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Voor wie</a>
            <Link to="/login"><Button size="sm" className="w-full mt-2">Inloggen</Button></Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
            <Sparkles className="w-4 h-4" /> Gebaseerd op Nederlandse en internationaal erkende effectieve programma's
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Artrose aanpakken.<br />
            <span className="text-blue-600">De hele mens centraal.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Artrocare is anders dan andere programma's. Wij begeleiden je niet alleen bij bewegen — maar ook bij educatie, voeding, slaap, mentaal welzijn en medicatie. Altijd onder begeleiding van een deskundige fysiotherapeut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                Begin vandaag gratis <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#aanpak">
              <Button size="lg" variant="outline" className="text-base px-8">Bekijk onze aanpak</Button>
            </a>
          </div>
          <p className="text-sm text-gray-400">Gratis voor patiënten · Geen creditcard · AVG-compliant</p>
        </div>

        {/* 6 pijlers */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-3 gap-3">
          {PILLARS.map(p => (
            <div key={p.label} className={`rounded-xl ${p.color} px-4 py-3 flex items-center gap-2 font-medium text-sm`}>
              <p.icon className="w-4 h-4 flex-shrink-0" /> {p.label}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto text-center">
          Artrocare is de eerste Nederlandse artrose-app die al deze pijlers combineert in één programma — begeleid door jouw fysiotherapeut.
        </p>
      </section>

      {/* WAAROM ANDERS — de differentiator */}
      <section id="aanpak" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Waarom Artrocare anders is</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              De meeste programma's richten zich op één onderdeel. Artrocare niet.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 bg-gray-50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">Andere programma's</h3>
                <ul className="space-y-2">
                  {['Alleen oefeningen', 'Geen aandacht voor educatie', 'Geen leefstijlbegeleiding', 'Statisch programma'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-4 h-4 text-gray-300 flex-shrink-0">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 ring-2 ring-blue-100 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Artrocare
              </div>
              <CardContent className="p-6 space-y-3 mt-2">
                <h3 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">De hele mens centraal</h3>
                <ul className="space-y-2">
                  {[
                    'Bewegen + educatie + leefstijl',
                    'Voeding, slaap & mentaal welzijn',
                    'Medicatie & supplementen inzicht',
                    'Continu bijgewerkt op basis van nieuwste onderzoeken',
                    'Altijd begeleid door jouw fysiotherapeut',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-blue-100 bg-blue-50/40">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800 text-sm">Altijd up-to-date</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  De wetenschap rondom artrose ontwikkelt zich snel. Artrocare volgt de nieuwste onderzoeken en past het programma continu aan. Jij profiteert altijd van de meest actuele inzichten — zonder dat je daar iets voor hoeft te doen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* VOOR WIE */}
      <section id="voor-wie" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Voor iedereen met artroseklachten</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Of je nu net de diagnose hebt gekregen of al jaren last hebt — Artrocare past zich aan jouw situatie aan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FOR_WHO.map(item => (
              <div key={item.title} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-5">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800 font-medium">Altijd onder begeleiding van een deskundige fysiotherapeut</p>
            <p className="text-sm text-blue-700 mt-1">Artrocare is geen vervanging voor professionele zorg — het is een versterking ervan. Jouw fysiotherapeut blijft de regie houden.</p>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Alles wat je nodig hebt</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Zes pijlers. Één programma. Begeleid door jouw therapeut.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <Card key={b.title} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${b.color}`}>
                    <b.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section id="hoe-het-werkt" className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Hoe het werkt</h2>
          <p className="text-gray-500 mb-12">Je bent in drie stappen aan de slag.</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {STEPS.map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
            <strong>Nog geen uitnodiging ontvangen?</strong> Vraag je fysiotherapeut om je toegang te geven tot Artrocare, of{' '}
            <Link to="/voor-fysiotherapeuten" className="underline">laat hem/haar kennismaken met de app</Link>.
          </div>
        </div>
      </section>

      {/* ERVARINGEN */}
      <section id="ervaringen" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Wat anderen zeggen</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <Card key={t.name} className="border border-gray-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.condition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-bold text-white">Klaar om te beginnen?</h2>
          <p className="text-blue-100">Artrocare is gratis voor patiënten. Je hebt alleen een uitnodiging van je fysiotherapeut nodig.</p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-10">
              Inloggen of registreren <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-blue-200 text-sm">
            Ben je fysiotherapeut?{' '}
            <Link to="/voor-praktijken" className="underline hover:text-white">Bekijk Artrocare voor praktijken</Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Heart className="w-4 h-4 text-blue-400" /> Artrocare
          </div>
          <p>© {new Date().getFullYear()} Artrocare · AVG-compliant · EU-servers</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white">Inloggen</Link>
            <Link to="/voor-praktijken" className="hover:text-white">Voor fysiotherapeuten</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
