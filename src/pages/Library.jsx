import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, ArrowRight, Sparkles, Crown, Brain, Activity, Zap, Target, TrendingUp, Lock } from "lucide-react"; // Added Lock icon
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const translations = {
  nl: {
    title: "Kennisbibliotheek",
    subtitle: "Evidence-based educatie voor beter begrip en resultaat",
    coreLessons: "Basis Kennismodules",
    coreSubtitle: "Voltooi deze lessen om je volledige programma te ontgrendelen",
    advancedLessons: "Verdieping & Extra Kennis",
    readingTime: "min leestijd",
    premium: "Premium",
    read: "Lees",
    complete: "Voltooid",
    markComplete: "Markeer als Voltooid",
    continueReading: "Verder Lezen",
    keyTakeaways: "Kernpunten",
    close: "Sluiten",
    lessonsCompleted: "lessen voltooid",
    unlockProgram: "Unlock na 3/3",
    congratulations: "Gefeliciteerd!",
    allCoreComplete: "Je hebt alle basis kennismodules voltooid en je volledige programma ontgrendeld!",
    goToDashboard: "Naar Dashboard",
    loading: "Laden...",
    next: "VOLGENDE", // Added 'next' translation
    locked: "VERGRENDELD", // Added 'locked' translation
    completeLessonFirst: "Voltooi eerst les", // Added 'completeLessonFirst' translation
  },
  en: {
    title: "Knowledge Library",
    subtitle: "Evidence-based education for better understanding and results",
    coreLessons: "Core Knowledge Modules",
    coreSubtitle: "Complete these lessons to unlock your full program",
    advancedLessons: "Advanced & Extra Knowledge",
    readingTime: "min read",
    premium: "Premium",
    read: "Read",
    complete: "Completed",
    markComplete: "Mark as Complete",
    continueReading: "Continue Reading",
    keyTakeaways: "Key Takeaways",
    close: "Close",
    lessonsCompleted: "lessons completed",
    unlockProgram: "Unlock after 3/3",
    congratulations: "Congratulations!",
    allCoreComplete: "You've completed all core knowledge modules and unlocked your full program!",
    goToDashboard: "Go to Dashboard",
    loading: "Loading...",
    next: "NEXT", // Added 'next' translation
    locked: "LOCKED", // Added 'locked' translation
    completeLessonFirst: "Complete lesson first", // Added 'completeLessonFirst' translation
  }
};

const lessonIcons = {
  "arthritis_basics": Brain,
  "movement_myth": Activity,
  "pain_science": Zap,
  "default": BookOpen
};

