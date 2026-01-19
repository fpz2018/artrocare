import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Dumbbell, 
  Clock, 
  Play,
  CheckCircle,
  X,
  Repeat,
  Sparkles,
  Target,
  AlertCircle,
  Flame,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const translations = {
  nl: {
    title: "Oefenprogramma",
    subtitle: "Gepersonaliseerde oefeningen voor jouw situatie",
    nemexTitle: "NEMEX-TJR Programma",
    nemexSubtitle: "Neuromusculair trainingsprogramma voor patiënten met geplande knie of heup prothese",
    generalTitle: "Algemeen Oefenprogramma",
    generalSubtitle: "Veilige en effectieve oefeningen voor artrose management",
    notEligible: "NEMEX-TJR Niet Beschikbaar",
    notEligibleDesc: "Het NEMEX-TJR programma is specifiek ontwikkeld voor patiënten die op de wachtlijst staan voor een totale knie of heup prothese (TJR). Je hebt aangegeven dat dit niet op jou van toepassing is.",
    generalProgramAvailable: "Voor jou is een algemeen oefenprogramma beschikbaar, aangepast aan je specifieke situatie en doelen.",
    changeProfile: "Pas Profiel Aan",
    warmingUp: "Warming Up",
    coreStability: "Core Stabiliteit",
    posturalOrientation: "Houding & Uitlijning",
    muscleStrength: "Spierkracht",
    functional: "Functionele Oefeningen",
    coolingDown: "Cooling Down",
    minutes: "min",
    sets: "sets",
    reps: "herhalingen",
    level: "Niveau",
    start: "Start",
    markComplete: "Markeer als Voltooid",
    completed: "Voltooid",
    completedToday: "Voltooid vandaag!",
    instructions: "Instructies",
    focusPoints: "Aandachtspunten",
    close: "Sluiten",
    exercisesCompleted: "Voltooid vandaag",
    programInfo: "Programma Informatie",
    programInfoText: "Dit NEMEX-TJR programma is gebaseerd op wetenschappelijk onderzoek en speciaal ontwikkeld voor mensen met knie of heup artrose. Het doel is het verbeteren van neuromusculaire controle en functionele stabiliteit.",
    painMonitoring: "Pijn Monitoring",
    painSafe: "Veilig (0-2)",
    painAcceptable: "Acceptabel (2-5)",
    painHighRisk: "Te hoog (>5)",
    painGuideline: "De dag na training moet pijn terug zijn naar je normale niveau.",
    sessionDuration: "Sessieduur: 60 minuten",
    allExercises: "Alle Oefeningen",
    beginner: "Beginner",
    intermediate: "Gemiddeld",
    advanced: "Gevorderd"
  },
  en: {
    title: "Exercise Program",
    subtitle: "Personalized exercises for your situation",
    nemexTitle: "NEMEX-TJR Program",
    nemexSubtitle: "Neuromuscular training program for patients scheduled for knee or hip replacement",
    generalTitle: "General Exercise Program",
    generalSubtitle: "Safe and effective exercises for arthritis management",
    notEligible: "NEMEX-TJR Not Available",
    notEligibleDesc: "The NEMEX-TJR program is specifically developed for patients on the waiting list for a total knee or hip replacement (TJR). You indicated this doesn't apply to you.",
    generalProgramAvailable: "For you, a general exercise program is available, adapted to your specific situation and goals.",
    changeProfile: "Update Profile",
    warmingUp: "Warming Up",
    coreStability: "Core Stability",
    posturalOrientation: "Postural Orientation",
    muscleStrength: "Muscle Strength",
    functional: "Functional Exercises",
    coolingDown: "Cooling Down",
    minutes: "min",
    sets: "sets",
    reps: "repetitions",
    level: "Level",
    start: "Start",
    markComplete: "Mark as Complete",
    completed: "Completed",
    completedToday: "Completed today!",
    instructions: "Instructions",
    focusPoints: "Focus Points",
    close: "Close",
    exercisesCompleted: "Completed today",
    programInfo: "Program Information",
    programInfoText: "This NEMEX-TJR program is based on scientific research and specifically developed for people with knee or hip osteoarthritis. The goal is to improve neuromuscular control and functional stability.",
    painMonitoring: "Pain Monitoring",
    painSafe: "Safe (0-2)",
    painAcceptable: "Acceptable (2-5)",
    painHighRisk: "Too high (>5)",
    painGuideline: "The day after training, pain should return to your normal level.",
    sessionDuration: "Session duration: 60 minutes",
    allExercises: "All Exercises",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced"
  }
};

