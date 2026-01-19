import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Lock, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  nl: {
    title: "Jouw Kennis = Jouw Kracht",
    subtitle: "Start met begrip, dan komt actie",
    lessonsCompleted: "lessen voltooid",
    unlockProgram: "Unlock je Volledige Programma",
    unlocked: "Programma Ontgrendeld!",
    startLesson: "Start Les",
    continueLesson: "Vervolg Les",
    allComplete: "Alle Basis Lessen Voltooid",
    why: "Waarom educatie eerst?",
    whyText: "Wetenschappelijk onderzoek toont aan dat begrip van je aandoening leidt tot betere resultaten. Door te weten WAAROM beweging en voeding werken, ben je gemotiveerder en consequenter.",
    coreModules: "Basis Modules",
    unlockAt: "Unlock na 3 lessen",
    exercisesNutrition: "Oefeningen + Voeding"
  },
  en: {
    title: "Your Knowledge = Your Power",
    subtitle: "Start with understanding, then comes action",
    lessonsCompleted: "lessons completed",
    unlockProgram: "Unlock Your Full Program",
    unlocked: "Program Unlocked!",
    startLesson: "Start Lesson",
    continueLesson: "Continue Lesson",
    allComplete: "All Core Lessons Completed",
    why: "Why education first?",
    whyText: "Scientific research shows that understanding your condition leads to better results. By knowing WHY movement and nutrition work, you're more motivated and consistent.",
    coreModules: "Core Modules",
    unlockAt: "Unlock after 3 lessons",
    exercisesNutrition: "Exercises + Nutrition"
  }
};

const coreModules = [
  { id: 1, key: "arthritis_basics", title_nl: "Wat is Artrose?", title_en: "What is Arthritis?" },
  { id: 2, key: "movement_myth", title_nl: "Mythe: Rust is Beste", title_en: "Myth: Rest is Best" },
  { id: 3, key: "pain_science", title_nl: "Pijnwetenschap", title_en: "Pain Science" }
];

export default function EducationProgress({ user, onLessonComplete }) {
  const lang = user?.language || "nl";
  const t = translations[lang];
  
  const completedLessons = user?.completedCoreLessons || [];
  const progress = (completedLessons.length / 3) * 100;
  const isUnlocked = completedLessons.length >= 3;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              {t.title}
            </CardTitle>
            <p className="text-sm text-gray-600">{t.subtitle}</p>
          </div>
          {isUnlocked && (
            <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">{t.unlocked}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">{t.coreModules}</span>
            <span className="text-blue-600 font-bold">
              {completedLessons.length}/3 {t.lessonsCompleted}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Core Lessons */}
        <div className="space-y-3">
          {coreModules.map((module, idx) => {
            const isCompleted = completedLessons.includes(module.key);
            const isNext = !isCompleted && completedLessons.length === idx;
            
            return (
              <div
                key={module.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? "bg-green-50 border-green-300"
                    : isNext
                    ? "bg-white border-blue-400 shadow-md"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                        {idx + 1}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {lang === "nl" ? module.title_nl : module.title_en}
                      </p>
                      <p className="text-xs text-gray-600">5 {lang === "nl" ? "min" : "min"}</p>
                    </div>
                  </div>
                  
                  {isNext && (
                    <Link to={createPageUrl("Library")}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        {t.startLesson}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                  
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unlock Message */}
        {!isUnlocked && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">{t.unlockAt}</p>
                <p className="text-sm text-amber-800">
                  {t.exercisesNutrition}
                </p>
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">{t.allComplete}</p>
                <p className="text-sm text-green-800 mb-3">
                  {lang === "nl" 
                    ? "Je hebt de basis kennis voltooid! Je volledige programma met oefeningen en voeding is nu beschikbaar." 
                    : "You've completed the core knowledge! Your full program with exercises and nutrition is now available."}
                </p>
                <div className="flex gap-2">
                  <Link to={createPageUrl("Exercises")} className="flex-1">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {lang === "nl" ? "Naar Oefeningen" : "Go to Exercises"}
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Nutrition")} className="flex-1">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {lang === "nl" ? "Naar Voeding" : "Go to Nutrition"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Why Section */}
        <div className="pt-4 border-t">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-800">
              <Sparkles className="w-4 h-4" />
              {t.why}
            </summary>
            <p className="mt-2 text-sm text-gray-700 pl-6">
              {t.whyText}
            </p>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}