export default function Library() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.EducationLesson.list("order", 50),
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonKey) => {
      const completedLessons = user.completedCoreLessons || [];
      const updatedCompleted = [...completedLessons, lessonKey];
      await base44.auth.updateMe({ completedCoreLessons: updatedCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSelectedLesson(null);
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];
  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "premium_practice";
  
  const completedLessons = user?.completedCoreLessons || [];
  
  const coreLessons = lessons.filter(l => l.isCoreLesson === true);
  const advancedLessons = lessons.filter(l => l.isCoreLesson !== true);
  
  const coreProgress = coreLessons.length > 0 
    ? (completedLessons.filter(key => coreLessons.some(l => l.key === key)).length / coreLessons.length) * 100 
    : 0;
  const allCoreComplete = coreLessons.length > 0 && 
    coreLessons.every(l => completedLessons.includes(l.key));

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            {t.title}
          </h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl mb-1">{t.coreLessons}</CardTitle>
                <p className="text-sm text-gray-600">{t.coreSubtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {completedLessons.filter(key => coreLessons.some(l => l.key === key)).length}/{coreLessons.length}
                </p>
                <p className="text-xs text-gray-600">{t.lessonsCompleted}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={coreProgress} className="h-3 mb-6" />
            
            {allCoreComplete && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">{t.congratulations}</h3>
                    <p className="text-sm text-green-800 mb-3">{t.allCoreComplete}</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => window.location.href = "/Dashboard"}>
                      {t.goToDashboard}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {coreLessons.length === 0 && (
              <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-900 font-semibold mb-2">Geen core lessen gevonden!</p>
                <p className="text-red-800 text-sm">
                  Er zijn geen lessen met de keys: arthritis_basics, movement_myth, pain_science.<br/>
                  Check de database via Dashboard &rarr; Data &rarr; EducationLesson
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {coreLessons.map((lesson, idx) => {
                const isCompleted = completedLessons.includes(lesson.key);
                const isNext = !isCompleted && completedLessons.length === idx;
                const isLocked = !isCompleted && completedLessons.length < idx; // Logic for sequential unlocking
                const LessonIcon = lessonIcons[lesson.key] || lessonIcons.default;
                
                return (
                  <Card 
                    key={lesson.id}
                    className={`transition-all ${
                      isLocked 
                        ? "opacity-60 cursor-not-allowed bg-gray-100 border border-gray-300"
                        : "cursor-pointer hover:scale-105"
                    } ${
                      isCompleted 
                        ? "bg-green-50 border-2 border-green-300 shadow-lg" 
                        : isNext
                        ? "bg-white border-2 border-blue-400 shadow-xl ring-2 ring-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                    onClick={() => !isLocked && setSelectedLesson(lesson)} // Disable click for locked lessons
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-green-500" : isNext ? "bg-blue-500" : "bg-gray-400"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : isLocked ? ( // Show Lock icon if locked
                            <Lock className="w-6 h-6 text-white" />
                          ) : (
                            <LessonIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {isNext && (
                            <Badge className="bg-blue-600 text-white text-xs mb-1">
                              {t.next}
                            </Badge>
                          )}
                          {isLocked && ( // Show LOCKED badge if locked
                            <Badge className="bg-gray-500 text-white text-xs mb-1">
                              {t.locked}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base leading-tight mb-2">
                            {lang === "nl" ? lesson.title_nl : lesson.title_en}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.readingTime} {t.readingTime}</span>
                      </div>
                      
                      {!isLocked && lesson.keyTakeaways_nl && lesson.keyTakeaways_nl.length > 0 && ( // Hide takeaways if locked
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {t.keyTakeaways}:
                          </p>
                          <ul className="space-y-1">
                            {(lang === "nl" ? lesson.keyTakeaways_nl : lesson.keyTakeaways_en).slice(0, 2).map((point, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {isLocked && ( // Display locked message
                        <div className="mb-3 p-2 bg-gray-200 rounded-lg">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {t.completeLessonFirst} {idx === 0 ? "" : (idx + 1)} {/* Show lesson number if not the first one */}
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        disabled={isLocked} // Disable button if locked
                        className={`w-full ${
                          isLocked
                            ? "bg-gray-400 cursor-not-allowed"
                            : isCompleted 
                            ? "bg-green-600 hover:bg-green-700" 
                            : isNext
                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                            : "bg-gray-600 hover:bg-gray-700"
                        }`}
                      >
                        {isLocked ? ( // Show 'Locked' text if locked
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            {t.locked}
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {t.complete}
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 mr-2" />
                            {t.read}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Lessons */}
        {advancedLessons.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              {t.advancedLessons}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {advancedLessons.map(lesson => {
                const isLocked = lesson.isPremium && !isPremium;
                
                return (
                  <Card 
                    key={lesson.id} 
                    className={`shadow-lg hover:shadow-xl transition-all ${isLocked ? "opacity-60" : "cursor-pointer hover:scale-105"}`}
                    onClick={() => !isLocked && setSelectedLesson(lesson)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {lesson.category}
                        </Badge>
                        {lesson.isPremium && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            {t.premium}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {lang === "nl" ? lesson.title_nl : lesson.title_en}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {lang === "nl" ? lesson.content_nl?.substring(0, 150) : lesson.content_en?.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.readingTime} {t.readingTime}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={isLocked}
                        >
                          {t.read}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Lesson Detail Dialog */}
        {selectedLesson && (
          <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {React.createElement(lessonIcons[selectedLesson.key] || lessonIcons.default, { className: "w-6 h-6 text-blue-600" })}
                  {lang === "nl" ? selectedLesson.title_nl : selectedLesson.title_en}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedLesson.readingTime} {t.readingTime}</span>
                  </div>
                  <Badge>{selectedLesson.category}</Badge>
                </div>

                <div className="prose prose-blue max-w-none">
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                    {(lang === "nl" ? selectedLesson.content_nl : selectedLesson.content_en)
                      ?.split('\n\n')
                      .map((paragraph, idx) => (
                        <p key={idx} className="mb-4">{paragraph}</p>
                      ))
                    }
                  </div>
                </div>

                {selectedLesson.keyTakeaways_nl && selectedLesson.keyTakeaways_nl.length > 0 && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5" />
                      {t.keyTakeaways}
                    </h3>
                    <ul className="space-y-3">
                      {(lang === "nl" ? selectedLesson.keyTakeaways_nl : selectedLesson.keyTakeaways_en).map((point, idx) => (
                        <li key={idx} className="text-blue-900 flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-base">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  {selectedLesson.isCoreLesson && !completedLessons.includes(selectedLesson.key) && (
                    <Button 
                      onClick={() => markCompleteMutation.mutate(selectedLesson.key)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={markCompleteMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t.markComplete}
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedLesson(null)}
                    variant="outline"
                    className="flex-1"
                  >
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