import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Heart, CheckCircle, AlertTriangle } from "lucide-react";
import { FullDisclaimer } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    welcome: "Welkom bij Artrose Kompas",
    subtitle: "Laten we je profiel instellen voor een gepersonaliseerde ervaring",
    appTagline: "Powered by JointWise",
    step1: "Stap 1: Artrose Stadium",
    step2: "Stap 2: Aangedane Gewrichten",
    step3: "Stap 3: Prothese Planning",
    step4: "Stap 4: Je Doelen",
    chooseStage: "Kies je huidige situatie",
    prevention: "Preventie - Ik wil artrose voorkomen",
    mild: "Licht - Minimale symptomen",
    moderate: "Matig - Regelmatige pijn/stijfheid",
    severe: "Ernstig - Dagelijkse impact",
    selectJoints: "Selecteer aangedane gewrichten",
    knee: "Knie",
    hip: "Heup",
    hand: "Hand",
    shoulder: "Schouder",
    ankle: "Enkel",
    spine: "Wervelkolom",
    elbow: "Elleboog",
    replacementQuestion: "Sta je op de wachtlijst voor een knie of heup prothese?",
    replacementYes: "Ja, ik sta gepland voor een totale knie of heup prothese",
    replacementNo: "Nee, geen prothese gepland",
    replacementInfo: "Dit is belangrijk voor het juiste oefenprogramma. Het NEMEX-TJR programma is specifiek ontwikkeld voor mensen die wachten op een prothese.",
    whatGoals: "Wat wil je bereiken?",
    goalPain: "Pijnvermindering",
    goalMobility: "Mobiliteit verbeteren",
    goalStrength: "Kracht opbouwen",
    goalFlexibility: "Flexibiliteit verhogen",
    goalLifestyle: "Gezondere levensstijl",
    back: "Terug",
    next: "Volgende",
    finish: "Voltooien",
    age: "Geboortedatum (optioneel)"
  },
  en: {
    welcome: "Welcome to JointWise",
    subtitle: "Let's set up your profile for a personalized experience",
    appTagline: "Smart Care, Strong Joints",
    step1: "Step 1: Arthritis Stage",
    step2: "Step 2: Affected Joints",
    step3: "Step 3: Replacement Planning",
    step4: "Step 4: Your Goals",
    chooseStage: "Choose your current situation",
    prevention: "Prevention - I want to prevent arthritis",
    mild: "Mild - Minimal symptoms",
    moderate: "Moderate - Regular pain/stiffness",
    severe: "Severe - Daily impact",
    selectJoints: "Select affected joints",
    knee: "Knee",
    hip: "Hip",
    hand: "Hand",
    shoulder: "Shoulder",
    ankle: "Ankle",
    spine: "Spine",
    elbow: "Elbow",
    replacementQuestion: "Are you on the waiting list for a knee or hip replacement?",
    replacementYes: "Yes, I'm scheduled for a total knee or hip replacement",
    replacementNo: "No, no replacement planned",
    replacementInfo: "This is important for the right exercise program. The NEMEX-TJR program is specifically developed for people awaiting a replacement.",
    whatGoals: "What do you want to achieve?",
    goalPain: "Pain reduction",
    goalMobility: "Improve mobility",
    goalStrength: "Build strength",
    goalFlexibility: "Increase flexibility",
    goalLifestyle: "Healthier lifestyle",
    back: "Back",
    next: "Next",
    finish: "Complete",
    age: "Date of Birth (optional)"
  }
};

