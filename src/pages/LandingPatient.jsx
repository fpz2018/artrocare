import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, CheckCircle, TrendingUp, Dumbbell, BookOpen, Apple,
  Star, ArrowRight, Shield, Bell, ChevronRight, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

const BENEFITS = [
  {
    icon: Dumbbell,
    title: 'Oefenprogramma op maat',
    desc: 'Dagelijkse oefeningen afgestemd op jouw artrose — knie, heup of hand. Opgebouwd volgens de KNGF-richtlijn.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: TrendingUp,
    title: 'Volg je voortgang',
    desc: 'Houd pijnscores, oefentrouw en energieniveau bij. Zie met cijfers dat het beter gaat.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: BookOpen,
    title: 'Begrijp je aandoening',
    desc: 'Korte, begrijpelijke lessen over artrose, bewegen, voeding en wat écht helpt — en wat niet.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Apple,
    title: 'Voeding & supplementen',
    desc: 'Welke voedingspatronen verminderen ontstekingen? Wat zegt het onderzoek over omega-3, vitamine D en curcumine?',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Bell,
    title: 'Dagelijkse herinneringen',
    desc: 'Zachte reminders zodat je oefeningen niet vergeet. Je therapeut ziet automatisch of het lukt.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Shield,
    title: 'Privacy & veiligheid',
    desc: 'Jouw gezondheidsdata blijft in Nederland op EU-servers. AVG-compliant. Nooit gedeeld met derden.',
    color: 'text-gray-600 bg-gray-100',
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
            <a href="#voordelen" className="hover:text-blue-600">Voordelen</a>
            <a href="#hoe-het-werkt" className="hover:text-blue-600">Hoe het werkt</a>
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
            <a href="#voordelen" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Voordelen</a>
            <a href="#hoe-het-werkt" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>Hoe het werkt</a>
            <Link to="/login"><Button size="sm" className="w-full mt-2">Inloggen</Button></Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
            <Shield className="w-4 h-4" /> Gebaseerd op KNGF-richtlijn artrose
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Minder pijn.<br />
            <span className="text-blue-600">Meer beweging.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Artrocare helpt je dagelijks bewegen met artrose — met oefenprogramma's, educatie en direct contact met je fysiotherapeut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                Begin vandaag gratis <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#voordelen">
              <Button size="lg" variant="outline" className="text-base px-8">Bekijk wat je krijgt</Button>
            </a>
          </div>
          <p className="text-sm text-gray-400">Gratis voor patiënten · Geen creditcard · AVG-compliant</p>
        </div>

        {/* Stats strip */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-3 gap-6 text-center">
          {[
            { value: 'KNGF', label: 'Richtlijn gevolgd' },
            { value: 'EU', label: 'Servers & AVG-compliant' },
            { value: '🇳🇱', label: 'Volledig in het Nederlands' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Wat Artrocare voor jou doet</h2>
            <p className="text-gray-500 mt-3">Alles wat je nodig hebt om actief te blijven met artrose.</p>
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
