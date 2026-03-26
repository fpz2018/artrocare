import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, CheckCircle, TrendingUp, BookOpen,
  Dumbbell, Brain, Star, ChevronRight, Menu, X, ArrowRight,
  Shield, Zap, Globe, BarChart2, Lock,
  Apple, Moon, Pill, RefreshCw, Sparkles, Users, FlaskConical
} from 'lucide-react';
import WaitlistForm from '@/components/WaitlistForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const NAV_LINKS = [
  { label: 'Aanpak', href: '#aanpak' },
  { label: 'Voordelen', href: '#voordelen' },
  { label: 'Hoe het werkt', href: '#hoe-het-werkt' },
  { label: 'Prijzen', href: '#prijzen' },
  { label: 'FAQ', href: '#faq' },
];

const PILLARS = [
  { icon: Dumbbell, label: 'Bewegen',       color: 'text-blue-600 bg-blue-50' },
  { icon: BookOpen, label: 'Educatie',      color: 'text-amber-600 bg-amber-50' },
  { icon: Apple,    label: 'Voeding',       color: 'text-orange-600 bg-orange-50' },
  { icon: Moon,     label: 'Slaap',         color: 'text-indigo-600 bg-indigo-50' },
  { icon: Brain,    label: 'Mentaal',       color: 'text-purple-600 bg-purple-50' },
  { icon: Pill,     label: 'Medicatie & supplementen', color: 'text-rose-600 bg-rose-50' },
];

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Effectief oefenprogramma',
    desc: 'Gebaseerd op de KNGF-richtlijn én internationaal erkende en effectieve programma\'s die in meer dan 30 landen worden toegepast. Knie, heup en hand — aangepast op niveau van de patiënt.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: BookOpen,
    title: 'Patiënteducatie als kernonderdeel',
    desc: 'Educatie is een bewezen en onmisbaar onderdeel van effectieve artrosezorg. Artrocare integreert begrijpelijke lessen over artrose, pijn en leefstijl direct in het programma.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Apple,
    title: 'Voeding, slaap & mentaal welzijn',
    desc: 'Artrocare begeleidt patiënten ook op het gebied van voeding, slaap en mentaal welzijn — want effectieve artrosezorg vraagt om een aanpak die de hele mens ziet.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Pill,
    title: 'Medicatie & supplementen inzicht',
    desc: 'Patiënten krijgen feitelijke informatie over veelgebruikte pijnmedicatie en supplementen bij artrose — zodat ze beter geïnformeerd het gesprek met jou kunnen aangaan.',
    color: 'text-rose-600 bg-rose-50',
  },
  {
    icon: TrendingUp,
    title: 'Real-time patiëntmonitoring',
    desc: 'Bekijk pijnscores, oefentrouw en voortgang van al je artrosepatiënten in één overzicht. Grijp snel in waar nodig.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: BarChart2,
    title: 'HOOS-12 & uitkomstmaten',
    desc: 'Gevalideerde vragenlijsten automatisch afgenomen op de juiste momenten. Rapportages klaar voor zorgverzekeraar.',
    color: 'text-red-600 bg-red-50',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Praktijk aanmelden',
    desc: 'Meld je praktijk aan in 2 minuten. Na goedkeuring kun je direct aan de slag.',
    color: 'bg-blue-600',
  },
  {
    step: '02',
    title: 'Therapeuten uitnodigen',
    desc: 'Nodig collega-therapeuten uit via e-mail. Zij krijgen direct toegang tot het therapeutendashboard.',
    color: 'bg-indigo-600',
  },
  {
    step: '03',
    title: 'Patiënten koppelen',
    desc: 'Stuur patiënten een uitnodigingslink. Ze registreren zich en zijn direct gekoppeld aan jou als therapeut.',
    color: 'bg-violet-600',
  },
  {
    step: '04',
    title: 'Monitoren & bijsturen',
    desc: 'Volg voortgang, ontvang alerts bij hoge pijnscores en pas programma\'s aan vanuit één dashboard.',
    color: 'bg-purple-600',
  },
];

