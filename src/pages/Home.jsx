import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Building2, ArrowRight, CheckCircle, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* NAV */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <Heart className="w-6 h-6 text-blue-600" />
          Artrocare
        </div>
        <Link to="/login">
          <Button variant="outline" size="sm">Inloggen</Button>
        </Link>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-16">
        <div className="max-w-4xl w-full mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
              <Shield className="w-4 h-4" /> Gebaseerd op KNGF-richtlijn artrose
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Artrose beter begrijpen.<br />
              <span className="text-blue-600">Beter bewegen.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Artrocare verbindt fysiotherapeuten en patiënten via een slimme, evidence-based app voor artrosezorg.
            </p>
          </div>

          {/* Twee paden */}
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto pt-4">
            {/* Patiënt */}
            <Link to="/voor-patienten" className="group">
              <div className="bg-white rounded-2xl border-2 border-gray-100 group-hover:border-blue-400 group-hover:shadow-lg transition-all p-6 text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ik ben patiënt</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Dagelijkse oefeningen, voortgang bijhouden en inzicht in je artrose — begeleid door jouw therapeut.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {['Oefenprogramma op maat', 'Pijnmonitoring', 'Educatieve lessen'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                  Bekijk wat Artrocare voor jou doet <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Fysiotherapeut */}
            <Link to="/voor-praktijken" className="group">
              <div className="bg-white rounded-2xl border-2 border-gray-100 group-hover:border-indigo-400 group-hover:shadow-lg transition-all p-6 text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ik ben fysiotherapeut</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Beheer je artrosepatiënten, monitor voortgang en blijf automatisch up-to-date met de nieuwste inzichten.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {['Real-time patiëntmonitoring', 'AI-gedreven protocollen', 'Gratis starttier'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                  Bekijk prijzen en mogelijkheden <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 pt-2">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-400" /> AVG-compliant · EU-servers</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Gratis voor patiënten</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> KNGF-richtlijn gevolgd</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="h-12 flex items-center justify-center border-t border-gray-100 text-xs text-gray-400 gap-4 px-4">
        <span>© {new Date().getFullYear()} Artrocare</span>
        <Link to="/login" className="hover:text-gray-700">Inloggen</Link>
        <Link to="/register-practice" className="hover:text-gray-700">Praktijk aanmelden</Link>
      </footer>
    </div>
  );
}
