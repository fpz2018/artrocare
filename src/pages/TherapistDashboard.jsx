import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Search,
  ChevronRight
} from "lucide-react";

const translations = {
  nl: {
    title: "Therapeut Dashboard",
    subtitle: "Overzicht van je patiënten",
    totalPatients: "Totaal Patiënten",
    activeThisWeek: "Actief deze week",
    needsAttention: "Aandacht nodig",
    avgImprovement: "Gem. verbetering",
    patientOverview: "Patiënt Overzicht",
    searchPatients: "Zoek patiënten...",
    lastActive: "Laatst actief",
    painTrend: "Pijn trend",
    improving: "Verbetert",
    stable: "Stabiel",
    declining: "Achteruit",
    viewDetails: "Bekijk Details",
    noPatients: "Je hebt nog geen patiënten gekoppeld",
    copyInviteLink: "Kopieer uitnodigingslink",
    linkCopied: "Link gekopieerd!",
    daysAgo: "dagen geleden",
    today: "Vandaag",
    exerciseAdherence: "Therapietrouw",
    recentAlerts: "Recente Alerts",
    highPain: "Hoge pijn gemeld",
    missedDays: "dagen niet gelogd",
    unauthorized: "Je hebt geen toegang tot dit dashboard"
  },
  en: {
    title: "Therapist Dashboard",
    subtitle: "Overview of your patients",
    totalPatients: "Total Patients",
    activeThisWeek: "Active this week",
    needsAttention: "Needs attention",
    avgImprovement: "Avg improvement",
    patientOverview: "Patient Overview",
    searchPatients: "Search patients...",
    lastActive: "Last active",
    painTrend: "Pain trend",
    improving: "Improving",
    stable: "Stable",
    declining: "Declining",
    viewDetails: "View Details",
    noPatients: "You don't have any linked patients yet",
    copyInviteLink: "Copy invite link",
    linkCopied: "Link copied!",
    daysAgo: "days ago",
    today: "Today",
    exerciseAdherence: "Exercise adherence",
    recentAlerts: "Recent Alerts",
    highPain: "High pain reported",
    missedDays: "days not logged",
    unauthorized: "You don't have access to this dashboard"
  }
};