export default function DashboardOnboarding({ user, onComplete, lang = "nl" }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    arthrosisStage: "",
    affectedJoints: [],
    awaitingJointReplacement: false,
    goals: [],
    dateOfBirth: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  const stages = [
    { value: "prevention", label: t.prevention, icon: "🛡️" },
    { value: "mild", label: t.mild, icon: "💚" },
    { value: "moderate", label: t.moderate, icon: "💛" },
    { value: "severe", label: t.severe, icon: "🧡" }
  ];

  const joints = [
    { value: "knie", label: t.knee },
    { value: "heup", label: t.hip },
    { value: "hand", label: t.hand },
    { value: "schouder", label: t.shoulder },
    { value: "enkel", label: t.ankle },
    { value: "rug", label: t.spine },
    { value: "elleboog", label: t.elbow }
  ];

  const goals = [
    { value: "pain_reduction", label: t.goalPain },
    { value: "mobility", label: t.goalMobility },
    { value: "strength", label: t.goalStrength },
    { value: "flexibility", label: t.goalFlexibility },
    { value: "lifestyle", label: t.goalLifestyle }
  ];

  const toggleJoint = (joint) => {
    setFormData(prev => ({
      ...prev,
      affectedJoints: prev.affectedJoints.includes(joint)
        ? prev.affectedJoints.filter(j => j !== joint)
        : [...prev.affectedJoints, joint]
    }));
  };

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({
        ...formData,
        onboardingCompleted: true,
        disclaimerAcceptedAt: new Date().toISOString(),
        disclaimerVersion: "1.0"
      });
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
    setIsSubmitting(false);
  };

  const hasKneeOrHip = formData.affectedJoints.includes("knie") || formData.affectedJoints.includes("heup");

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">{t.welcome}</CardTitle>
          <p className="text-xs text-gray-500 mt-1">{t.appTagline}</p>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full transition-all ${
                  i === step ? "bg-blue-500" : i < step ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 0 && (
            <FullDisclaimer 
              lang={lang} 
              onAgree={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">{t.step1}</h3>
              <p className="text-gray-600">{t.chooseStage}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stages.map(stage => (
                  <button
                    key={stage.value}
                    onClick={() => setFormData({ ...formData, arthrosisStage: stage.value })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      formData.arthrosisStage === stage.value
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{stage.icon}</div>
                    <div className="font-semibold text-gray-900">{stage.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">{t.step2}</h3>
              <p className="text-gray-600">{t.selectJoints}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {joints.map(joint => (
                  <button
                    key={joint.value}
                    onClick={() => toggleJoint(joint.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.affectedJoints.includes(joint.value)
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    {formData.affectedJoints.includes(joint.value) && (
                      <CheckCircle className="w-5 h-5 text-blue-500 mb-2" />
                    )}
                    <div className="font-medium text-gray-900">{joint.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">{t.step3}</h3>
              <p className="text-gray-600">{t.replacementQuestion}</p>
              
              {hasKneeOrHip && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{t.replacementInfo}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setFormData({ ...formData, awaitingJointReplacement: true })}
                  className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                    formData.awaitingJointReplacement
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                  }`}
                  disabled={!hasKneeOrHip}
                >
                  <div className="flex items-start gap-3">
                    {formData.awaitingJointReplacement ? (
                      <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{t.replacementYes}</p>
                      {!hasKneeOrHip && (
                        <p className="text-xs text-gray-500 mt-1">
                          {lang === "nl" ? "(Alleen voor knie of heup artrose)" : "(Only for knee or hip arthritis)"}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, awaitingJointReplacement: false })}
                  className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                    !formData.awaitingJointReplacement
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!formData.awaitingJointReplacement ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{t.replacementNo}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">{t.step4}</h3>
              <p className="text-gray-600">{t.whatGoals}</p>
              <div className="space-y-3">
                {goals.map(goal => (
                  <button
                    key={goal.value}
                    onClick={() => toggleGoal(goal.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      formData.goals.includes(goal.value)
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    {formData.goals.includes(goal.value) ? (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <div className="font-medium text-gray-900">{goal.label}</div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <Label htmlFor="dob">{t.age}</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step > 0 && (
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                {t.back}
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !formData.arthrosisStage) ||
                    (step === 2 && formData.affectedJoints.length === 0)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t.next}
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || formData.goals.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "..." : t.finish}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}