const circleIcons = {
  warming_up: Flame,
  core_stability: Target,
  postural_orientation: Activity,
  muscle_strength: Dumbbell,
  functional: Zap,
  cooling_down: Sparkles
};

export default function Exercises() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list("order", 100),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', user?.email],
    queryFn: () => base44.entities.Measurement.filter({
      created_by: user.email,
      date: new Date().toISOString().split('T')[0]
    }),
    enabled: !!user,
  });

  useEffect(() => {
    if (measurements.length > 0) {
      setCompletedToday(measurements[0].exercisesCompleted || []);
    }
  }, [measurements]);

  const markCompleteMutation = useMutation({
    mutationFn: async (exerciseKey) => {
      const newCompleted = [...completedToday, exerciseKey];
      const today = new Date().toISOString().split('T')[0];

      if (measurements.length > 0) {
        await base44.entities.Measurement.update(measurements[0].id, {
          exercisesCompleted: newCompleted
        });
      } else {
        await base44.entities.Measurement.create({
          date: today,
          type: "dagelijks",
          exercisesCompleted: newCompleted
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      setSelectedExercise(null);
    },
  });

  if (userLoading || exercisesLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];
  const isEligibleForNEMEX = user?.awaitingJointReplacement === true;

  // If not eligible for NEMEX-TJR, show different screen
  if (!isEligibleForNEMEX) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-blue-600" />
              {t.title}
            </h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="w-6 h-6" />
                {t.notEligible}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                {t.notEligibleDesc}
              </p>
              <p className="text-gray-700">
                {t.generalProgramAvailable}
              </p>
              <Link to={createPageUrl("Settings")}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  {t.changeProfile}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle>{t.generalTitle}</CardTitle>
              <p className="text-sm text-gray-600">{t.generalSubtitle}</p>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-gray-600">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <p className="mb-4">{lang === "nl" ? "Een gepersonaliseerd algemeen oefenprogramma komt binnenkort beschikbaar." : "A personalized general exercise program will be available soon."}</p>
                <p className="text-sm">{lang === "nl" ? "In de tussentijd kun je de kennisbibliotheek raadplegen voor informatie over veilig bewegen met artrose." : "In the meantime, you can consult the knowledge library for information on safe movement with arthritis."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For eligible users, show NEMEX-TJR program
  const exercisesByCircle = {
    warming_up: exercises.filter(e => e.circle === "warming_up"),
    core_stability: exercises.filter(e => e.circle === "core_stability"),
    postural_orientation: exercises.filter(e => e.circle === "postural_orientation"),
    muscle_strength: exercises.filter(e => e.circle === "muscle_strength"),
    functional: exercises.filter(e => e.circle === "functional"),
    cooling_down: exercises.filter(e => e.circle === "cooling_down")
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-blue-600" />
            {t.nemexTitle}
          </h1>
          <p className="text-gray-600">{t.nemexSubtitle}</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{lang === "nl" ? "Specifiek voor patiënten met geplande prothese" : "Specific for patients with scheduled replacement"}</span>
          </div>
        </div>

        {/* Program Info Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              {t.programInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{t.programInfoText}</p>

            <div className="p-4 bg-white rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                {t.painMonitoring}
              </h4>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 p-2 bg-green-100 rounded text-center">
                  <p className="text-xs font-semibold text-green-800">{t.painSafe}</p>
                </div>
                <div className="flex-1 p-2 bg-yellow-100 rounded text-center">
                  <p className="text-xs font-semibold text-yellow-800">{t.painAcceptable}</p>
                </div>
                <div className="flex-1 p-2 bg-red-100 rounded text-center">
                  <p className="text-xs font-semibold text-red-800">{t.painHighRisk}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t.painGuideline}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{t.sessionDuration}</span>
            </div>
          </CardContent>
        </Card>

        {/* Progress Badge */}
        {completedToday.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">{t.exercisesCompleted}</p>
              <p className="text-sm text-green-700">
                {completedToday.length} {lang === "nl" ? "oefeningen voltooid" : "exercises completed"}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
            <TabsTrigger value="all">{t.allExercises}</TabsTrigger>
            <TabsTrigger value="warming_up">
              <Flame className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.warmingUp}</span>
            </TabsTrigger>
            <TabsTrigger value="core_stability">
              <Target className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.coreStability}</span>
            </TabsTrigger>
            <TabsTrigger value="postural_orientation">
              <Activity className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.posturalOrientation}</span>
            </TabsTrigger>
            <TabsTrigger value="muscle_strength">
              <Dumbbell className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.muscleStrength}</span>
            </TabsTrigger>
            <TabsTrigger value="functional">
              <Zap className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.functional}</span>
            </TabsTrigger>
            <TabsTrigger value="cooling_down">
              <Sparkles className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{t.coolingDown}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {Object.entries(exercisesByCircle).map(([circle, circleExercises]) => {
              if (circleExercises.length === 0) return null;
              const CircleIcon = circleIcons[circle];

              return (
                <div key={circle} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CircleIcon className="w-6 h-6 text-blue-600" />
                    {t[circle.replace(/_/g, '')]}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {circleExercises.map(exercise => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        isCompleted={completedToday.includes(exercise.key)}
                        onClick={() => setSelectedExercise(exercise)}
                        t={t}
                        lang={lang}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {Object.keys(exercisesByCircle).map(circle => (
            <TabsContent key={circle} value={circle}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercisesByCircle[circle].map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isCompleted={completedToday.includes(exercise.key)}
                    onClick={() => setSelectedExercise(exercise)}
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Exercise Detail Dialog */}
        {selectedExercise && (
          <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{lang === "nl" ? selectedExercise.title_nl : selectedExercise.title_en}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {selectedExercise.imageUrl && (
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedExercise.imageUrl}
                      alt={lang === "nl" ? selectedExercise.title_nl : selectedExercise.title_en}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm font-medium text-blue-700 mb-1">{t.level}</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedExercise.level}</p>
                  </div>

                  {selectedExercise.sets && (
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-purple-700 mb-1">{t.sets}</p>
                      <p className="text-2xl font-bold text-purple-900">{selectedExercise.sets}</p>
                    </div>
                  )}

                  {selectedExercise.repetitions && (
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-green-700 mb-1">{t.reps}</p>
                      <p className="text-sm font-bold text-green-900">{selectedExercise.repetitions}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t.instructions}</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {lang === "nl" ? selectedExercise.description_nl : selectedExercise.description_en}
                  </p>
                </div>

                {selectedExercise.focusPoints_nl && selectedExercise.focusPoints_nl.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t.focusPoints}
                    </h3>
                    <ul className="space-y-2">
                      {(lang === "nl" ? selectedExercise.focusPoints_nl : selectedExercise.focusPoints_en).map((point, idx) => (
                        <li key={idx} className="text-blue-800 text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => markCompleteMutation.mutate(selectedExercise.key)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={completedToday.includes(selectedExercise.key) || markCompleteMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {completedToday.includes(selectedExercise.key) ? t.completed : t.markComplete}
                  </Button>
                  <Button
                    onClick={() => setSelectedExercise(null)}
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t.close}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, isCompleted, onClick, t, lang }) {
  const CircleIcon = circleIcons[exercise.circle] || Dumbbell;

  return (
    <Card
      className={`shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
        isCompleted ? 'border-2 border-green-300 bg-green-50' : 'border-blue-200'
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCompleted ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <CircleIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <Badge className={`${
            exercise.level === 1 ? 'bg-green-100 text-green-800' :
            exercise.level === 2 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {t.level} {exercise.level}
          </Badge>
        </div>
        <CardTitle className="text-base leading-tight">
          {lang === "nl" ? exercise.title_nl : exercise.title_en}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {exercise.sets && (
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              <span>{exercise.sets} sets</span>
            </div>
          )}
          {exercise.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{exercise.duration} {t.minutes}</span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className={`w-full ${
            isCompleted ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t.completedToday}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t.start}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}