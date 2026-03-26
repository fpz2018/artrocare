import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, ChevronRight, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';

const STEPS = ['Praktijkgegevens', 'Jouw account'];

export default function RegisterPractice() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [practice, setPractice] = useState({
    name: '', city: '', address: '', postal_code: '', phone: '', email: '', website: '',
  });
  const [account, setAccount] = useState({
    full_name: '', email: '', password: '', password2: '',
  });

  const updatePractice = (k, v) => setPractice(p => ({ ...p, [k]: v }));
  const updateAccount  = (k, v) => setAccount(a => ({ ...a, [k]: v }));

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    if (!practice.name || !practice.city || !practice.email) {
      setError('Vul praktijknaam, stad en e-mailadres in.');
      return;
    }
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!account.full_name || !account.email || !account.password) {
      setError('Vul alle verplichte velden in.');
      return;
    }
    if (account.password !== account.password2) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (account.password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }

    setLoading(true);
    try {
      // 1. Account aanmaken
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.full_name } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Account aanmaken mislukt');

      // 2. Praktijk aanmelden + profiel updaten via RPC
      const { error: rpcError } = await supabase.rpc('register_practice', {
        p_name:        practice.name,
        p_city:        practice.city,
        p_address:     practice.address,
        p_postal_code: practice.postal_code,
        p_phone:       practice.phone,
        p_email:       practice.email,
        p_website:     practice.website,
        p_full_name:   account.full_name,
      });
      if (rpcError) throw rpcError;

      setDone(true);
    } catch (err) {
      setError(err.message || 'Er is iets misgegaan.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Aanmelding ontvangen!</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Je praktijk is aangemeld en wacht op goedkeuring. Je ontvangt een bevestiging zodra je account is geactiveerd.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>Terug naar inloggen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Praktijk aanmelden</h1>
          <p className="text-gray-500 text-sm mt-1">Artrose Kompas voor fysiotherapiepraktijken</p>
        </div>

        {/* Stap indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 text-sm font-medium ${i === step ? 'text-blue-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${i === step ? 'border-blue-600 bg-blue-50 text-blue-600' : i < step ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 text-gray-400'}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {label}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {step === 0 ? <><Building2 className="w-5 h-5 text-blue-500" /> Praktijkgegevens</> : <><User className="w-5 h-5 text-blue-500" /> Jouw account</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 ? (
              <form onSubmit={nextStep} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Praktijknaam <span className="text-red-500">*</span></Label>
                    <Input value={practice.name} onChange={e => updatePractice('name', e.target.value)} placeholder="Fysiopraktijk Zeist" />
                  </div>
                  <div className="space-y-1">
                    <Label>Stad <span className="text-red-500">*</span></Label>
                    <Input value={practice.city} onChange={e => updatePractice('city', e.target.value)} placeholder="Zeist" />
                  </div>
                  <div className="space-y-1">
                    <Label>Postcode</Label>
                    <Input value={practice.postal_code} onChange={e => updatePractice('postal_code', e.target.value)} placeholder="3700 AA" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Adres</Label>
                    <Input value={practice.address} onChange={e => updatePractice('address', e.target.value)} placeholder="Hoofdstraat 1" />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefoon</Label>
                    <Input value={practice.phone} onChange={e => updatePractice('phone', e.target.value)} placeholder="030-1234567" />
                  </div>
                  <div className="space-y-1">
                    <Label>E-mail praktijk <span className="text-red-500">*</span></Label>
                    <Input type="email" value={practice.email} onChange={e => updatePractice('email', e.target.value)} placeholder="info@praktijk.nl" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Website</Label>
                    <Input value={practice.website} onChange={e => updatePractice('website', e.target.value)} placeholder="https://www.praktijk.nl" />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full">
                  Volgende <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Jouw naam <span className="text-red-500">*</span></Label>
                  <Input value={account.full_name} onChange={e => updateAccount('full_name', e.target.value)} placeholder="Jan de Vries" />
                </div>
                <div className="space-y-1">
                  <Label>E-mailadres <span className="text-red-500">*</span></Label>
                  <Input type="email" value={account.email} onChange={e => updateAccount('email', e.target.value)} placeholder="jan@praktijk.nl" />
                </div>
                <div className="space-y-1">
                  <Label>Wachtwoord <span className="text-red-500">*</span></Label>
                  <Input type="password" value={account.password} onChange={e => updateAccount('password', e.target.value)} placeholder="Minimaal 8 tekens" />
                </div>
                <div className="space-y-1">
                  <Label>Wachtwoord bevestigen <span className="text-red-500">*</span></Label>
                  <Input type="password" value={account.password2} onChange={e => updateAccount('password2', e.target.value)} placeholder="Herhaal wachtwoord" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => { setStep(0); setError(''); }} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Terug
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Aanmelden
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Al een account?{' '}
          <Link to="/" className="text-blue-600 hover:underline">Inloggen</Link>
        </p>
      </div>
    </div>
  );
}
