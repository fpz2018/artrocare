import React, { useState } from 'react';
import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2 } from 'lucide-react';

/**
 * WaitlistForm — herbruikbaar op LandingPatient en LandingPractice
 * role: 'patient' | 'practice'
 * showNameField: toon optioneel naamveld (handig voor praktijken)
 */
export default function WaitlistForm({ role, showNameField = false, className = '' }) {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
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
      .insert({ email: trimmed, role, name: name.trim() || null });

    if (error) {
      if (error.code === '23505') {
        // unique violation — al aangemeld
        setState('success');
      } else {
        setErrorMsg('Er ging iets mis. Probeer het opnieuw.');
        setState('idle');
      }
    } else {
      setState('success');
    }
  };

  if (state === 'success') {
    return (
      <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
        <CheckCircle className="w-8 h-8 text-green-500" />
        <p className="font-semibold text-gray-900">Je staat op de lijst!</p>
        <p className="text-sm text-gray-500">
          We laten je weten zodra {role === 'practice' ? 'Artrocare opengaat voor jouw praktijk' : 'je uitnodiging klaarstaat'}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      {showNameField && (
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={role === 'practice' ? 'Naam van je praktijk' : 'Jouw naam'}
          className="bg-white"
        />
      )}
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jouw@email.nl"
          required
          className="bg-white flex-1"
        />
        <Button
          type="submit"
          disabled={state === 'loading'}
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          {state === 'loading'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : 'Aanmelden'}
        </Button>
      </div>
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      <p className="text-xs text-gray-400">Geen spam. Alleen een bericht als Artrocare opengaat.</p>
    </form>
  );
}
