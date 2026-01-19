import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProgressLog } from "@/entities/ProgressLog";
import { Activity, CheckCircle } from "lucide-react";

const translations = {
  nl: {
    quickLog: "Snelle Registratie",
    howFeeling: "Hoe voel je je vandaag?",
    pain: "Pijn",
    mobility: "Mobiliteit",
    mood: "Stemming",
    great: "Geweldig",
    good: "Goed",
    okay: "Oké",
    poor: "Matig",
    bad: "Slecht",
    save: "Opslaan",
    saved: "Opgeslagen!",
    low: "Laag",
    high: "Hoog"
  },
  en: {
    quickLog: "Quick Log",
    howFeeling: "How are you feeling today?",
    pain: "Pain",
    mobility: "Mobility",
    mood: "Mood",
    great: "Great",
    good: "Good",
    okay: "Okay",
    poor: "Poor",
    bad: "Bad",
    save: "Save",
    saved: "Saved!",
    low: "Low",
    high: "High"
  }
};

export default function QuickLogCard({ lang = "nl", onLogSaved }) {
  const [painLevel, setPainLevel] = useState([5]);
  const [mobilityLevel, setMobilityLevel] = useState([5]);
  const [mood, setMood] = useState("okay");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const t = translations[lang];

  const moods = [
    { value: "great", emoji: "😄", label: t.great },
    { value: "good", emoji: "🙂", label: t.good },
    { value: "okay", emoji: "😐", label: t.okay },
    { value: "poor", emoji: "😕", label: t.poor },
    { value: "bad", emoji: "😞", label: t.bad }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ProgressLog.create({
        date: new Date().toISOString().split('T')[0],
        painLevel: painLevel[0],
        mobilityLevel: mobilityLevel[0],
        mood: mood
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onLogSaved) onLogSaved();
    } catch (error) {
      console.error("Error saving log:", error);
    }
    setIsSaving(false);
  };

  return (
    <Card className="shadow-lg border-sky-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          {t.quickLog}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-600">{t.howFeeling}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{t.pain}</span>
            <span className="text-blue-600 font-semibold">{painLevel[0]}/10</span>
          </div>
          <Slider
            value={painLevel}
            onValueChange={setPainLevel}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t.low}</span>
            <span>{t.high}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{t.mobility}</span>
            <span className="text-green-600 font-semibold">{mobilityLevel[0]}/10</span>
          </div>
          <Slider
            value={mobilityLevel}
            onValueChange={setMobilityLevel}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t.low}</span>
            <span>{t.high}</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t.mood}</span>
          <div className="grid grid-cols-5 gap-2">
            {moods.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mood === m.value
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="text-2xl">{m.emoji}</div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {showSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t.saved}
            </>
          ) : (
            t.save
          )}
        </Button>
      </CardContent>
    </Card>
  );
}