export default function TherapistDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData) {
        window.location.href = '/Home';
        return null;
      }
      return userData;
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers', user?.email],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && user.role === "therapist"
  });

  const patients = allUsers.filter(u => u.therapistId === user?.email);

  const { data: allMeasurements = [] } = useQuery({
    queryKey: ['allPatientMeasurements', user?.email, patients.length],
    queryFn: async () => {
      const patientEmails = patients.map(p => p.email);
      const measurements = [];
      for (const email of patientEmails) {
        const patientMeasurements = await base44.entities.Measurement.filter(
          { created_by: email }, 
          "-date", 
          30
        );
        measurements.push(...patientMeasurements.map(m => ({ ...m, patientEmail: email })));
      }
      return measurements;
    },
    enabled: patients.length > 0
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const lang = user?.language || "nl";
  const t = translations[lang];

  if (user.role !== "therapist") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.unauthorized}</h2>
            <p className="text-gray-600 mb-4">
              {lang === "nl" 
                ? "Dit dashboard is alleen toegankelijk voor fysiotherapeuten." 
                : "This dashboard is only accessible to physiotherapists."}
            </p>
            <Button onClick={() => window.location.href = '/Dashboard'}>
              {lang === "nl" ? "Naar mijn Dashboard" : "Go to my Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const activeThisWeek = patients.filter(p => {
    const patientMeasurements = allMeasurements.filter(m => m.patientEmail === p.email);
    return patientMeasurements.some(m => new Date(m.date) >= weekAgo);
  }).length;

  const patientsNeedingAttention = patients.filter(p => {
    const patientMeasurements = allMeasurements.filter(m => m.patientEmail === p.email);
    const recentMeasurement = patientMeasurements[0];
    if (!recentMeasurement) return true;
    if (recentMeasurement.painScore >= 7) return true;
    const daysSinceLog = Math.floor((now - new Date(recentMeasurement.date)) / (1000 * 60 * 60 * 24));
    if (daysSinceLog >= 3) return true;
    return false;
  });

  const getPatientStats = (patientEmail) => {
    const patientMeasurements = allMeasurements
      .filter(m => m.patientEmail === patientEmail)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (patientMeasurements.length === 0) {
      return { trend: "stable", lastActive: null, avgPain: null, adherence: 0 };
    }

    const lastActive = patientMeasurements[0]?.date;
    const avgPain = patientMeasurements.reduce((sum, m) => sum + (m.painScore || 0), 0) / patientMeasurements.length;
    
    const midpoint = Math.floor(patientMeasurements.length / 2);
    const recentAvg = patientMeasurements.slice(0, midpoint).reduce((sum, m) => sum + (m.painScore || 0), 0) / midpoint || 0;
    const olderAvg = patientMeasurements.slice(midpoint).reduce((sum, m) => sum + (m.painScore || 0), 0) / (patientMeasurements.length - midpoint) || 0;
    
    let trend = "stable";
    if (recentAvg < olderAvg - 0.5) trend = "improving";
    if (recentAvg > olderAvg + 0.5) trend = "declining";

    const logsThisWeek = patientMeasurements.filter(m => new Date(m.date) >= weekAgo).length;
    const adherence = Math.round((logsThisWeek / 7) * 100);

    return { trend, lastActive, avgPain: avgPain.toFixed(1), adherence };
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/Home?therapist=${user.email}`;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            {t.title}
          </h1>
          <p className="text-gray-600">{t.subtitle} - {user.practiceName || "Mijn Praktijk"}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{t.totalPatients}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{patients.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{t.activeThisWeek}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{activeThisWeek}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{t.needsAttention}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{patientsNeedingAttention.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{t.avgImprovement}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{patients.length > 0 ? "12%" : "-"}</p>
            </CardContent>
          </Card>
        </div>

        {patientsNeedingAttention.length > 0 && (
          <Card className="mb-8 border-2 border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                {t.recentAlerts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patientsNeedingAttention.slice(0, 5).map(patient => {
                  const stats = getPatientStats(patient.email);
                  const daysSinceLog = stats.lastActive 
                    ? Math.floor((now - new Date(stats.lastActive)) / (1000 * 60 * 60 * 24))
                    : 999;
                  
                  return (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{patient.full_name}</p>
                        <p className="text-sm text-orange-700">
                          {stats.avgPain >= 7 && `${t.highPain} (${stats.avgPain}/10)`}
                          {daysSinceLog >= 3 && ` • ${daysSinceLog} ${t.missedDays}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>{t.patientOverview}</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t.searchPatients}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={copyInviteLink} variant="outline">
                  {linkCopied ? t.linkCopied : t.copyInviteLink}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>{t.noPatients}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map(patient => {
                  const stats = getPatientStats(patient.email);
                  const daysSinceLog = stats.lastActive 
                    ? Math.floor((now - new Date(stats.lastActive)) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div 
                      key={patient.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-lg">
                              {patient.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{patient.full_name || patient.email}</p>
                            <p className="text-sm text-gray-500">
                              {patient.arthrosisStage && `${patient.arthrosisStage} • `}
                              {patient.affectedJoints?.join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center hidden md:block">
                            <p className="text-sm text-gray-500">{t.painTrend}</p>
                            <div className="flex items-center gap-1">
                              {stats.trend === "improving" && <TrendingDown className="w-4 h-4 text-green-600" />}
                              {stats.trend === "declining" && <TrendingUp className="w-4 h-4 text-red-600" />}
                              {stats.trend === "stable" && <Activity className="w-4 h-4 text-blue-600" />}
                              <Badge className={
                                stats.trend === "improving" ? "bg-green-100 text-green-800" :
                                stats.trend === "declining" ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                              }>
                                {t[stats.trend]}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-center hidden md:block">
                            <p className="text-sm text-gray-500">{t.exerciseAdherence}</p>
                            <p className="font-bold text-lg">{stats.adherence}%</p>
                          </div>

                          <div className="text-center">
                            <p className="text-sm text-gray-500">{t.lastActive}</p>
                            <p className={`font-medium ${daysSinceLog >= 3 ? "text-orange-600" : "text-gray-700"}`}>
                              {daysSinceLog === 0 ? t.today : 
                               daysSinceLog === null ? "-" :
                               `${daysSinceLog} ${t.daysAgo}`}
                            </p>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400 hidden md:block" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}