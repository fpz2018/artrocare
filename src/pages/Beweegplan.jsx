import { useState } from 'react';
import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Download, Dumbbell, Clock, Calendar } from 'lucide-react';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';

export default function Beweegplan() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Voer een geldig e-mailadres in.');
      return;
    }
    setState('loading');
    setErrorMsg('');

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmed, role: 'patient', name: null });

    if (error && error.code !== '23505') {
      setErrorMsg('Er ging iets mis. Probeer het opnieuw.');
      setState('idle');
      return;
    }

    setState('success');
  };

  const handleDownload = () => {
    window.open('/downloads/7-dagen-beweegplan.pdf', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/"><Logo height={48} /></Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">Inloggen</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-100">
            <Download className="w-4 h-4" /> Gratis PDF
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            7-Dagen Artrose<br />Beweegplan
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Dagelijks 15 minuten bewegen voor soepelere gewrichten. Geen speciale apparatuur nodig.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: '7 dagen', sub: 'Opbouwend programma' },
            { icon: Clock, label: '15 min/dag', sub: 'Past in elke agenda' },
            { icon: Dumbbell, label: '21 oefeningen', sub: 'Knie & heup focus' },
          ].map((f) => (
            <div key={f.label} className="text-center p-3 bg-white rounded-xl border border-gray-100">
              <f.icon className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-gray-900">{f.label}</p>
              <p className="text-xs text-gray-500">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* Form / Success */}
        <Card className="border-blue-100 shadow-md">
          <CardContent className="p-6">
            {state === 'success' ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Je beweegplan is klaar!</h3>
                  <p className="text-sm text-gray-500 mt-1">Klik hieronder om de PDF te downloaden.</p>
                </div>
                <Button onClick={handleDownload} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </Button>
                <p className="text-xs text-gray-400">
                  We sturen je ook een bericht als het volledige ArtroCare programma beschikbaar is.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">Download het gratis beweegplan</h3>
                  <p className="text-sm text-gray-500 mt-1">Vul je e-mailadres in en ontvang direct de PDF.</p>
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  required
                  className="text-center"
                />
                {errorMsg && <p className="text-sm text-red-600 text-center">{errorMsg}</p>}
                <Button
                  type="submit"
                  disabled={state === 'loading'}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {state === 'loading'
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>
                        <Download className="w-5 h-5 mr-2" />
                        Download gratis beweegplan
                      </>
                  }
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Geen spam. We sturen alleen een bericht als ArtroCare opengaat.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* CTA to full program */}
        <div className="text-center bg-white rounded-xl border border-gray-100 p-6 space-y-3">
          <p className="text-sm text-gray-500">Wil je meer dan 7 dagen?</p>
          <p className="font-semibold text-gray-900">
            Het volledige 12-weken ArtroCare programma is er voor founding members vanaf <span className="text-blue-600">€97</span>.
          </p>
          <Link to="/voor-patienten">
            <Button variant="outline" size="sm">Meer informatie</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
