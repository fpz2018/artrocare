import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Clock, CheckCircle, Users, Mail, Phone, MapPin, Globe,
  Loader2, UserPlus, Copy, Check, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS = {
  pending:   { label: 'Wacht op goedkeuring', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved:  { label: 'Goedgekeurd',          color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  rejected:  { label: 'Afgewezen',            color: 'bg-red-100 text-red-800',      icon: Clock },
  suspended: { label: 'Gesuspendeerd',        color: 'bg-gray-100 text-gray-700',    icon: Clock },
};

function InviteSection({ practiceId, practiceStatus }) {
  const [email, setEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: invitations = [] } = useQuery({
    queryKey: ['practice-invitations', practiceId],
    enabled: !!practiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('role', 'therapist')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createInvite = useMutation({
    mutationFn: async (inviteEmail) => {
      // Check of er al een pending uitnodiging is voor dit email
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('practice_id', practiceId)
        .eq('email', inviteEmail.toLowerCase())
        .eq('status', 'pending')
        .single();
      if (existing) throw new Error('Er is al een openstaande uitnodiging voor dit e-mailadres.');

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail.toLowerCase(),
          role: 'therapist',
          practice_id: practiceId,
          invited_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-invitations', practiceId] });
      setEmail('');
      toast.success('Uitnodiging aangemaakt');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-invitations', practiceId] });
      toast.success('Uitnodiging verwijderd');
    },
    onError: (err) => toast.error(err.message),
  });

  const copyLink = async (token) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Link gekopieerd');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Voer een geldig e-mailadres in');
      return;
    }
    createInvite.mutate(email.trim());
  };

  if (practiceStatus !== 'approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gray-400" /> Therapeuten uitnodigen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-400 text-center py-4">
            Uitnodigen is beschikbaar nadat je praktijk is goedgekeurd.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gray-400" /> Therapeuten uitnodigen
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Uitnodigingsformulier */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="therapeut@praktijk.nl"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={createInvite.isPending} size="sm">
            {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uitnodigen'}
          </Button>
        </form>

        {/* Bestaande uitnodigingen */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Openstaande uitnodigingen</p>
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    {inv.status === 'accepted' ? 'Geaccepteerd' : inv.status === 'expired' ? 'Verlopen' : 'Wacht op acceptatie'}
                    {' · '}
                    Verloopt {new Date(inv.expires_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {inv.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                      onClick={() => copyLink(inv.token)}
                      title="Kopieer uitnodigingslink"
                    >
                      {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                  {inv.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => deleteInvite.mutate(inv.id)}
                      title="Verwijder uitnodiging"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PracticeAdmin() {
  const { profile } = useAuth();

  const { data: practice, isLoading } = useQuery({
    queryKey: ['my-practice', profile?.practice_id],
    enabled: !!profile?.practice_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .eq('id', profile.practice_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: therapists = [] } = useQuery({
    queryKey: ['practice-therapists', profile?.practice_id],
    enabled: !!profile?.practice_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('practice_id', profile.practice_id)
        .eq('role', 'therapist');
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const cfg = STATUS[practice?.status] || STATUS.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{practice?.name || 'Mijn Praktijk'}</h1>
          <p className="text-sm text-gray-500">Praktijkbeheer</p>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <Badge className={`${cfg.color} border-0 flex items-center gap-1 w-fit`}>
                <StatusIcon className="w-3 h-3" /> {cfg.label}
              </Badge>
            </div>
            {practice?.status === 'pending' && (
              <p className="text-xs text-gray-400 text-right max-w-[180px]">
                Je praktijk wacht op goedkeuring. Je ontvangt bericht zodra dit is verwerkt.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Praktijkgegevens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">Praktijkgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {practice?.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{practice.address}{practice.postal_code ? `, ${practice.postal_code}` : ''} — {practice.city}</span>
            </div>
          )}
          {practice?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>{practice.phone}</span>
            </div>
          )}
          {practice?.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <a href={`mailto:${practice.email}`} className="text-blue-600 hover:underline">{practice.email}</a>
            </div>
          )}
          {practice?.website && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <a href={practice.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{practice.website}</a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Therapeuten uitnodigen */}
      <InviteSection practiceId={profile?.practice_id} practiceStatus={practice?.status} />

      {/* Therapeuten lijst */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Therapeuten ({therapists.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {therapists.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nog geen therapeuten actief</p>
            </div>
          ) : (
            <div className="space-y-2">
              {therapists.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{t.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
