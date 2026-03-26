import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Clock, CheckCircle, Users, Mail, Phone, MapPin, Globe, Loader2
} from 'lucide-react';

const STATUS = {
  pending:   { label: 'Wacht op goedkeuring', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved:  { label: 'Goedgekeurd',          color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  rejected:  { label: 'Afgewezen',            color: 'bg-red-100 text-red-800',      icon: Clock },
  suspended: { label: 'Gesuspendeerd',        color: 'bg-gray-100 text-gray-700',    icon: Clock },
};

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
      {/* Header */}
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
              <p className="text-sm text-gray-500 mb-1">Status aanmelding</p>
              <Badge className={`${cfg.color} border-0 flex items-center gap-1 w-fit`}>
                <StatusIcon className="w-3 h-3" /> {cfg.label}
              </Badge>
            </div>
            {practice?.status === 'pending' && (
              <p className="text-xs text-gray-400 text-right max-w-[180px]">
                Je praktijk wacht op goedkeuring van de beheerder. Je ontvangt bericht zodra dit is verwerkt.
              </p>
            )}
            {practice?.status === 'approved' && (
              <p className="text-xs text-gray-400 text-right max-w-[180px]">
                Je praktijk is actief. Je kunt nu therapeuten uitnodigen.
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

      {/* Therapeuten */}
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
              <p className="text-sm">Nog geen therapeuten</p>
              <p className="text-xs mt-1">Uitnodigingssysteem komt binnenkort beschikbaar</p>
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
