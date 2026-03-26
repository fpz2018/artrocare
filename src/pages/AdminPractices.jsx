import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, MapPin, Mail, Phone, Globe, Clock,
  CheckCircle, XCircle, Users, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CFG = {
  pending:   { label: 'Wacht op goedkeuring', color: 'bg-yellow-100 text-yellow-800' },
  approved:  { label: 'Goedgekeurd',          color: 'bg-green-100 text-green-800'  },
  rejected:  { label: 'Afgewezen',            color: 'bg-red-100 text-red-800'      },
  suspended: { label: 'Gesuspendeerd',        color: 'bg-gray-100 text-gray-700'    },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

function PracticeCard({ practice, onApprove, onReject, onSuspend, loadingId }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[practice.status] || STATUS_CFG.pending;
  const isLoading = loadingId === practice.id;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{practice.name}</p>
              <p className="text-xs text-gray-500">{practice.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t bg-gray-50 space-y-4">
            <div className="pt-3 space-y-2">
              {practice.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{practice.address}{practice.postal_code ? `, ${practice.postal_code}` : ''}</span>
                </div>
              )}
              {practice.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{practice.phone}</span>
                </div>
              )}
              {practice.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`mailto:${practice.email}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{practice.email}</a>
                </div>
              )}
              {practice.website && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <a href={practice.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{practice.website}</a>
                </div>
              )}
            </div>

            {practice.admin && (
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Beheerder
                </p>
                <p className="text-sm font-medium text-gray-900">{practice.admin.full_name || '—'}</p>
                <p className="text-xs text-gray-500">{practice.admin.email}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Aangemeld: {new Date(practice.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="flex gap-2">
              {practice.status === 'pending' && (
                <>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading} onClick={() => onApprove(practice.id)}>
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                    Goedkeuren
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" disabled={isLoading} onClick={() => onReject(practice.id)}>
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    Afwijzen
                  </Button>
                </>
              )}
              {practice.status === 'approved' && (
                <Button size="sm" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100" disabled={isLoading} onClick={() => onSuspend(practice.id)}>
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  Suspenderen
                </Button>
              )}
              {(practice.status === 'rejected' || practice.status === 'suspended') && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading} onClick={() => onApprove(practice.id)}>
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                  Alsnog goedkeuren
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPractices() {
  const [filter, setFilter] = useState('pending');
  const [loadingId, setLoadingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: practices = [], isLoading } = useQuery({
    queryKey: ['admin-practices'],
    queryFn: async () => {
      const { data: practs, error } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = practs.map(p => p.id);
      if (ids.length === 0) return [];

      const { data: admins } = await supabase
        .from('profiles')
        .select('id, full_name, email, practice_id')
        .eq('role', 'practice_admin')
        .in('practice_id', ids);

      const adminMap = {};
      (admins || []).forEach(a => { adminMap[a.practice_id] = a; });

      return practs.map(p => ({ ...p, admin: adminMap[p.id] || null }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('practices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-practices'] });
      const msgs = { approved: 'Praktijk goedgekeurd', rejected: 'Praktijk afgewezen', suspended: 'Praktijk gesuspendeerd' };
      toast.success(msgs[status] || 'Status bijgewerkt');
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setLoadingId(null),
  });

  const handleAction = (id, status) => {
    setLoadingId(id);
    updateStatus.mutate({ id, status });
  };

  const filtered = filter === 'all' ? practices : practices.filter(p => p.status === filter);

  const counts = {
    all:      practices.length,
    pending:  practices.filter(p => p.status === 'pending').length,
    approved: practices.filter(p => p.status === 'approved').length,
    rejected: practices.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Praktijken</h1>
          <p className="text-sm text-gray-500">Beheer en goedkeuring</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'Alle' : STATUS_CFG[f]?.label.split(' ')[0]}
            {counts[f] > 0 && <span className="ml-1 text-gray-400">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Geen praktijken gevonden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PracticeCard
              key={p.id}
              practice={p}
              loadingId={loadingId}
              onApprove={id => handleAction(id, 'approved')}
              onReject={id => handleAction(id, 'rejected')}
              onSuspend={id => handleAction(id, 'suspended')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
