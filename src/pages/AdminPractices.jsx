import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Building2, CheckCircle, XCircle, Clock, MapPin, Phone, Mail,
  Globe, Users, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  pending:   { label: 'Wacht op goedkeuring', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved:  { label: 'Goedgekeurd',          color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  rejected:  { label: 'Afgewezen',            color: 'bg-red-100 text-red-800',      icon: XCircle },
  suspended: { label: 'Gesuspendeerd',        color: 'bg-gray-100 text-gray-700',    icon: XCircle },
};

// ─── PracticeCard ─────────────────────────────────────────────────────────────

function PracticeCard({ practice, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actioning, setActioning] = useState(false);

  const cfg = STATUS[practice.status] || STATUS.pending;
  const Icon = cfg.icon;

  const handleApprove = async () => {
    setActioning(true);
    await onApprove(practice.id);
    setActioning(false);
  };

  const handleReject = async () => {
    setActioning(true);
    await onReject(practice.id, rejectReason);
    setActioning(false);
    setShowRejectForm(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{practice.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {practice.city || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${cfg.color} border-0 text-xs flex items-center gap-1`}>
              <Icon className="w-3 h-3" /> {cfg.label}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {/* Detail panel */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {practice.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{practice.address}{practice.postal_code ? `, ${practice.postal_code}` : ''}</span>
                </div>
              )}
              {practice.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{practice.phone}</span>
                </div>
              )}
              {practice.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${practice.email}`} className="text-blue-600 hover:underline">{practice.email}</a>
                </div>
              )}
              {practice.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <a href={practice.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{practice.website}</a>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              Aangemeld op {new Date(practice.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {practice.rejected_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Reden afwijzing:</strong> {practice.rejected_reason}
              </div>
            )}

            {/* Acties */}
            {practice.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApprove}
                  disabled={actioning}
                >
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Goedkeuren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectForm(v => !v)}
                  disabled={actioning}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Afwijzen
                </Button>
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reden voor afwijzing (optioneel)..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleReject} disabled={actioning}>
                    {actioning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Bevestig afwijzing
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>Annuleren</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hoofdpagina ──────────────────────────────────────────────────────────────

export default function AdminPractices() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: practices = [], isLoading } = useQuery({
    queryKey: ['admin-practices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.rpc('approve_practice', { p_practice_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Praktijk goedgekeurd');
      queryClient.invalidateQueries(['admin-practices']);
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const { error } = await supabase.rpc('reject_practice', { p_practice_id: id, p_reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Praktijk afgewezen');
      queryClient.invalidateQueries(['admin-practices']);
    },
    onError: (e) => toast.error(e.message),
  });

  const counts = {
    pending:  practices.filter(p => p.status === 'pending').length,
    approved: practices.filter(p => p.status === 'approved').length,
    rejected: practices.filter(p => p.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? practices : practices.filter(p => p.status === filter);

  const TABS = [
    { key: 'pending',  label: 'Wachtend',     count: counts.pending },
    { key: 'approved', label: 'Goedgekeurd',  count: counts.approved },
    { key: 'rejected', label: 'Afgewezen',    count: counts.rejected },
    { key: 'all',      label: 'Alle',         count: practices.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Titel */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Praktijkbeheer</h1>
          <p className="text-sm text-gray-500">Aanmeldingen beoordelen en praktijken beheren</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Wachtend</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
          <p className="text-xs text-gray-500 mt-1">Goedgekeurd</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-red-500">{counts.rejected}</p>
          <p className="text-xs text-gray-500 mt-1">Afgewezen</p>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-75">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Lijst */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Geen praktijken gevonden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PracticeCard
              key={p.id}
              practice={p}
              onApprove={(id) => approveMutation.mutateAsync(id)}
              onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
