import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, TrendingUp, BookOpen,
  Dumbbell, Brain, Star, ChevronRight, Menu, X, ArrowRight,
  Shield, Zap, Globe, BarChart2, Lock,
  Apple, Moon, Pill, RefreshCw, Sparkles, Users, FlaskConical
} from 'lucide-react';
import WaitlistForm from '@/components/WaitlistForm';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PILLARS = [
  { icon: Dumbbell, label: 'Bewegen',       color: 'text-blue-600 bg-blue-50' },
  { icon: BookOpen, label: 'Educatie',      color: 'text-amber-600 bg-amber-50' },
  { icon: Apple,    label: 'Voeding',       color: 'text-orange-600 bg-orange-50' },
  { icon: Moon,     label: 'Slaap',         color: 'text-indigo-600 bg-indigo-50' },
  { icon: Brain,    label: 'Mentaal',       color: 'text-purple-600 bg-purple-50' },
  { icon: Pill,     label: 'Medicatie & supplementen', color: 'text-rose-600 bg-rose-50' },
];

export default function LandingPractice() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const { language, setLanguage, t } = useI18n();

  const NAV_LINKS = [
    { label: t('lprac_nav_approach'), href: '#aanpak' },
    { label: t('lprac_nav_benefits'), href: '#voordelen' },
    { label: t('lprac_nav_process'), href: '#hoe-het-werkt' },
    { label: t('lprac_nav_pricing'), href: '#prijzen' },
    { label: t('lprac_nav_faq'), href: '#faq' },
  ];

  const FEATURES = [
    {
      icon: Dumbbell,
      title: t('lprac_exercise_title'),
      desc: t('lprac_exercise_desc'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: BookOpen,
      title: t('lprac_education_title'),
      desc: t('lprac_education_desc'),
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Apple,
      title: t('lprac_lifestyle_title'),
      desc: t('lprac_lifestyle_desc'),
      color: 'text-orange-600 bg-orange-50',
    },
    {
      icon: Pill,
      title: t('lprac_medication_title'),
      desc: t('lprac_medication_desc'),
      color: 'text-rose-600 bg-rose-50',
    },
    {
      icon: TrendingUp,
      title: t('lprac_monitoring_title'),
      desc: t('lprac_monitoring_desc'),
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: BarChart2,
      title: t('lprac_outcomes_title'),
      desc: t('lprac_outcomes_desc'),
      color: 'text-red-600 bg-red-50',
    },
  ];

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: t('lprac_step1_title'),
      desc: t('lprac_step1_desc'),
      color: 'bg-blue-600',
    },
    {
      step: '02',
      title: t('lprac_step2_title'),
      desc: t('lprac_step2_desc'),
      color: 'bg-indigo-600',
    },
    {
      step: '03',
      title: t('lprac_step3_title'),
      desc: t('lprac_step3_desc'),
      color: 'bg-violet-600',
    },
    {
      step: '04',
      title: t('lprac_step4_title'),
      desc: t('lprac_step4_desc'),
      color: 'bg-purple-600',
    },
  ];

  const FOR_WHO = [
    { title: t('lprac_mild_title'), desc: t('lprac_mild_desc') },
    { title: t('lprac_chronic_title'), desc: t('lprac_chronic_desc') },
    { title: t('lprac_preop_title'), desc: t('lprac_preop_desc') },
    { title: t('lprac_postop_title'), desc: t('lprac_postop_desc') },
  ];

  const TESTIMONIALS = [
    {
      name: t('lprac_testimonial_org'),
      role: t('lprac_testimonial_role'),
      text: t('lprac_testimonial_text'),
      initials: 'FZ',
      color: 'bg-blue-100 text-blue-700',
    },
  ];

  const PRICING = [
    {
      name: t('lprac_plan_starter_name'),
      price: 'Gratis',
      period: t('lprac_plan_starter_period'),
      desc: t('lprac_plan_starter_desc'),
      color: 'border-gray-200',
      badge: null,
      features: [
        t('lprac_plan_starter_feature1'),
        t('lprac_plan_starter_feature2'),
        t('lprac_plan_starter_feature3'),
        t('lprac_plan_starter_feature4'),
        t('lprac_plan_starter_feature5'),
      ],
      cta: t('lprac_plan_starter_cta'),
      href: '#prijzen-cta',
      primary: false,
    },
    {
      name: t('lprac_plan_practice_name'),
      price: '€19',
      period: t('lprac_plan_practice_period'),
      desc: t('lprac_plan_practice_desc'),
      color: 'border-blue-500 ring-2 ring-blue-500',
      badge: t('lprac_plan_practice_badge'),
      features: [
        t('lprac_plan_practice_feature1'),
        t('lprac_plan_practice_feature2'),
        t('lprac_plan_practice_feature3'),
        t('lprac_plan_practice_feature4'),
        t('lprac_plan_practice_feature5'),
        t('lprac_plan_practice_feature6'),
        t('lprac_plan_practice_feature7'),
        t('lprac_plan_practice_feature8'),
      ],
      cta: t('lprac_plan_practice_cta'),
      href: '#prijzen-cta',
      primary: true,
    },
    {
      name: t('lprac_plan_clinic_name'),
      price: '€14',
      period: t('lprac_plan_clinic_period'),
      desc: t('lprac_plan_clinic_desc'),
      color: 'border-gray-200',
      badge: t('lprac_plan_clinic_badge'),
      features: [
        t('lprac_plan_clinic_feature1'),
        t('lprac_plan_clinic_feature2'),
        t('lprac_plan_clinic_feature3'),
        t('lprac_plan_clinic_feature4'),
        t('lprac_plan_clinic_feature5'),
        t('lprac_plan_clinic_feature6'),
      ],
      cta: t('lprac_plan_clinic_cta'),
      href: '#prijzen-cta',
      primary: false,
    },
  ];

  const FAQS = [
    {
      q: t('lprac_faq1_q'),
      a: t('lprac_faq1_a'),
    },
    {
      q: t('lprac_faq2_q'),
      a: t('lprac_faq2_a'),
    },
    {
      q: t('lprac_faq3_q'),
      a: t('lprac_faq3_a'),
    },
    {
      q: t('lprac_faq4_q'),
      a: t('lprac_faq4_a'),
    },
    {
      q: t('lprac_faq5_q'),
      a: t('lprac_faq5_a'),
    },
    {
      q: t('lprac_faq6_q'),
      a: t('lprac_faq6_a'),
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-24 flex items-center justify-between">
          <Link to="/">
            <Logo height={88} />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')} title={language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}>
              <Globe className="w-5 h-5 text-gray-500" />
            </Button>
            <Link to="/login">
              <Button variant="outline" size="sm">{t('login')}</Button>
            </Link>
            <a href="#prijzen-cta">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                {t('lprac_cta_primary')} <ChevronRight className="w-4 h-4 ml-1" />
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
              <Link to="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">{t('login')}</Button></Link>
              <a href="#prijzen-cta" className="flex-1"><Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">{t('lprac_footer_register')}</Button></a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
              <Sparkles className="w-4 h-4" /> {t('lprac_badge')}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-amber-200">
              <FlaskConical className="w-4 h-4" /> {t('lprac_beta_badge')}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {t('lprac_h1_line1')}<br />
            <span className="text-blue-600">{t('lprac_h1_line2')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('lprac_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href="#prijzen-cta">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8">
                {t('lprac_cta_primary')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#aanpak">
              <Button size="lg" variant="outline" className="text-base px-8">
                {t('lprac_cta_secondary')}
              </Button>
            </a>
          </div>
          <p className="text-sm text-gray-400">{t('lprac_hero_footer')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('lprac_hero_trust')}</p>
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
            { icon: Shield, text: t('lprac_social_proof1') },
            { icon: Zap, text: t('lprac_social_proof2') },
            { icon: Globe, text: t('lprac_social_proof3') },
            { icon: Lock, text: t('lprac_social_proof4') },
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('lprac_section_why')}</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              {t('lprac_why_intro')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 bg-gray-50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">{t('lprac_other_label')}</h3>
                <ul className="space-y-2">
                  {[
                    t('lprac_other_only_exercises'),
                    t('lprac_other_no_education'),
                    t('lprac_other_no_lifestyle'),
                    t('lprac_other_static'),
                  ].map(item => (
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
                <h3 className="font-semibold text-blue-700 text-sm uppercase tracking-wide">{t('lprac_artrocare_label')}</h3>
                <ul className="space-y-2">
                  {[
                    t('lprac_artrocare_feature1'),
                    t('lprac_artrocare_feature2'),
                    t('lprac_artrocare_feature3'),
                    t('lprac_artrocare_feature4'),
                    t('lprac_artrocare_feature5'),
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
                  <h3 className="font-semibold text-blue-800 text-sm">{t('lprac_always_uptodate')}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('lprac_uptodate_desc')}
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
            <h2 className="text-3xl font-bold text-gray-900">{t('lprac_for_all')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              {t('lprac_for_all_desc')}
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
              <strong>{t('lprac_always_guided')}</strong> {t('lprac_guided_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section id="voordelen" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('lprac_features_title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              {t('lprac_features_desc')}
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('lprac_how_title')}</h2>
            <p className="text-gray-500 mt-3">{t('lprac_how_desc')}</p>
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
          {TESTIMONIALS.map(testimonial => (
            <div key={testimonial.name} className="space-y-4">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-700 italic leading-relaxed">
                "{testimonial.text}"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${testimonial.color}`}>
                  {testimonial.initials}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-gray-500 text-xs">{testimonial.role}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('lprac_pricing_title')}</h2>
            <p className="text-gray-500 mt-3">{t('lprac_pricing_desc')}</p>
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
            {t('lprac_pricing_comparison')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">{t('lprac_faq_title')}</h2>
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
            <FlaskConical className="w-3.5 h-3.5" /> {t('lprac_beta_badge')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('lprac_cta_title')}
          </h2>
          <p className="text-blue-100 text-lg">
            {t('lprac_cta_desc')}
          </p>
          <WaitlistForm
            role="practice"
            showNameField
            className="max-w-sm mx-auto text-left"
          />
          <p className="text-blue-200 text-sm">
            {t('lprac_cta_has_account')}{' '}
            <Link to="/login" className="underline hover:text-white">{t('login')}</Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Logo height={32} className="brightness-0 invert" />
          </div>
          <p>© {new Date().getFullYear()} Artrocare · AVG-compliant · EU-servers</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white transition-colors">{t('login')}</Link>
            <Link to="/register-practice" className="hover:text-white transition-colors">{t('lprac_footer_register')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