const FOR_WHO = [
  { title: 'Patiënten met milde klachten', desc: 'Vroeg starten met de juiste gewoonten — voorkomt verergering en geeft grip op de aandoening.' },
  { title: 'Patiënten met langdurige artrose', desc: 'Structuur, inzicht en continue begeleiding voor patiënten die al jaren met artrose leven.' },
  { title: 'Pre-operatieve begeleiding', desc: 'Een knie- of heupoperatie in zicht? Aantoonbaar betere uitkomsten bij goede voorbereiding.' },
  { title: 'Post-operatieve nazorg', desc: 'Stap-voor-stap hersteltraject na prothese — gericht op functie, kracht en dagelijks bewegen.' },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Gratis',
    period: 'altijd',
    desc: 'Probeer Artrocare zonder risico.',
    color: 'border-gray-200',
    badge: null,
    features: [
      '1 therapeut',
      'Tot 5 actieve patiënten',
      'Volledig oefenprogramma',
      'Patiëntvoortgang bekijken',
      'E-mail support',
    ],
    cta: 'Interesse melden',
    href: '#prijzen-cta',
    primary: false,
  },
  {
    name: 'Praktijk',
    price: '€19',
    period: 'per therapeut / maand',
    desc: 'De volledige ervaring voor groeiende praktijken.',
    color: 'border-blue-500 ring-2 ring-blue-500',
    badge: 'Meest gekozen',
    features: [
      'Onbeperkt therapeuten',
      'Onbeperkt patiënten',
      'Alle 6 pijlers volledig actief',
      'AI-gedreven contentupdates',
      'HOOS-12 uitkomstmaten',
      'Real-time monitoring & alerts',
      'Pre- en postoperatieve trajecten',
      'Prioriteit support',
    ],
    cta: 'Doe mee met de pilot',
    href: '#prijzen-cta',
    primary: true,
  },
  {
    name: 'Kliniek',
    price: '€14',
    period: 'per therapeut / maand',
    desc: 'Voor grotere organisaties met meerdere locaties.',
    color: 'border-gray-200',
    badge: 'Vanaf 5 therapeuten',
    features: [
      'Alles uit Praktijk',
      'Meerdere locaties',
      'Eigen huisstijl (white-label)',
      'API-toegang & EPD-koppeling',
      'Dedicated accountmanager',
      'SLA & prioriteit onboarding',
    ],
    cta: 'Interesse melden',
    href: '#prijzen-cta',
    primary: false,
  },
];

const FAQS = [
  {
    q: 'Moet ik een contract tekenen?',
    a: 'Nee. Artrocare werkt op maandbasis — opzegbaar per maand. Geen verplichtingen, geen verborgen kosten.',
  },
  {
    q: 'Werkt Artrocare samen met mijn EPD?',
    a: 'Op dit moment is Artrocare een aanvulling op je EPD (zoals Intramed of FysioRoadmap). EPD-koppeling is gepland voor het Kliniek-plan in 2026.',
  },
  {
    q: 'Is de app ook in het Engels beschikbaar?',
    a: 'Ja. Artrocare ondersteunt Nederlands en Engels. Patiënten kiezen zelf hun taal.',
  },
  {
    q: 'Zijn patiëntgegevens veilig?',
    a: 'Alle data wordt opgeslagen op EU-servers (Supabase/AWS EU-West). Volledig AVG-compliant. Gegevens worden nooit gedeeld met derden.',
  },
  {
    q: 'Hoe vaak wordt het programma bijgewerkt?',
    a: 'Artrocare volgt actief de nieuwste wetenschappelijke inzichten rondom artrose. Nieuwe onderzoeken worden regelmatig vertaald naar praktische aanpassingen in het programma — jij en je patiënten profiteren daar automatisch van.',
  },
  {
    q: 'Wordt Artrocare vergoed door de zorgverzekeraar?',
    a: 'Artrocare is een hulpmiddel voor therapeuten, geen zorgproduct voor patiënten. De reguliere fysiotherapiezorg (inclusief het gebruik van Artrocare) is gewoon declareerbaar via de gebruikelijke kanalen.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Fysiopraktijk Zeist',
    role: 'Fysiotherapeut & eigenaar',
    text: 'Met Artrocare houd ik grip op mijn artrosepatiënten zonder extra administratie. Dat het programma ook voeding, slaap en mentaal meeneemt maakt het écht compleet.',
    initials: 'FZ',
    color: 'bg-blue-100 text-blue-700',
  },
];

