import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { sanitizeInput } from "@/components/utils/sanitize";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Footprints,
  Dumbbell,
  Heart,
  MessageCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { FooterDisclaimer } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    title: "Voortgang",
    subtitle: "Volg je herstel en ontwikkeling",
    dailyCheckin: "Dagelijkse Check-in",
    weeklyReview: "Wekelijkse Review",
    flareProtocol: "Flare Protocol",
    charts: "Grafieken",
    pain: "Pijn (0-10)",
    stiffness: "Stijfheid (0-10)",
    function: "Functie (0-10)",
    sleep: "Slaap (0-10)",
    stress: "Stress (0-10)",
    steps: "Stappen vandaag",
    weight: "Gewicht (kg)",
    mood: "Stemming",
    notes: "Notities",
    triggers: "Triggers vandaag",
    save: "Opslaan",
    saved: "Opgeslagen!",
    lastWeek: "Afgelopen 7 dagen",
    lastMonth: "Afgelopen 30 dagen",
    noData: "Nog geen data beschikbaar",
    great: "Geweldig",
    good: "Goed",
    okay: "Oké",
    poor: "Matig",
    bad: "Slecht",
    flareDetected: "Flare gedetecteerd",
    flareAdvice: "Je hebt een flare. Klik op de Flare Protocol tab voor advies.",
    trends: "Trends",
    average: "Gemiddelde",
    flareTitle: "Flare Management Protocol",
    flareDescription: "Je ervaart op dit moment een flare-up. Volg dit protocol om de symptomen te verminderen.",
    immediateActions: "Directe Acties",
    exerciseModifications: "Oefening Aanpassingen",
    painManagement: "Pijnmanagement",
    whenToContact: "Wanneer Contact Opnemen",
    flareAction1: "Rust: Neem extra rust maar blijf niet volledig inactief",
    flareAction2: "Ijs/Warmte: Wissel af tussen koud (15 min) en warm (20 min)",
    flareAction3: "Medicatie: Neem je voorgeschreven pijnstilling indien nodig",
    flareAction4: "Hydratatie: Drink minimaal 2 liter water per dag",
    flareExercise1: "Verminder intensiteit met 50%",
    flareExercise2: "Focus op zachte bewegingen en stretching",
    flareExercise3: "Vermijd high-impact activiteiten",
    flareExercise4: "Luister naar je lichaam - stop bij pijn",
    flarePain1: "Gebruik warmte voor stijfheid (bijv. warme douche)",
    flarePain2: "Gebruik koude voor zwelling (ijszak 15 min)",
    flarePain3: "Probeer ontspanningstechnieken (ademhaling, meditatie)",
    flarePain4: "Vermijd triggers die je hebt geïdentificeerd",
    flareContact1: "Pijn blijft langer dan 1 week aanhouden",
    flareContact2: "Ernstige zwelling of roodheid",
    flareContact3: "Koorts of andere nieuwe symptomen",
    flareContact4: "Geen verbetering na 3-5 dagen",
    contactTherapist: "Contact Fysiotherapeut",
    flareRecoveryTips: "Herstel Tips",
    flareTip1: "Houd een flare dagboek bij om triggers te identificeren",
    flareTip2: "Wees geduldig - herstel kan 3-14 dagen duren",
    flareTip3: "Bouw activiteiten geleidelijk weer op",
    flareTip4: "Blijf gezond eten en genoeg slapen"
  },
  en: {
    title: "Progress",
    subtitle: "Track your recovery and development",
    dailyCheckin: "Daily Check-in",
    weeklyReview: "Weekly Review",
    flareProtocol: "Flare Protocol",
    charts: "Charts",
    pain: "Pain (0-10)",
    stiffness: "Stiffness (0-10)",
    function: "Function (0-10)",
    sleep: "Sleep (0-10)",
    stress: "Stress (0-10)",
    steps: "Steps today",
    weight: "Weight (kg)",
    mood: "Mood",
    notes: "Notes",
    triggers: "Triggers today",
    save: "Save",
    saved: "Saved!",
    lastWeek: "Last 7 days",
    lastMonth: "Last 30 days",
    noData: "No data available yet",
    great: "Great",
    good: "Good",
    okay: "Okay",
    poor: "Poor",
    bad: "Bad",
    flareDetected: "Flare detected",
    flareAdvice: "You're experiencing a flare. Click the Flare Protocol tab for advice.",
    trends: "Trends",
    average: "Average",
    flareTitle: "Flare Management Protocol",
    flareDescription: "You're currently experiencing a flare-up. Follow this protocol to reduce symptoms.",
    immediateActions: "Immediate Actions",
    exerciseModifications: "Exercise Modifications",
    painManagement: "Pain Management",
    whenToContact: "When to Contact",
    flareAction1: "Rest: Take extra rest but don't become completely inactive",
    flareAction2: "Ice/Heat: Alternate between cold (15 min) and heat (20 min)",
    flareAction3: "Medication: Take prescribed pain relief if needed",
    flareAction4: "Hydration: Drink at least 2 liters of water daily",
    flareExercise1: "Reduce intensity by 50%",
    flareExercise2: "Focus on gentle movements and stretching",
    flareExercise3: "Avoid high-impact activities",
    flareExercise4: "Listen to your body - stop if pain increases",
    flarePain1: "Use heat for stiffness (e.g. warm shower)",
    flarePain2: "Use cold for swelling (ice pack 15 min)",
    flarePain3: "Try relaxation techniques (breathing, meditation)",
    flarePain4: "Avoid triggers you've identified",
    flareContact1: "Pain persists longer than 1 week",
    flareContact2: "Severe swelling or redness",
    flareContact3: "Fever or other new symptoms",
    flareContact4: "No improvement after 3-5 days",
    contactTherapist: "Contact Therapist",
    flareRecoveryTips: "Recovery Tips",
    flareTip1: "Keep a flare diary to identify triggers",
    flareTip2: "Be patient - recovery can take 3-14 days",
    flareTip3: "Gradually build up activities again",
    flareTip4: "Continue healthy eating and adequate sleep"
  }
};

