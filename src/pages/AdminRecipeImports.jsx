import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp,
  ExternalLink, AlertTriangle, RefreshCw, ChefHat, Image, UtensilsCrossed,
  Timer, Users as UsersIcon, Plus
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Wacht',       color: 'bg-gray-100 text-gray-600' },
  fetching:  { label: 'Ophalen...',  color: 'bg-yellow-100 text-yellow-700' },
  extracted: { label: 'Geëxtraheerd', color: 'bg-blue-100 text-blue-700' },
  approved:  { label: 'Goedgekeurd', color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Afgewezen',   color: 'bg-red-100 text-red-700' },
  error:     { label: 'Fout',        color: 'bg-red-100 text-red-600' },
};

// ─── Import Card ──────────────────────────────────────────

function ImportCard({ item, onApprove, onReject, isUpdating }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const data = editData || item.extracted_data;
  const hasData = !!data;

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(item.extracted_data)));
    setEditing(true);
  };

  const updateField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateIngredient = (index, field, value) => {
    setEditData(prev => {
      const ings = [...(prev.ingredients || [])];
      ings[index] = { ...ings[index], [field]: value };
      return { ...prev, ingredients: ings };
    });
  };

  const removeIngredient = (index) => {
    setEditData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addIngredient = () => {
    setEditData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name_nl: '', name_en: '', amount: '', unit: '', category: 'overig' }],
    }));
  };

  return (
    <Card className={`transition-all ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          {hasData && data.image_url && (
            <img
              src={data.image_url}
              alt={data.title_nl || ''}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
              {hasData && data.tags?.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {item.title || data?.title_nl || 'Onbekend recept'}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              {hasData && data.prep_time_minutes && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {data.prep_time_minutes + (data.cook_time_minutes || 0)} min
                </span>
              )}
              {hasData && data.servings && (
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-3 h-3" />
                  {data.servings} pers.
                </span>
              )}
              {hasData && data.calories && (
                <span>{data.calories} kcal</span>
              )}
              <span>{new Date(item.created_at).toLocaleDateString('nl-NL')}</span>
            </div>

            {item.error_message && (
              <p className="text-xs text-red-500 mt-1">{item.error_message}</p>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expanded content */}
        {expanded && hasData && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Image preview */}
            {data.image_url && (
              <div>
                <img
                  src={data.image_url}
                  alt={data.title_nl || ''}
                  className="w-full max-h-64 object-cover rounded-lg"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Beschrijving */}
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Titel (NL)</Label>
                  <Input value={editData.title_nl || ''} onChange={e => updateField('title_nl', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Titel (EN)</Label>
                  <Input value={editData.title_en || ''} onChange={e => updateField('title_en', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Beschrijving (NL)</Label>
                  <Textarea value={editData.description_nl || ''} onChange={e => updateField('description_nl', e.target.value)} rows={2} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Beschrijving (EN)</Label>
                  <Textarea value={editData.description_en || ''} onChange={e => updateField('description_en', e.target.value)} rows={2} className="text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Bereidingstijd (min)</Label>
                    <Input type="number" value={editData.prep_time_minutes || ''} onChange={e => updateField('prep_time_minutes', parseInt(e.target.value) || null)} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Kooktijd (min)</Label>
                    <Input type="number" value={editData.cook_time_minutes || ''} onChange={e => updateField('cook_time_minutes', parseInt(e.target.value) || null)} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Porties</Label>
                    <Input type="number" value={editData.servings || ''} onChange={e => updateField('servings', parseInt(e.target.value) || null)} className="text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Calorieën</Label>
                    <Input type="number" value={editData.calories || ''} onChange={e => updateField('calories', parseInt(e.target.value) || null)} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Eiwit (g)</Label>
                    <Input type="number" value={editData.protein_g || ''} onChange={e => updateField('protein_g', parseFloat(e.target.value) || null)} className="text-sm" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {data.description_nl && (
                  <p className="text-sm text-gray-600">{data.description_nl}</p>
                )}
              </>
            )}

            {/* Ingrediënten */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <UtensilsCrossed className="w-4 h-4" />
                Ingrediënten ({data.ingredients?.length || 0})
              </h4>
              {editing ? (
                <div className="space-y-2">
                  {(editData.ingredients || []).map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={ing.amount || ''}
                        onChange={e => updateIngredient(i, 'amount', e.target.value)}
                        placeholder="Hoeveelheid"
                        className="w-20 text-xs"
                      />
                      <Input
                        value={ing.unit || ''}
                        onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        placeholder="Eenheid"
                        className="w-16 text-xs"
                      />
                      <Input
                        value={ing.name_nl || ''}
                        onChange={e => updateIngredient(i, 'name_nl', e.target.value)}
                        placeholder="Ingrediënt (NL)"
                        className="flex-1 text-xs"
                      />
                      <Input
                        value={ing.name_en || ''}
                        onChange={e => updateIngredient(i, 'name_en', e.target.value)}
                        placeholder="(EN)"
                        className="w-32 text-xs"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 px-1">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addIngredient} className="text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Ingrediënt toevoegen
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {(data.ingredients || []).map((ing, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      <span className="text-gray-900 font-medium">
                        {ing.amount ? `${ing.amount} ${ing.unit || ''} ` : ''}
                      </span>
                      {ing.name_nl || ing.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Instructies */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Bereiding</h4>
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Instructies (NL)</Label>
                    <Textarea value={editData.instructions_nl || ''} onChange={e => updateField('instructions_nl', e.target.value)} rows={5} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Instructies (EN)</Label>
                    <Textarea value={editData.instructions_en || ''} onChange={e => updateField('instructions_en', e.target.value)} rows={5} className="text-sm" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(data.instructions_nl || '').split('\n').filter(Boolean).map((step, i) => (
                    <p key={i} className="text-sm text-gray-600 pl-4 relative">
                      <span className="absolute left-0 text-blue-500 font-semibold">{i + 1}.</span>
                      {step.replace(/^Stap \d+:\s*/i, '')}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Bron URL */}
            <div className="pt-2 border-t">
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {item.source_url}
              </a>
            </div>

            {/* Acties */}
            {item.status === 'extracted' && (
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(item.id, editData)}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Opslaan & goedkeuren
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditData(null); }}>
                      Annuleren
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(item.id, null)}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Goedkeuren
                    </Button>
                    <Button size="sm" variant="outline" onClick={startEditing}>
                      Bewerken
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onReject(item.id)}
                      disabled={isUpdating}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Afwijzen
                    </Button>
                  </>
                )}
              </div>
            )}

            {item.status === 'approved' && item.approved_at && (
              <p className="text-xs text-green-600 pt-2 border-t">
                Goedgekeurd op {new Date(item.approved_at).toLocaleString('nl-NL')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hoofdpagina ──────────────────────────────────────────

export default function AdminRecipeImports() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('extracted');
  const [manualUrl, setManualUrl] = useState('');

  const isAdmin = profile?.role === 'admin';

  const { data: imports = [], isLoading } = useQuery({
    queryKey: ['recipe-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, editedData }) => {
      const { data, error } = await supabase
        .rpc('approve_recipe_import', {
          import_id: id,
          admin_id: user.id,
          edited_data: editedData,
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-imports'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recept goedgekeurd en aangemaakt!');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('recipe_imports')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-imports'] });
      toast.success('Import afgewezen');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const importMutation = useMutation({
    mutationFn: async (url) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/import-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'process_single', url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import mislukt');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-imports'] });
      setManualUrl('');
      toast.success('Recept geïmporteerd!');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const runPipelineMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/import-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Pipeline mislukt');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-imports'] });
      toast.success(`Pipeline klaar: ${data.extracted || 0} recepten geëxtraheerd`);
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const isUpdating = approveMutation.isPending || rejectMutation.isPending;

  const stats = {
    pending: imports.filter(i => i.status === 'pending' || i.status === 'fetching').length,
    extracted: imports.filter(i => i.status === 'extracted').length,
    approved: imports.filter(i => i.status === 'approved').length,
    rejected: imports.filter(i => i.status === 'rejected').length,
    error: imports.filter(i => i.status === 'error').length,
  };

  const filtered = statusFilter === 'all'
    ? imports
    : imports.filter(i => {
      if (statusFilter === 'pending') return i.status === 'pending' || i.status === 'fetching';
      return i.status === statusFilter;
    });

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">Alleen voor administrators</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-orange-500" />
            Recept Import
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Importeer en beoordeel recepten uit externe bronnen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runPipelineMutation.mutate()}
            disabled={runPipelineMutation.isPending}
          >
            {runPipelineMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Sheet verwerken
          </Button>
        </div>
      </div>

      {/* Handmatige URL import */}
      <Card>
        <CardContent className="p-4">
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              if (manualUrl.trim()) importMutation.mutate(manualUrl.trim());
            }}
          >
            <Input
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              placeholder="Plak een recept-URL om direct te importeren..."
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!manualUrl.trim() || importMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Statistieken */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: 'extracted', label: 'Te beoordelen', count: stats.extracted, color: 'text-blue-500', icon: Clock },
          { key: 'approved',  label: 'Goedgekeurd',   count: stats.approved,  color: 'text-green-500', icon: CheckCircle },
          { key: 'pending',   label: 'In wachtrij',   count: stats.pending,   color: 'text-yellow-500', icon: Loader2 },
          { key: 'rejected',  label: 'Afgewezen',     count: stats.rejected,  color: 'text-red-400', icon: XCircle },
          { key: 'error',     label: 'Fouten',        count: stats.error,     color: 'text-red-500', icon: AlertTriangle },
        ].map(({ key, label, count, color, icon: Icon }) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === key ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <CardContent className="p-3 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: `Alles (${imports.length})` },
          { key: 'extracted', label: `Te beoordelen (${stats.extracted})` },
          { key: 'approved',  label: `Goedgekeurd (${stats.approved})` },
          { key: 'rejected',  label: `Afgewezen (${stats.rejected})` },
          { key: 'error',     label: `Fouten (${stats.error})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === key
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Import cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 mx-auto animate-spin" />
          <p className="text-sm text-gray-500 mt-2">Imports laden...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600">Geen imports</h3>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === 'extracted'
                ? 'Geen recepten klaar voor beoordeling. Voeg URLs toe aan je Google Sheet of plak er een hierboven.'
                : 'Geen imports in deze categorie.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <ImportCard
              key={item.id}
              item={item}
              onApprove={(id, editedData) => approveMutation.mutate({ id, editedData })}
              onReject={(id) => rejectMutation.mutate(id)}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