export default function LandingPractice() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <Heart className="w-6 h-6 text-blue-600" />
            Artrocare
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" size="sm">Inloggen</Button>
            </Link>
            <a href="#prijzen-cta">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Doe mee met pilot <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(v => !v)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="block text-sm text-gray-700" onClick={() => setMobileMenu(false)}>{l.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Inloggen</Button></Link>
              <a href="#prijzen-cta" className="flex-1"><Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Aanmelden</Button></a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
              <Sparkles className="w-4 h-4" /> Gebaseerd op Nederlandse en internationaal erkende effectieve programma's
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-amber-200">
              <FlaskConical className="w-4 h-4" /> Beta 2026
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Artrosezorg die verder gaat.<br />
            <span className="text-blue-600">De hele mens centraal.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Artrocare is anders dan andere programma's. Wij ondersteunen jou als fysiotherapeut bij het begeleiden van de <em>hele</em> patiënt — bewegen, educatie, voeding, slaap, mentaal welzijn én medicatie. Continu bijgewerkt op basis van de nieuwste onderzoeken.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href="#prijzen-cta">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                Doe mee met de pilot <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#aanpak">
              <Button size="lg" variant="outline" className="text-base px-8">
                Bekijk onze aanpak
              </Button>
            </a>
          </div>
          <p className="text-sm text-gray-400">Gratis tot 5 patiënten · Geen creditcard nodig · AVG-compliant</p>
        </div>

        {/* 6 pijlers */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-3 gap-3">
          {PILLARS.map(p => (
            <div key={p.label} className={`rounded-xl ${p.color} px-4 py-3 flex items-center gap-2 font-medium text-sm`}>
              <p.icon className="w-4 h-4 flex-shrink-0" /> {p.label}
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div className="max-w-4xl mx-auto mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {[
            { icon: Shield, text: 'AVG-compliant · EU-servers' },
            { icon: Zap, text: 'Live in 5 minuten' },
            { icon: Globe, text: 'NL & EN taalondersteuning' },
            { icon: Lock, text: 'Geen contract · Maandelijks opzegbaar' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-blue-500" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WAAROM ANDERS */}
      <section id="aanpak" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Waarom Artrocare anders is</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Andere oefenprogramma's richten zich op één onderdeel. Artrocare niet.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 bg-gray-50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">Andere programma's</h3>
                <ul className="space-y-2">
                  {['Alleen oefeningen', 'Geen educatie geïntegreerd', 'Geen leefstijlbegeleiding', 'Statisch, zelden bijgewerkt'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="flex-shrink-0">✕</span> {item}
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
                    'Pre- én postoperatieve trajecten',
                    'Altijd begeleid door de fysiotherapeut',
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
                  De wetenschap rondom artrose ontwikkelt zich snel. Artrocare volgt de nieuwste onderzoeken en past het programma continu aan. Jij en je patiënten profiteren altijd van de meest actuele inzichten — automatisch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* VOOR WIE */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Voor al je artrosepatiënten</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Van licht naar zwaar. Artrocare past zich aan de situatie van elke patiënt aan.
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
          <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Altijd onder jouw begeleiding.</strong> Artrocare is een verlengstuk van jouw zorg — jij behoudt de regie. Patiënten worden uitgenodigd via jou en zijn altijd aan jou als therapeut gekoppeld.
            </p>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Alles wat je nodig hebt</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Zes pijlers. Één platform. Gebouwd voor de dagelijkse realiteit van artrosezorg in Nederland.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <Card key={f.title} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section id="hoe-het-werkt" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Hoe het werkt</h2>
            <p className="text-gray-500 mt-3">Van aanmelding tot actieve patiënten in minder dan een uur.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-blue-200 z-0" style={{ width: 'calc(100% - 3rem)', left: '3rem' }} />
                )}
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl ${step.color} text-white flex items-center justify-center font-bold text-lg mb-4`}>
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="space-y-4">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-700 italic leading-relaxed">
                "{t.text}"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                  {t.initials}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Transparante prijzen</h2>
            <p className="text-gray-500 mt-3">Geen verborgen kosten. Maandelijks opzegbaar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PRICING.map(plan => (
              <div key={plan.name} className={`bg-white rounded-2xl border-2 ${plan.color} p-6 relative`}>
                {plan.badge && (
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${plan.primary ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'} border-0 px-3`}>
                    {plan.badge}
                  </Badge>
                )}
                <div className="mt-2">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <div className="mt-3 mb-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Gratis' && <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>}
                    {plan.price === 'Gratis' && <span className="text-gray-400 text-sm ml-1">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={plan.href}>
                    <Button className={`w-full ${plan.primary ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.primary ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Vergelijk: Physitrack kost €20.95/therapeut/maand — zonder artrose-specialisatie en zonder holistische aanpak.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Veelgestelde vragen</h2>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-4">
                <button
                  className="w-full flex items-center justify-between text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER — wachtlijst */}
      <section id="prijzen-cta" className="py-20 px-4 bg-blue-600">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
            <FlaskConical className="w-3.5 h-3.5" /> Beta 2026
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Doe mee met de pilot
          </h2>
          <p className="text-blue-100 text-lg">
            Artrocare is nu in de pilotfase. Meld je aan — we nemen contact op zodra we jouw praktijk kunnen onboarden.
          </p>
          <WaitlistForm
            role="practice"
            showNameField
            className="max-w-sm mx-auto text-left"
          />
          <p className="text-blue-200 text-sm">
            Al een account?{' '}
            <Link to="/login" className="underline hover:text-white">Inloggen</Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Heart className="w-5 h-5 text-blue-400" />
            Artrocare
          </div>
          <p>© {new Date().getFullYear()} Artrocare · AVG-compliant · EU-servers</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
            <Link to="/register-practice" className="hover:text-white transition-colors">Aanmelden</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