export default function Progress() {
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [formData, setFormData] = useState({
    painScore: [5],
    stiffnessScore: [5],
    functionScore: [5],
    sleepQuality: [7],
    stressLevel: [5],
    steps: "",
    weight: "",
    mood: "okay",
    notes: "",
    triggers: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      if (!userData) {
        window.location.href = '/Home';
        return;
      }
      setUser(userData);

      const logs = await base44.entities.Measurement.filter({ created_by: userData.email }, "-date", 30);
      setMeasurements(logs);

      setFormData(prev => ({
        ...prev,
        painScore: [userData.painScore || 5],
        stiffnessScore: [userData.stiffnessScore || 5],
        functionScore: [userData.functionScore || 5],
        sleepQuality: [userData.sleepQuality || 7],
        stressLevel: [userData.stressLevel || 5],
        weight: userData.weight || ""
      }));
    } catch (error) {
      console.error("Error loading progress data:", error);
      window.location.href = '/Home';
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const triggersList = formData.triggers
        ? formData.triggers.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const isFlare = formData.painScore[0] > 7 || formData.stiffnessScore[0] > 7;

      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const measurementData = {
        date: dateString,
        type: "daily",
        painScore: formData.painScore[0],
        stiffnessScore: formData.stiffnessScore[0],
        functionScore: formData.functionScore[0],
        sleepQuality: formData.sleepQuality[0],
        stressLevel: formData.stressLevel[0],
        mood: formData.mood,
        notes: sanitizeInput(formData.notes) || "",
        triggers: triggersList.map(t => sanitizeInput(t)),
        isFlare: isFlare
      };

      if (formData.steps && formData.steps !== "") {
        measurementData.steps = parseInt(formData.steps);
      }

      if (formData.weight && formData.weight !== "") {
        measurementData.weight = parseFloat(formData.weight);
      }

      await base44.entities.Measurement.create(measurementData);

      await base44.auth.updateMe({
        painScore: formData.painScore[0],
        stiffnessScore: formData.stiffnessScore[0],
        functionScore: formData.functionScore[0],
        sleepQuality: formData.sleepQuality[0],
        stressLevel: formData.stressLevel[0],
        weight: formData.weight ? parseFloat(formData.weight) : user.weight
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      setFormData(prev => ({
        ...prev,
        notes: "",
        triggers: ""
      }));

      loadData();
    } catch (error) {
      console.error("Error saving measurement:", error);
      const lang = user?.language || "nl";
      alert(lang === "nl"
        ? "Er ging iets mis bij het opslaan. Probeer het opnieuw."
        : "Something went wrong while saving. Please try again.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  const moods = [
    { value: "great", emoji: "😄", label: t.great },
    { value: "good", emoji: "🙂", label: t.good },
    { value: "okay", emoji: "😐", label: t.okay },
    { value: "poor", emoji: "😕", label: t.poor },
    { value: "bad", emoji: "😞", label: t.bad }
  ];

  const weekData = measurements.slice(0, 7).reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString(lang, { month: 'short', day: 'numeric' }),
    pain: log.painScore || 0,
    stiffness: log.stiffnessScore || 0,
    function: log.functionScore || 0
  }));

  const monthData = measurements.slice(0, 30).reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString(lang, { month: 'short', day: 'numeric' }),
    pain: log.painScore || 0,
    stiffness: log.stiffnessScore || 0,
    function: log.functionScore || 0
  }));

  const latestMeasurement = measurements[0];
  const isFlare = latestMeasurement?.isFlare || formData.painScore[0] > 7 || formData.stiffnessScore[0] > 7;

  const calculateAverage = (field) => {
    if (measurements.length === 0) return 0;
    const sum = measurements.slice(0, 7).reduce((acc, m) => acc + (m[field] || 0), 0);
    return (sum / Math.min(7, measurements.length)).toFixed(1);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {isFlare && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">{t.flareDetected}</h3>
                  <p className="text-orange-800 text-sm">{t.flareAdvice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isFlare ? "flare" : "daily"} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="daily">{t.dailyCheckin}</TabsTrigger>
            <TabsTrigger value="flare" className={isFlare ? "bg-orange-100 data-[state=active]:bg-orange-200" : ""}>
              {t.flareProtocol}
            </TabsTrigger>
            <TabsTrigger value="weekly">{t.weeklyReview}</TabsTrigger>
            <TabsTrigger value="charts">{t.charts}</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  {t.dailyCheckin}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>{t.pain}</Label>
                      <span className="text-emerald-600 font-semibold">{formData.painScore[0]}/10</span>
                    </div>
                    <Slider
                      value={formData.painScore}
                      onValueChange={(val) => setFormData({ ...formData, painScore: val })}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>{t.stiffness}</Label>
                      <span className="text-emerald-600 font-semibold">{formData.stiffnessScore[0]}/10</span>
                    </div>
                    <Slider
                      value={formData.stiffnessScore}
                      onValueChange={(val) => setFormData({ ...formData, stiffnessScore: val })}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>{t.function}</Label>
                      <span className="text-emerald-600 font-semibold">{formData.functionScore[0]}/10</span>
                    </div>
                    <Slider
                      value={formData.functionScore}
                      onValueChange={(val) => setFormData({ ...formData, functionScore: val })}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>{t.sleep}</Label>
                      <span className="text-emerald-600 font-semibold">{formData.sleepQuality[0]}/10</span>
                    </div>
                    <Slider
                      value={formData.sleepQuality}
                      onValueChange={(val) => setFormData({ ...formData, sleepQuality: val })}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>{t.stress}</Label>
                      <span className="text-emerald-600 font-semibold">{formData.stressLevel[0]}/10</span>
                    </div>
                    <Slider
                      value={formData.stressLevel}
                      onValueChange={(val) => setFormData({ ...formData, stressLevel: val })}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="steps">{t.steps}</Label>
                    <div className="relative mt-2">
                      <Footprints className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="steps"
                        type="number"
                        placeholder="8000"
                        value={formData.steps}
                        onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="weight">{t.weight}</Label>
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t.mood}</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {moods.map(m => (
                      <button
                        key={m.value}
                        onClick={() => setFormData({ ...formData, mood: m.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.mood === m.value
                            ? "border-emerald-500 bg-emerald-50 shadow-md"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="text-2xl">{m.emoji}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="triggers">{t.triggers}</Label>
                  <input
                    id="triggers"
                    type="text"
                    placeholder={lang === "nl" ? "Bijv. veel lopen, koud weer" : "E.g. lot of walking, cold weather"}
                    value={formData.triggers}
                    onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t.notes}</Label>
                  <Textarea
                    id="notes"
                    placeholder={lang === "nl" ? "Hoe voelde je dag?" : "How did your day feel?"}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || showSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {t.saved}
                    </>
                  ) : (
                    t.save
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flare">
            <div className="space-y-6">
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.flareTitle}</h2>
                      <p className="text-gray-700">{t.flareDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Activity className="w-5 h-5" />
                    {t.immediateActions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[t.flareAction1, t.flareAction2, t.flareAction3, t.flareAction4].map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Dumbbell className="w-5 h-5" />
                    {t.exerciseModifications}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[t.flareExercise1, t.flareExercise2, t.flareExercise3, t.flareExercise4].map((exercise, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">{exercise}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Heart className="w-5 h-5" />
                    {t.painManagement}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[t.flarePain1, t.flarePain2, t.flarePain3, t.flarePain4].map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">{pain}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      {t.whenToContact}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {[t.flareContact1, t.flareContact2, t.flareContact3, t.flareContact4].map((contact, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-600">•</span>
                          <span>{contact}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={createPageUrl("Therapist")}>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t.contactTherapist}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="w-5 h-5" />
                      {t.flareRecoveryTips}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[t.flareTip1, t.flareTip2, t.flareTip3, t.flareTip4].map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.pain} - {t.average}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{calculateAverage('painScore')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.stiffness} - {t.average}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">{calculateAverage('stiffnessScore')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.function} - {t.average}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">{calculateAverage('functionScore')}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t.lastWeek}</CardTitle>
              </CardHeader>
              <CardContent>
                {weekData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={weekData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="pain" fill="#3b82f6" name={t.pain} />
                      <Bar dataKey="stiffness" fill="#a855f7" name={t.stiffness} />
                      <Bar dataKey="function" fill="#10b981" name={t.function} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>{t.noData}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  {t.trends} - {t.lastMonth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis domain={[0, 10]} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0f2fe',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pain"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name={t.pain}
                        dot={{ fill: '#3b82f6', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="stiffness"
                        stroke="#a855f7"
                        strokeWidth={3}
                        name={t.stiffness}
                        dot={{ fill: '#a855f7', r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="function"
                        stroke="#10b981"
                        strokeWidth={3}
                        name={t.function}
                        dot={{ fill: '#10b981', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>{t.noData}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <FooterDisclaimer lang={lang} />
      </div>
    </div>
  );
}