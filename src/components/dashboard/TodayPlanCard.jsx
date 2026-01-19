import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, Clock, ArrowRight } from "lucide-react";

const translations = {
  nl: {
    todayPlan: "Plan Voor Vandaag",
    recommended: "Aanbevolen oefeningen",
    minutes: "min",
    viewAll: "Bekijk Alle Oefeningen",
    noExercises: "Nog geen oefeningen beschikbaar",
    start: "Start"
  },
  en: {
    todayPlan: "Today's Plan",
    recommended: "Recommended exercises",
    minutes: "min",
    viewAll: "View All Exercises",
    noExercises: "No exercises available yet",
    start: "Start"
  }
};

export default function TodayPlanCard({ exercises = [], lang = "nl" }) {
  const t = translations[lang];

  return (
    <Card className="shadow-lg border-sky-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-600" />
          {t.todayPlan}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exercises.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">{t.recommended}</p>
            <div className="space-y-3 mb-6">
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {lang === "nl" ? exercise.title_nl : exercise.title_en}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{exercise.duration} {t.minutes}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    {t.start}
                  </Button>
                </div>
              ))}
            </div>
            <Link to={createPageUrl("Exercises")}>
              <Button variant="outline" className="w-full">
                {t.viewAll}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{t.noExercises}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}