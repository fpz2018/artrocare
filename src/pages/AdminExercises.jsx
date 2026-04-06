import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Dumbbell, Plus, Search, Loader2, Trash2, Pencil, Video, Image as ImageIcon,
  Upload, Sparkles, FileUp, X, AlertTriangle, GripVertical, Play,
} from 'lucide-react';

const CIRCLES = ['warmup', 'strength', 'flexibility', 'balance', 'cooldown'];
const LEVELS = [1, 2, 3];
const LEVEL_COLORS = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-red-100 text-red-700',
};
const CIRCLE_COLORS = {
  warmup: 'bg-orange-100 text-orange-700',
  strength: 'bg-blue-100 text-blue-700',
  flexibility: 'bg-purple-100 text-purple-700',
  balance: 'bg-teal-100 text-teal-700',
  cooldown: 'bg-sky-100 text-sky-700',
};

const EMPTY_EXERCISE = {
  title_nl: '', title_en: '', description_nl: '', description_en: '',
  instructions_nl: '', instructions_en: '',
  focus_points_nl: [], focus_points_en: [],
  circle: 'strength', level: 1, sets: 3, reps: 10,
  duration_minutes: null, sort_order: 0,
};

// ─── Exercise Card ───────────────────────────────────────

function ExerciseCard({ exercise, onEdit, onDelete }) {
  return (
    <Card className="group hover:shadow-md transition-all cursor-pointer" onClick={() => onEdit(exercise)}>
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative h-36 bg-gray-100 rounded-t-lg overflow-hidden">
          {exercise.image_url ? (
            <img src={exercise.image_url} alt={exercise.title_nl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-gray-300" />
            </div>
          )}
          {exercise.has_video && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5">
              <Play className="w-3 h-3" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge className={`text-xs ${LEVEL_COLORS[exercise.level] || LEVEL_COLORS[1]}`}>
              Level {exercise.level}
            </Badge>
            <Badge className={`text-xs ${CIRCLE_COLORS[exercise.circle] || 'bg-gray-100 text-gray-700'}`}>
              {exercise.circle}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-900 truncate">{exercise.title_nl || 'Geen titel'}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {exercise.sets && exercise.reps && <span>{exercise.sets}x{exercise.reps}</span>}
            {exercise.duration_minutes && <span>{exercise.duration_minutes} min</span>}
            <span className="ml-auto text-gray-400">#{exercise.sort_order}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex border-t opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(exercise); }}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Bewerken
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(exercise); }}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors border-l"
          >
            <Trash2 className="w-3 h-3" /> Verwijder
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Media Upload ────────────────────────────────────────

function MediaUpload({ exerciseId, currentUrl, type, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const accept = type === 'image' ? 'image/jpeg,image/png' : 'video/mp4,video/webm';
  const bucket = 'exercise-media';

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${exerciseId || `new_${Date.now()}`}/${type}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success(`${type === 'image' ? 'Afbeelding' : 'Video'} geüpload`);
    } catch (err) {
      toast.error(`Upload mislukt: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) upload(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
        dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {currentUrl && type === 'image' && (
        <img src={currentUrl} alt="" className="w-full h-32 object-cover rounded mb-2" />
      )}
      {currentUrl && type === 'video' && (
        <video src={currentUrl} controls className="w-full h-32 rounded mb-2" />
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => upload(e.target.files?.[0])} />
      <Button
        variant="outline" size="sm" disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
        {type === 'image' ? 'Afbeelding' : 'Video'} uploaden
      </Button>
      <p className="text-xs text-gray-400 mt-1">of sleep een bestand hierheen</p>
    </div>
  );
}

// ─── Edit Dialog ─────────────────────────────────────────

function ExerciseDialog({ open, onOpenChange, exercise, onSaved }) {
  const isNew = !exercise?.id;
  const [form, setForm] = useState(exercise || EMPTY_EXERCISE);
  const [generating, setGenerating] = useState(false);
  const [aiJoint, setAiJoint] = useState('knie');

  // Reset form when exercise changes
  React.useEffect(() => {
    setForm(exercise || EMPTY_EXERCISE);
  }, [exercise]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      // Clean up arrays
      if (typeof payload.focus_points_nl === 'string') {
        payload.focus_points_nl = payload.focus_points_nl.split('\n').filter(Boolean);
      }
      if (typeof payload.focus_points_en === 'string') {
        payload.focus_points_en = payload.focus_points_en.split('\n').filter(Boolean);
      }
      // Ensure numeric types
      payload.level = parseInt(payload.level) || 1;
      payload.sets = parseInt(payload.sets) || null;
      payload.reps = parseInt(payload.reps) || null;
      payload.duration_minutes = parseInt(payload.duration_minutes) || null;
      payload.sort_order = parseInt(payload.sort_order) || 0;

      if (isNew) {
        delete payload.id;
        const { data, error } = await supabase.from('exercises').insert(payload).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('exercises').update(payload).eq('id', form.id).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(isNew ? 'Oefening aangemaakt!' : 'Oefening bijgewerkt!');
      onSaved(data);
      onOpenChange(false);
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessie verlopen');

      const res = await fetch('/.netlify/functions/import-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate_exercise',
          joint: aiJoint,
          level: form.level,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'AI generatie mislukt';
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }
      const { data } = await res.json();
      setForm(prev => ({
        ...prev,
        ...data,
        focus_points_nl: data.focus_points_nl || [],
        focus_points_en: data.focus_points_en || [],
      }));
      toast.success('AI heeft de oefening gegenereerd. Pas aan en sla op.');
    } catch (err) {
      toast.error(`Fout: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            {isNew ? 'Nieuwe oefening' : 'Oefening bewerken'}
          </DialogTitle>
          <DialogDescription>
            {isNew ? 'Voeg handmatig toe of genereer met AI' : `ID: ${form.id}`}
          </DialogDescription>
        </DialogHeader>

        {/* AI Generator (alleen bij nieuw) */}
        {isNew && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Genereer met AI
            </p>
            <div className="flex gap-2">
              <select
                value={aiJoint}
                onChange={e => setAiJoint(e.target.value)}
                className="text-sm border rounded px-2 py-1.5 bg-white"
              >
                <option value="knie">Knie</option>
                <option value="heup">Heup</option>
                <option value="schouder">Schouder</option>
                <option value="rug">Rug</option>
                <option value="hand">Hand/pols</option>
                <option value="enkel">Enkel/voet</option>
              </select>
              <select
                value={form.level}
                onChange={e => set('level', parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1.5 bg-white"
              >
                <option value={1}>Level 1 (licht)</option>
                <option value={2}>Level 2 (gemiddeld)</option>
                <option value={3}>Level 3 (intensief)</option>
              </select>
              <Button size="sm" disabled={generating} onClick={generateWithAI} className="bg-purple-600 hover:bg-purple-700">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Genereer
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Titels */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Titel (NL) *</Label>
              <Input value={form.title_nl || ''} onChange={e => set('title_nl', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Titel (EN)</Label>
              <Input value={form.title_en || ''} onChange={e => set('title_en', e.target.value)} />
            </div>
          </div>

          {/* Beschrijving */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Beschrijving (NL)</Label>
              <Textarea rows={2} value={form.description_nl || ''} onChange={e => set('description_nl', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Beschrijving (EN)</Label>
              <Textarea rows={2} value={form.description_en || ''} onChange={e => set('description_en', e.target.value)} />
            </div>
          </div>

          {/* Instructies */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Instructies (NL)</Label>
              <Textarea rows={4} value={form.instructions_nl || ''} onChange={e => set('instructions_nl', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Instructies (EN)</Label>
              <Textarea rows={4} value={form.instructions_en || ''} onChange={e => set('instructions_en', e.target.value)} />
            </div>
          </div>

          {/* Focus punten */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Focuspunten (NL) — 1 per regel</Label>
              <Textarea
                rows={3}
                value={Array.isArray(form.focus_points_nl) ? form.focus_points_nl.join('\n') : (form.focus_points_nl || '')}
                onChange={e => set('focus_points_nl', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Focuspunten (EN) — 1 per regel</Label>
              <Textarea
                rows={3}
                value={Array.isArray(form.focus_points_en) ? form.focus_points_en.join('\n') : (form.focus_points_en || '')}
                onChange={e => set('focus_points_en', e.target.value)}
              />
            </div>
          </div>

          {/* Meta velden */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Circle</Label>
              <select value={form.circle || 'strength'} onChange={e => set('circle', e.target.value)} className="w-full text-sm border rounded px-2 py-2 bg-white">
                {CIRCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <select value={form.level || 1} onChange={e => set('level', parseInt(e.target.value))} className="w-full text-sm border rounded px-2 py-2 bg-white">
                {LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Sortering</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={e => set('sort_order', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Sets</Label>
              <Input type="number" value={form.sets ?? ''} onChange={e => set('sets', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Reps</Label>
              <Input type="number" value={form.reps ?? ''} onChange={e => set('reps', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Duur (min)</Label>
              <Input type="number" value={form.duration_minutes ?? ''} onChange={e => set('duration_minutes', e.target.value)} />
            </div>
          </div>

          {/* Media upload */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Afbeelding</Label>
              <MediaUpload
                exerciseId={form.id}
                currentUrl={form.image_url}
                type="image"
                onUploaded={url => set('image_url', url)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Video</Label>
              <MediaUpload
                exerciseId={form.id}
                currentUrl={form.video_url}
                type="video"
                onUploaded={url => { set('video_url', url); set('has_video', true); }}
              />
            </div>
          </div>
        </div>

        {/* Save/Cancel */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.title_nl}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {isNew ? 'Aanmaken' : 'Opslaan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Import Dialog ──────────────────────────────────

function BulkImportDialog({ open, onOpenChange, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    const text = await f.text();

    try {
      if (f.name.endsWith('.json')) {
        const data = JSON.parse(text);
        setPreview(Array.isArray(data) ? data : [data]);
      } else if (f.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(Boolean);
        if (lines.length < 2) { toast.error('CSV is leeg'); return; }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
          rows.push(obj);
        }
        setPreview(rows);
      } else {
        toast.error('Alleen CSV of JSON bestanden');
      }
    } catch (err) {
      toast.error(`Kan bestand niet lezen: ${err.message}`);
    }
  };

  const doImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      const cleaned = preview.map(row => ({
        title_nl: row.title_nl || row.title || '',
        title_en: row.title_en || '',
        description_nl: row.description_nl || '',
        description_en: row.description_en || '',
        instructions_nl: row.instructions_nl || '',
        instructions_en: row.instructions_en || '',
        circle: CIRCLES.includes(row.circle) ? row.circle : 'strength',
        level: parseInt(row.level) || 1,
        sets: parseInt(row.sets) || null,
        reps: parseInt(row.reps) || null,
        duration_minutes: parseInt(row.duration_minutes) || null,
        sort_order: parseInt(row.sort_order) || 0,
      }));

      const { error } = await supabase.from('exercises').insert(cleaned);
      if (error) throw error;

      toast.success(`${cleaned.length} oefeningen geïmporteerd!`);
      onImported();
      onOpenChange(false);
      setFile(null);
      setPreview([]);
    } catch (err) {
      toast.error(`Import mislukt: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-orange-500" />
            Oefeningen importeren
          </DialogTitle>
          <DialogDescription>Upload een CSV of JSON bestand</DialogDescription>
        </DialogHeader>

        {!preview.length ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('bulk-file-input')?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Sleep een bestand of klik om te selecteren</p>
            <p className="text-xs text-gray-400 mt-1">CSV of JSON — velden: title_nl, title_en, circle, level, sets, reps, ...</p>
            <input id="bulk-file-input" type="file" accept=".csv,.json" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{preview.length} oefeningen gevonden</p>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); }}>
                <X className="w-4 h-4 mr-1" /> Opnieuw
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {preview.map((row, i) => (
                <div key={i} className="px-3 py-2 text-sm flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-6">{i + 1}</span>
                  <span className="font-medium flex-1 truncate">{row.title_nl || row.title || '(geen titel)'}</span>
                  <Badge variant="outline" className="text-xs">{row.circle || '?'}</Badge>
                  <Badge variant="outline" className="text-xs">L{row.level || '?'}</Badge>
                </div>
              ))}
            </div>
            <Button onClick={doImport} disabled={importing} className="w-full bg-orange-500 hover:bg-orange-600">
              {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileUp className="w-4 h-4 mr-1" />}
              {preview.length} oefeningen importeren
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Hoofdpagina ─────────────────────────────────────────

export default function AdminExercises() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [filterCircle, setFilterCircle] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['admin-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('sort_order')
        .order('circle')
        .order('level');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setDeleteTarget(null);
      toast.success('Oefening verwijderd');
    },
    onError: (err) => toast.error(`Fout: ${err.message}`),
  });

  const handleEdit = (exercise) => {
    setEditExercise(exercise);
    setEditDialogOpen(true);
  };

  const handleNew = () => {
    setEditExercise(null);
    setEditDialogOpen(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
  };

  // Filter
  const filtered = exercises.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      if (!(e.title_nl || '').toLowerCase().includes(q) && !(e.title_en || '').toLowerCase().includes(q)) return false;
    }
    if (filterLevel && e.level !== filterLevel) return false;
    if (filterCircle && e.circle !== filterCircle) return false;
    return true;
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
            <Dumbbell className="w-7 h-7 text-blue-500" />
            Oefeningen Beheer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {exercises.length} oefeningen — {filtered.length} getoond
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
            <FileUp className="w-4 h-4 mr-1" /> Importeer
          </Button>
          <Button size="sm" onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1" /> Nieuwe oefening
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek oefening..."
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setFilterLevel(filterLevel === l ? null : l)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterLevel === l ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Level {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {CIRCLES.map(c => (
            <button
              key={c}
              onClick={() => setFilterCircle(filterCircle === c ? null : c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterCircle === c ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
          <p className="text-sm text-gray-500 mt-2">Laden...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Dumbbell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600">Geen oefeningen gevonden</h3>
            <p className="text-sm text-gray-400 mt-1">Voeg een oefening toe of pas de filters aan.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <ExerciseCard key={ex.id} exercise={ex} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <ExerciseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        exercise={editExercise}
        onSaved={handleSaved}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onImported={handleSaved}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Oefening verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title_nl}" wordt permanent verwijderd. Dit kan niet ongedaan worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
