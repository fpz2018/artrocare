import React, { useState, Suspense, lazy } from 'react';
import { supabase } from '@/api/supabase';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Check, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Lazy-load the 3D player
const ExercisePlayer = lazy(() => import('@/components/exercises/3d/ExercisePlayer'));

// Import all concept exercise data
import SeatedKneeExtensionData from '@/components/exercises/3d/exercises/SeatedKneeExtension';

// ─── All concept exercises with their DB fields ────────────────────────────
const CONCEPT_EXERCISES = [
  {
    animationData: SeatedKneeExtensionData,
    db: {
      title_nl: 'Zittend knie-extensie',
      title_en: 'Seated Knee Extension',
      description_nl: 'Zittend op een stoel het been strekken om de quadriceps te versterken. Een basis NEMEX-oefening voor knieartrose.',
      description_en: 'Seated on a chair, extend the leg to strengthen the quadriceps. A core NEMEX exercise for knee arthrosis.',
      instructions_nl: 'Ga rechtop zitten op een stevige stoel. Strek langzaam uw rechter onderbeen tot het been bijna gestrekt is. Houd 2 seconden vast en laat langzaam zakken. Wissel na de set van been.',
      instructions_en: 'Sit upright on a sturdy chair. Slowly extend your right lower leg until nearly straight. Hold for 2 seconds and slowly lower. Switch legs after the set.',
      focus_points_nl: ['Houd je rug recht tegen de stoelleuning', 'Strek je been langzaam en gecontroleerd', 'Houd je voet in een ontspannen positie'],
      focus_points_en: ['Keep your back straight against the chair', 'Extend your leg slowly and controlled', 'Keep your foot in a relaxed position'],
      circle: 'strength',
      level: 1,
      sets: 3,
      reps: '10-15',
      duration_minutes: 5,
      is_nemex: true,
      has_video: false,
      sort_order: 10,
    },
  },
];

// ─── Exercise Concept Card ─────────────────────────────────────────────────
function ConceptCard({ concept, lang, onPreview, onApprove, isApproving, isApproved }) {
  const db = concept.db;
  const title = lang === 'nl' ? db.title_nl : db.title_en;
  const description = lang === 'nl' ? db.description_nl : db.description_en;
  const focusPoints = lang === 'nl' ? db.focus_points_nl : db.focus_points_en;

  return (
    <Card className={`transition-all ${isApproved ? 'bg-green-50 border-green-300' : 'hover:shadow-lg'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Lv. {db.level}</Badge>
            <Badge variant="secondary" className="text-xs">{db.sets}x {db.reps}</Badge>
            {db.is_nemex && <Badge className="bg-emerald-100 text-emerald-700 text-xs">NEMEX</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{description}</p>

        {/* Focus points */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">
            {lang === 'nl' ? 'Aandachtspunten:' : 'Focus points:'}
          </p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {focusPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">-</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(concept)}
            className="gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {lang === 'nl' ? '3D Bekijken' : '3D Preview'}
          </Button>

          {isApproved ? (
            <Badge className="bg-green-100 text-green-700 gap-1">
              <Check className="w-3.5 h-3.5" />
              {lang === 'nl' ? 'Goedgekeurd' : 'Approved'}
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => onApprove(concept)}
              disabled={isApproving}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {isApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {lang === 'nl' ? 'Goedkeuren & Publiceren' : 'Approve & Publish'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Concept Page ─────────────────────────────────────────────────────
export default function ConceptExercises() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [previewExercise, setPreviewExercise] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [approvedIds, setApprovedIds] = useState(new Set());

  const handleApprove = async (concept) => {
    const id = concept.animationData.id;
    setApprovingId(id);

    try {
      const { error } = await supabase
        .from('exercises')
        .insert({
          title_nl: concept.db.title_nl,
          title_en: concept.db.title_en,
          description_nl: concept.db.description_nl,
          description_en: concept.db.description_en,
          instructions_nl: concept.db.instructions_nl,
          instructions_en: concept.db.instructions_en,
          focus_points_nl: concept.db.focus_points_nl,
          focus_points_en: concept.db.focus_points_en,
          circle: concept.db.circle,
          level: concept.db.level,
          sets: concept.db.sets,
          reps: concept.db.reps,
          duration_minutes: concept.db.duration_minutes,
          is_nemex: concept.db.is_nemex,
          has_video: concept.db.has_video,
          sort_order: concept.db.sort_order,
        });

      if (error) throw error;

      setApprovedIds(prev => new Set([...prev, id]));
      toast.success(
        language === 'nl'
          ? `"${concept.db.title_nl}" is gepubliceerd en staat nu bij Oefeningen!`
          : `"${concept.db.title_en}" has been published and is now available in Exercises!`
      );
    } catch (err) {
      console.error('Failed to approve exercise:', err);
      toast.error(
        language === 'nl'
          ? `Fout bij publiceren: ${err.message}`
          : `Error publishing: ${err.message}`
      );
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {language === 'nl' ? 'Concept Oefeningen' : 'Concept Exercises'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {language === 'nl'
              ? 'Bekijk en beoordeel 3D-oefeningen. Keur goed om ze te publiceren naar de Oefeningen-pagina.'
              : 'Preview and review 3D exercises. Approve to publish them to the Exercises page.'}
          </p>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-4">
        {CONCEPT_EXERCISES.map((concept) => (
          <ConceptCard
            key={concept.animationData.id}
            concept={concept}
            lang={language}
            onPreview={setPreviewExercise}
            onApprove={handleApprove}
            isApproving={approvingId === concept.animationData.id}
            isApproved={approvedIds.has(concept.animationData.id)}
          />
        ))}
      </div>

      {CONCEPT_EXERCISES.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          {language === 'nl' ? 'Geen concept-oefeningen beschikbaar.' : 'No concept exercises available.'}
        </div>
      )}

      {/* 3D Preview Dialog */}
      <Dialog open={!!previewExercise} onOpenChange={() => setPreviewExercise(null)}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>
              {previewExercise && (language === 'nl'
                ? previewExercise.db.title_nl
                : previewExercise.db.title_en)}
            </DialogTitle>
            <DialogDescription>
              {language === 'nl' ? '3D-animatie preview' : '3D animation preview'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            {previewExercise && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                }
              >
                <ExercisePlayer exerciseData={previewExercise.animationData} />
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
