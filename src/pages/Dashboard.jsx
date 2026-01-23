import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp, 
  Calendar, 
  Target,
  Dumbbell,
  Activity,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lock,
  Apple,
  BookOpen,
  PartyPopper,
  UserCheck
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardOnboarding from "../components/dashboard/DashboardOnboarding";
import EducationProgress from "../components/dashboard/EducationProgress";
import PainPrediction from "../components/dashboard/PainPrediction";

const translations = {
  nl: {
    welcome: "Welkom terug",
    painLevel: "Pijnniveau",
    streak: "Opeenvolgende Dagen",
    days: "dagen",
    quickActions: "Snelle Acties",
    logProgress: "Log Voortgang",
    startExercise: "Start Oefening",
    setGoal: "Doel Stellen",
    recentTrend: "Recente Trend (7 dagen)",
    viewAll: "Bekijk Alles",
    noPainData: "Begin met loggen om je voortgang te zien",
    logToday: "Log vandaag je voortgang",
    notLoggedToday: "Je hebt vandaag nog niet gelogd",
    goToProgress: "Naar Voortgang",
    weekProgress: "Deze Week",
    dayProgress: "dagen gelogd",
    flareDetected: "Flare Gedetecteerd",
    checkFlareProtocol: "Bekijk Flare Protocol",
    exerciseLocked: "Voltoooi eerst je basis educatie",
    exerciseLockedDesc: "Je oefenprogramma wordt ontgrendeld zodra je de 3 kern lessen hebt voltooid. Kennis is de basis voor effectieve actie!",
    nutritionLocked: "Voedingsplan ontgrendelen",
    nutritionLockedDesc: "Je persoonlijke voedingsplan wordt ontgrendeld na voltooiing van de basis educatie.",
    goToLibrary: "Naar Bibliotheek",
    programUnlocked: "Programma Ontgrendeld!",
    congratsMessage: "Je hebt alle basis lessen voltooid! Je volledige programma met oefeningen en voeding is nu beschikbaar.",
    exploreExercises: "Verken Oefeningen",
    exploreNutrition: "Verken Voeding"
  },
  en: {
    welcome: "Welcome back",
    painLevel: "Pain Level",
    streak: "Day Streak",
    days: "days",
    quickActions: "Quick Actions",
    logProgress: "Log Progress",
    startExercise: "Start Exercise",
    setGoal: "Set Goal",
    recentTrend: "Recent Trend (7 days)",
    viewAll: "View All",
    noPainData: "Start logging to see your progress",
    logToday: "Log your progress today",
    notLoggedToday: "You haven't logged today yet",
    goToProgress: "Go to Progress",
    weekProgress: "This Week",
    dayProgress: "days logged",
    flareDetected: "Flare Detected",
    checkFlareProtocol: "Check Flare Protocol",
    exerciseLocked: "Complete your core education first",
    exerciseLockedDesc: "Your exercise program will unlock once you've completed the 3 core lessons. Knowledge is the foundation for effective action!",
    nutritionLocked: "Unlock Nutrition Plan",
    nutritionLockedDesc: "Your personalized nutrition plan will unlock after completing the core education.",
    goToLibrary: "Go to Library",
    programUnlocked: "Program Unlocked!",
    congratsMessage: "You've completed all core lessons! Your full program with exercises and nutrition is now available.",
    exploreExercises: "Explore Exercises",
    exploreNutrition: "Explore Nutrition"
  }
};

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements', user?.email],
    queryFn: () => base44.entities.Measurement.filter({ created_by: user.email }, "-date", 30),
    enabled: !!user?.onboardingCompleted,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.EducationLesson.list("order", 50),
    enabled: !!user?.onboardingCompleted,
  });

  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      setIsLoadingData(false);
    }
  }, [userLoading]);

  if (isLoadingData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  if (!user?.onboardingCompleted) {
    return <DashboardOnboarding user={user} onComplete={() => window.location.reload()} lang={lang} />;
  }

  const completedCoreLessons = user?.completedCoreLessons || [];
  const coreLessons = lessons.filter(l => l.isCoreLesson === true);
  const hasCompletedEducation = coreLessons.length > 0 && 
    coreLessons.every(l => completedCoreLessons.includes(l.key));
  
  const chartData = measurements.slice(0, 7).reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString(lang, { month: 'short', day: 'numeric' }),
    pain: log.painScore || 0,
    function: log.functionScore || 0
  }));

  const latestLog = measurements[0];
  const streak = calculateStreak(measurements);
  const today = new Date().toISOString().split('T')[0];
  const loggedToday = measurements.some(m => m.date === today);
  const weekLogs = measurements.filter(m => {
    const logDate = new Date(m.date);
    const daysDiff = Math.floor((new Date() - logDate) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  }).length;

  const hasFlare = latestLog?.isFlare || (latestLog?.painScore > 7 || latestLog?.stiffnessScore > 7);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {t.welcome}, {user.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Therapist Reminder */}
        {!user?.therapistEmail && (
          <Card className="mb-6 border-2 border-blue-300 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-6 h-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">
                    {lang === "nl" 
                      ? "Koppel een fysiotherapeut voor optimale begeleiding" 
                      : "Link a physiotherapist for optimal guidance"}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    {lang === "nl"
                      ? "Wij raden aan om deze app te gebruiken in samenwerking met een fysiotherapeut. Zo krijg je persoonlijke feedback en kun je je voortgang delen."
                      : "We recommend using this app in collaboration with a physiotherapist. This way you get personal feedback and can share your progress."}
                  </p>
                  <Link to={createPageUrl("Therapist")}>
                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                      {lang === "nl" ? "Fysiotherapeut Koppelen" : "Link Physiotherapist"}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education Progress Card - ALWAYS SHOW if not complete */}
        {!hasCompletedEducation && (
          <div className="mb-8">
            <EducationProgress user={user} onLessonComplete={() => window.location.reload()} />
          </div>
        )}

        {/* Completion Celebration Banner */}
        {hasCompletedEducation && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-green-900 mb-2">{t.programUnlocked}</h2>
                  <p className="text-green-800 mb-4">{t.congratsMessage}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link to={createPageUrl("Exercises")}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Dumbbell className="w-4 h-4 mr-2" />
                        {t.exploreExercises}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Nutrition")}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Apple className="w-4 h-4 mr-2" />
                        {t.exploreNutrition}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flare Alert */}
        {hasFlare && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">{t.flareDetected}</h3>
                  <p className="text-orange-800 text-sm mb-3">{t.checkFlareProtocol}</p>
                  <Link to={createPageUrl("Progress")}>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      {t.checkFlareProtocol}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Action Card */}
        {!loggedToday && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t.logToday}</h3>
                    <p className="text-gray-600 text-sm">{t.notLoggedToday}</p>
                  </div>
                </div>
                <Link to={createPageUrl("Progress")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {t.goToProgress}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pain Prediction Card */}
        <div className="mb-8">
          <PainPrediction user={user} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">{t.painLevel}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">{latestLog?.painScore || '-'}<span className="text-xl">/10</span></p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">{lang === "nl" ? "Functie" : "Function"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">{latestLog?.functionScore || '-'}<span className="text-xl">/10</span></p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">{t.streak}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">{streak}</p>
              <p className="text-xs opacity-75 mt-1">{t.days}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">{t.weekProgress}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">{weekLogs}/7</p>
              <p className="text-xs opacity-75 mt-1">{t.dayProgress}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-sky-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    {t.recentTrend}
                  </CardTitle>
                  <Link to={createPageUrl("Progress")}>
                    <Button variant="outline" size="sm">
                      {t.viewAll}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
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
                        stroke="#ef4444" 
                        strokeWidth={3}
                        name={lang === "nl" ? "Pijn" : "Pain"}
                        dot={{ fill: '#ef4444', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="function" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        name={lang === "nl" ? "Functie" : "Function"}
                        dot={{ fill: '#22c55e', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>{t.noPainData}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="shadow-lg border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {t.quickActions}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl("Progress")}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                    <Activity className="w-5 h-5 mr-2" />
                    {t.logProgress}
                  </Button>
                </Link>
                
                {hasCompletedEducation ? (
                  <Link to={createPageUrl("Exercises")}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 justify-start">
                      <Dumbbell className="w-5 h-5 mr-2" />
                      {t.startExercise}
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl("Library")}>
                    <Button className="w-full bg-gray-400 hover:bg-gray-500 justify-start">
                      <Lock className="w-5 h-5 mr-2" />
                      {t.startExercise}
                    </Button>
                  </Link>
                )}
                
                <Link to={createPageUrl("Goals")}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 justify-start">
                    <Target className="w-5 h-5 mr-2" />
                    {t.setGoal}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Locked Program Cards */}
        {!hasCompletedEducation && (
          <div className="space-y-6">
            <Card className="shadow-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Dumbbell className="w-6 h-6 text-blue-600" />
                      {t.exerciseLocked}
                    </h3>
                    <p className="text-gray-700 mb-4">{t.exerciseLockedDesc}</p>
                    <Link to={createPageUrl("Library")}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t.goToLibrary}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Apple className="w-6 h-6 text-emerald-600" />
                      {t.nutritionLocked}
                    </h3>
                    <p className="text-gray-700 mb-4">{t.nutritionLockedDesc}</p>
                    <Link to={createPageUrl("Library")}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t.goToLibrary}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateStreak(logs) {
  if (logs.length === 0) return 0;
  
  let streak = 1;
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const currentDate = new Date(sortedLogs[i].date);
    const nextDate = new Date(sortedLogs[i + 1].date);
    const diffDays = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}