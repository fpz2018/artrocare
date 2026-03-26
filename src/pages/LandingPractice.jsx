import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, CheckCircle, Building2, Users, TrendingUp, BookOpen,
  Dumbbell, Brain, Star, ChevronRight, Menu, X, ArrowRight,
  Shield, Zap, Globe, BarChart2, MessageSquare, Bell, Lock,
  Apple, Moon, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const NAV_LINKS = [
  { label: 'Voordelen', href: '#voordelen' },
  { label: 'Hoe het werkt', href: '#hoe-het-werkt' },
  { label: 'Prijzen', href: '#prijzen' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Neuromusculair oefenprogramma',
    desc: 'Gebaseerd op de KNGF-richtlijn én een internationaal erkend oefenprogramma dat in meer dan 30 landen wordt toegepast. Gericht op kracht, balans én pijnreductie.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: TrendingUp,
    title: 'Real-time patiëntmonitoring',
    desc: 'Bekijk pijnscores, oefentrouw en voortgang van al je artrosepatiënten in één overzicht. Grijp snel in waar nodig.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Apple,
    title: 'Voeding & leefstijl',
    desc: 'Patiënten krijgen begrijpelijke adviezen over voeding die ontstekingen beïnvloedt. Omega-3, vitamine D en ontstekingsremmende patronen — praktisch, geen dieet.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Moon,
    title: 'Slaap & herstel',
    desc: 'Slechte slaap versterkt pijnbeleving. Artrocare helpt patiënten begrijpen hoe slaap en herstel bijdragen aan minder pijn en meer energie.',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    icon: Brain,
    title: 'Mentaal welzijn & educatie',
    desc: 'Pijn is niet alleen lichamelijk. Artrocare besteedt aandacht aan gedachten, stress en stemming — en biedt korte lessen over artrose als onderdeel van effectieve zorg.',
    color: 'text-purple-600 bg-purple-50',
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
      'Basis oefenprogramma\'s',
      'Patiëntvoortgang bekijken',
      'E-mail support',
    ],
    cta: 'Gratis starten',
    ctaStyle: 'variant-outline',
    href: '/register-practice',
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
      'Volledige artrose-protocollen',
      'AI-gedreven contentupdates',
      'HOOS-12 uitkomstmaten',
      'Real-time monitoring & alerts',
      'Patiëntvoorlichting & lessen',
      'Prioriteit support',
    ],
    cta: '14 dagen gratis proberen',
    ctaStyle: 'default',
    href: '/register-practice',
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
    cta: 'Offerte aanvragen',
    ctaStyle: 'variant-outline',
    href: 'mailto:marc@fysiopraktijkzeist.nl?subject=Kliniek%20plan%20Artrocare',
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
    q: 'Wat als ik meer dan 5 patiënten wil met Starter?',
    a: 'Je kunt altijd upgraden naar het Praktijk-plan. Bestaande data blijft behouden.',
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
    text: 'Met Artrocare houd ik grip op mijn artrosepatiënten zonder extra administratie. De AI-updates van protocollen zijn een game-changer.',
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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm">Inloggen</Button>
            </Link>
            <Link to="/register-practice">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Praktijk aanmelden <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
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
              <Link to="/" className="flex-1"><Button variant="outline" size="sm" className="w-full">Inloggen</Button></Link>
              <Link to="/register-practice" className="flex-1"><Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Aanmelden</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
            <Sparkles className="w-4 h-4" /> Vernieuwend · KNGF-richtlijn · Internationaal erkend oefenprogramma · De hele mens centraal
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Artrosezorg die verder gaat.<br />
            <span className="text-blue-600">De hele mens centraal.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Artrocare combineert een internationaal erkend neuromusculair oefenprogramma met aandacht voor voeding, slaap en mentaal welzijn — begeleid door jou als fysiotherapeut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/register-practice">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                Gratis starten <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#hoe-het-werkt">
              <Button size="lg" variant="outline" className="text-base px-8">
                Bekijk hoe het werkt
              </Button>
            </a>
          </div>
          <p className="text-sm text-gray-400">Gratis tot 5 patiënten · Geen creditcard nodig · AVG-compliant</p>
        </div>

        {/* Holistische pijlers */}
        <div className="max-w-2xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Dumbbell, label: 'Bewegen', color: 'text-blue-600 bg-blue-50' },
            { icon: Apple,    label: 'Voeding', color: 'text-orange-600 bg-orange-50' },
            { icon: Moon,     label: 'Slaap',   color: 'text-indigo-600 bg-indigo-50' },
            { icon: Brain,    label: 'Mentaal', color: 'text-purple-600 bg-purple-50' },
          ].map(p => (
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

      {/* VERGELIJKING STRIP */}
      <section className="bg-blue-600 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 text-white text-sm font-medium">
          {[
            'Artrose-specifiek (knie, heup, hand)',
            'KNGF-richtlijn + internationaal erkend oefenprogramma',
            'Holistische aanpak: bewegen, voeding, slaap & mentaal',
            'AI-gedreven protocolupdates',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-200 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meer dan een oefenapp</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Artrocare is de eerste Nederlandse artrose-app die bewegen, voeding, slaap én mentaal welzijn combineert in één begeleid programma — gebouwd voor fysiotherapeuten.
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
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${plan.name === 'Praktijk' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'} border-0 px-3`}>
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
                  {plan.href.startsWith('mailto') ? (
                    <a href={plan.href}>
                      <Button variant="outline" className="w-full">{plan.cta}</Button>
                    </a>
                  ) : (
                    <Link to={plan.href}>
                      <Button className={`w-full ${plan.name === 'Praktijk' ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.name !== 'Praktijk' ? 'outline' : 'default'}>
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Vergelijk: Physitrack kost €20.95/therapeut/maand zonder artrose-specialisatie.
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

      {/* CTA FOOTER */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Klaar om te starten?
          </h2>
          <p className="text-blue-100 text-lg">
            Meld je praktijk gratis aan. Geen creditcard, geen contract.
          </p>
          <Link to="/register-practice">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-base px-10">
              Praktijk aanmelden <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-blue-200 text-sm">
            Al een account?{' '}
            <Link to="/" className="underline hover:text-white">Inloggen</Link>
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
          <p>© {new Date().getFullYear()} Artrocare · Fysiopraktijk Zeist · AVG-compliant · EU-servers</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-white transition-colors">Inloggen</Link>
            <Link to="/register-practice" className="hover:text-white transition-colors">Aanmelden</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
