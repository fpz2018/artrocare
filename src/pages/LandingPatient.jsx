import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, TrendingUp, Dumbbell, BookOpen, Apple,
  Star, ArrowRight, Shield, Moon, Brain, Menu, X, Sparkles, Pill, RefreshCw, FlaskConical, Globe, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import WaitlistForm from '@/components/WaitlistForm';
import Logo from '@/components/Logo';
import { useI18n } from '@/i18n';

export default function LandingPatient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();

  const PILLARS = [
    { icon: Dumbbell, label: t('pillar_movement'),   color: 'text-blue-600 bg-blue-50' },
    { icon: BookOpen, label: t('pillar_education'),  color: 'text-amber-600 bg-amber-50' },
    { icon: Apple,    label: t('pillar_nutrition'),  color: 'text-orange-600 bg-orange-50' },
    { icon: Moon,     label: t('pillar_sleep'),      color: 'text-indigo-600 bg-indigo-50' },
    { icon: Brain,    label: t('pillar_mental'),     color: 'text-purple-600 bg-purple-50' },
    { icon: Pill,     label: t('pillar_medication'), color: 'text-rose-600 bg-rose-50' },
  ];

  const BENEFITS = [
    {
      icon: Dumbbell,
      title: t('lp_exercise_title'),
      desc: t('lp_exercise_desc'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: BookOpen,
      title: t('lp_education_title'),
      desc: t('lp_education_desc'),
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Apple,
      title: t('lp_nutrition_title'),
      desc: t('lp_nutrition_desc'),
      color: 'text-orange-600 bg-orange-50',
    },
    {
      icon: Moon,
      title: t('lp_sleep_title'),
      desc: t('lp_sleep_desc'),
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: Brain,
      title: t('lp_mental_title'),
      desc: t('lp_mental_desc'),
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Pill,
      title: t('lp_medication_title'),
      desc: t('lp_medication_desc'),
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  const TESTIMONIALS = [
    {
      text: t('lp_testimonial1_text'),
      name: t('lp_testimonial1_name'),
      condition: t('lp_testimonial1_condition'),
      initials: 'M',
    },
    {
      text: t('lp_testimonial2_text'),
      name: t('lp_testimonial2_name'),
      condition: t('lp_testimonial2_condition'),
      initials: 'H',
    },
    {
      text: t('lp_testimonial3_text'),
      name: t('lp_testimonial3_name'),
      condition: t('lp_testimonial3_condition'),
      initials: 'R',
    },
  ];

  const STEPS = [
    { step: '1', title: t('lp_step1_title'), desc: t('lp_step1_desc') },
    { step: '2', title: t('lp_step2_title'), desc: t('lp_step2_desc') },
    { step: '3', title: t('lp_step3_title'), desc: t('lp_step3_desc') },
  ];

  const FOR_WHO = [
    { title: t('lp_mild_title'), desc: t('lp_mild_desc') },
    { title: t('lp_chronic_title'), desc: t('lp_chronic_desc') },
    { title: t('lp_preop_title'), desc: t('lp_preop_desc') },
    { title: t('lp_postop_title'), desc: t('lp_postop_desc') },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-24 flex items-center justify-between">
          <Link to="/">
            <Logo height={88} />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#aanpak" className="hover:text-blue-600">{t('lp_nav_approach')}</a>
            <a href="#voordelen" className="hover:text-blue-600">{t('lp_nav_benefits')}</a>
            <a href="#voor-wie" className="hover:text-blue-600">{t('lp_nav_for_who')}</a>
            <a href="#ervaringen" className="hover:text-blue-600">{t('lp_nav_testimonials')}</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')} title={language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}>
              <Globe className="w-5 h-5 text-gray-500" />
            </Button>
            <Link to="/login"><Button variant="outline" size="sm">{t('login')}</Button></Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            <a href="#aanpak" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{t('lp_nav_approach')}</a>
            <a href="#voordelen" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{t('lp_nav_benefits')}</a>
            <a href="#voor-wie" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>{t('lp_nav_for_who')}</a>
            <Link to="/login"><Button size="sm" className="w-full mt-2">{t('login')}</Button></Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
              <Sparkles className="w-4 h-4" /> {t('lp_badge')}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-amber-200">
              <FlaskConical className="w-4 h-4" /> {t('lp_beta_badge')}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {t('lp_h1_line1')}<br />
            <span className="text-blue-600">{t('lp_h1_line2')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('lp_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href="#wachtlijst-cta">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                {t('lp_cta_primary')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#aanpak">
              <Button size="lg" variant="outline" className="text-base px-8">{t('lp_cta_secondary')}</Button>
            </a>
          </div>
          <Link to="/beweegplan" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
            <Download className="w-4 h-4" /> {t('lp_lead_magnet')}
          </Link>
          <p className="text-sm text-gray-400">{t('lp_hero_footer')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('lp_hero_trust')}</p>
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
          {t('lp_pillars_desc')}
        </p>
      </section>

      {/* WAAROM ANDERS — de differentiator */}
      <section id="aanpak" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('lp_section_why_different')}</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              {t('lp_why_intro')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 bg-gray-50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">{t('lp_other_programs')}</h3>
                <ul className="space-y-2">
                  {[
                    t('lp_other_only_exercises'),
                    t('lp_other_no_education'),
                    t('lp_other_no_lifestyle'),
                    t('lp_other_static'),
                  ].map(item => (
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
                <h3 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">{t('lp_artrocare_label')}</h3>
                <ul className="space-y-2">
                  {[
                    t('lp_artrocare_feature1'),
                    t('lp_artrocare_feature2'),
                    t('lp_artrocare_feature3'),
                    t('lp_artrocare_feature4'),
                    t('lp_artrocare_feature5'),
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
                  <h3 className="font-semibold text-blue-800 text-sm">{t('lp_always_uptodate')}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('lp_uptodate_desc')}
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
            <h2 className="text-3xl font-bold text-gray-900">{t('lp_for_everyone')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              {t('lp_for_everyone_desc')}
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
            <p className="text-sm text-blue-800 font-medium">{t('lp_guided_note')}</p>
            <p className="text-sm text-blue-700 mt-1">{t('lp_guided_desc')}</p>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('lp_benefits_title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">{t('lp_benefits_desc')}</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('lp_how_it_works')}</h2>
          <p className="text-gray-500 mb-12">{t('lp_how_works_desc')}</p>
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
            <strong>{t('lp_no_invitation')}</strong> {t('lp_ask_therapist')},{' '}
            <Link to="/voor-fysiotherapeuten" className="underline">{t('lp_ask_therapist_link')}</Link>.
          </div>
        </div>
      </section>

      {/* ERVARINGEN */}
      <section id="ervaringen" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('lp_testimonials_title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(testimonial => (
              <Card key={testimonial.name} className="border border-gray-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-400">{testimonial.condition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — wachtlijst */}
      <section id="wachtlijst-cta" className="py-20 px-4 bg-blue-600">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
            <FlaskConical className="w-3.5 h-3.5" /> {t('lp_beta_badge')}
          </div>
          <h2 className="text-3xl font-bold text-white">{t('lp_cta_title')}</h2>
          <p className="text-blue-100">
            {t('lp_cta_desc')}
          </p>
          <WaitlistForm
            role="patient"
            className="max-w-sm mx-auto"
          />
          <p className="text-blue-200 text-sm">
            {t('lp_cta_has_invitation')}{' '}
            <Link to="/login" className="underline hover:text-white">{t('lp_cta_login')}</Link>
          </p>
          <p className="text-blue-200 text-sm">
            {t('lp_cta_therapist')}{' '}
            <Link to="/voor-praktijken" className="underline hover:text-white">{t('lp_cta_therapist_link')}</Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center">
            <Logo height={40} className="brightness-0 invert" />
          </div>
          <p>© {new Date().getFullYear()} Artrocare · AVG-compliant · EU-servers</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white">{t('login')}</Link>
            <Link to="/voor-praktijken" className="hover:text-white">{t('lp_footer_therapist')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
