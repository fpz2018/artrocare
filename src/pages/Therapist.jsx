
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Measurement } from "@/entities/Measurement";
import { SendEmail } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  FileText,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  TrendingUp,
  User as UserIcon,
  Loader2
} from "lucide-react";

const translations = {
  nl: {
    title: "Contact met Fysiotherapeut",
    subtitle: "Communiceer met je zorgverlener en deel je voortgang",
    sendMessage: "Bericht Versturen",
    shareReport: "Voortgangsrapport Delen",
    myTherapist: "Mijn Fysiotherapeut",
    noTherapist: "Nog geen fysiotherapeut gekoppeld",
    addTherapist: "Fysiotherapeut Toevoegen",
    therapistName: "Naam fysiotherapeut",
    therapistEmail: "Email fysiotherapeut",
    therapistPhone: "Telefoonnummer",
    agendaUrl: "Online Agenda URL",
    agendaUrlPlaceholder: "https://agenda.praktijk.nl/afspraak-maken",
    bookAppointment: "Plan Afspraak Online",
    save: "Opslaan",
    cancel: "Annuleren",
    messagePlaceholder: "Typ je bericht hier...",
    subject: "Onderwerp",
    message: "Bericht",
    send: "Verzenden",
    sent: "Verzonden!",
    reportTitle: "Voortgangsrapport",
    generateReport: "Rapport Genereren",
    shareViaEmail: "Delen via Email",
    lastContact: "Laatste contact",
    contactHistory: "Contact Geschiedenis",
    quickActions: "Snelle Acties",
    requestAppointment: "Afspraak Aanvragen",
    askQuestion: "Vraag Stellen",
    shareProgress: "Voortgang Delen",
    reportPeriod: "Rapportperiode",
    last7Days: "Afgelopen 7 dagen",
    last30Days: "Afgelopen 30 dagen",
    last90Days: "Afgelopen 90 dagen",
    summary: "Samenvatting",
    avgPain: "Gem. Pijn",
    avgMobility: "Gem. Mobiliteit",
    exercisesCompleted: "Oefeningen Voltooid",
    consultRequest: "Consult Aanvraag",
    urgency: "Urgentie",
    low: "Laag",
    medium: "Gemiddeld",
    high: "Hoog",
    preferredDate: "Voorkeursdatum",
    preferredTime: "Voorkeurstijd",
    reason: "Reden voor consult",
    sendingEmail: "Bezig met verzenden..."
  },
  en: {
    title: "Contact Physiotherapist",
    subtitle: "Communicate with your healthcare provider and share your progress",
    sendMessage: "Send Message",
    shareReport: "Share Progress Report",
    myTherapist: "My Physiotherapist",
    noTherapist: "No physiotherapist linked yet",
    addTherapist: "Add Physiotherapist",
    therapistName: "Therapist name",
    therapistEmail: "Therapist email",
    therapistPhone: "Phone number",
    agendaUrl: "Online Calendar URL",
    agendaUrlPlaceholder: "https://calendar.practice.com/book",
    bookAppointment: "Book Appointment Online",
    save: "Save",
    cancel: "Cancel",
    messagePlaceholder: "Type your message here...",
    subject: "Subject",
    message: "Message",
    send: "Send",
    sent: "Sent!",
    reportTitle: "Progress Report",
    generateReport: "Generate Report",
    shareViaEmail: "Share via Email",
    lastContact: "Last contact",
    contactHistory: "Contact History",
    quickActions: "Quick Actions",
    requestAppointment: "Request Appointment",
    askQuestion: "Ask Question",
    shareProgress: "Share Progress",
    reportPeriod: "Report Period",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last90Days: "Last 90 days",
    summary: "Summary",
    avgPain: "Avg Pain",
    avgMobility: "Avg Mobility",
    exercisesCompleted: "Exercises Completed",
    consultRequest: "Consultation Request",
    urgency: "Urgency",
    low: "Low",
    medium: "Medium",
    high: "High",
    preferredDate: "Preferred Date",
    preferredTime: "Preferred Time",
    reason: "Reason for consultation",
    sendingEmail: "Sending..."
  }
};

export default function Therapist() {
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [showTherapistForm, setShowTherapistForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(7);
  const [therapistData, setTherapistData] = useState({
    name: "",
    email: "",
    phone: "",
    agendaUrl: ""
  });
  const [messageData, setMessageData] = useState({
    subject: "",
    message: ""
  });
  const [consultData, setConsultData] = useState({
    urgency: "medium",
    preferredDate: "",
    preferredTime: "",
    reason: ""
  });
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.therapist) {
        setTherapistData(userData.therapist);
      }

      const logs = await Measurement.filter({ created_by: userData.email }, "-date", 90);
      setMeasurements(logs);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const saveTherapist = async () => {
    await User.updateMyUserData({ therapist: therapistData });
    setShowTherapistForm(false);
    loadData();
  };

  const lang = user?.language || "nl"; // Define lang here so it's available in functions below
  const t = translations[lang];

  const sendMessage = async () => {
    if (!therapistData.email) {
      alert(lang === "nl" ? "Voeg eerst een fysiotherapeut toe" : "Please add a therapist first");
      return;
    }

    setIsSending(true);
    try {
      const appName = lang === "nl" ? "Artrose Kompas" : "JointWise";
      const appTagline = lang === "nl" ? "Powered by JointWise" : "Smart Care, Strong Joints";
      
      await SendEmail({
        to: therapistData.email,
        subject: `${appName} - ${messageData.subject}`,
        body: `
Bericht van: ${user.full_name} (${user.email})

${messageData.message}

---
Verzonden via ${appName} (${appTagline})
        `
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setMessageData({ subject: "", message: "" });
      setShowMessageForm(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(lang === "nl" ? "Er ging iets mis bij het verzenden. Probeer het opnieuw." : "Something went wrong. Please try again.");
    }
    setIsSending(false);
  };

  const sendConsultRequest = async () => {
    if (!therapistData.email) {
      alert(lang === "nl" ? "Voeg eerst een fysiotherapeut toe" : "Please add a therapist first");
      return;
    }

    setIsSending(true);
    try {
      const appName = lang === "nl" ? "Artrose Kompas" : "JointWise";
      const appTagline = lang === "nl" ? "Powered by JointWise" : "Smart Care, Strong Joints";
      
      const urgencyText = {
        low: lang === "nl" ? "Laag" : "Low",
        medium: lang === "nl" ? "Gemiddeld" : "Medium",
        high: lang === "nl" ? "Hoog" : "High"
      };

      const emailBody = `
${lang === "nl" ? "CONSULTAANVRAAG" : "CONSULTATION REQUEST"}

${lang === "nl" ? "Van" : "From"}: ${user.full_name} (${user.email})
${lang === "nl" ? "Urgentie" : "Urgency"}: ${urgencyText[consultData.urgency]}
${lang === "nl" ? "Voorkeursdatum" : "Preferred Date"}: ${consultData.preferredDate || (lang === "nl" ? "Niet opgegeven" : "Not specified")}
${lang === "nl" ? "Voorkeurstijd" : "Preferred Time"}: ${consultData.preferredTime || (lang === "nl" ? "Niet opgegeven" : "Not specified")}

${lang === "nl" ? "Reden voor consult" : "Reason for consultation"}:
${consultData.reason}

${therapistData.agendaUrl ? `\n${lang === "nl" ? "Online agenda" : "Online calendar"}: ${therapistData.agendaUrl}\n` : ''}

---
${lang === "nl" ? "Verzonden via" : "Sent via"} ${appName} (${appTagline})
      `;

      await SendEmail({
        to: therapistData.email,
        subject: `${appName} - ${lang === "nl" ? "Consult Aanvraag" : "Consultation Request"} (${urgencyText[consultData.urgency]})`,
        body: emailBody
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setConsultData({ urgency: "medium", preferredDate: "", preferredTime: "", reason: "" });
      setShowConsultForm(false);
    } catch (error) {
      console.error("Error sending consultation request:", error);
      alert(lang === "nl" ? "Er ging iets mis bij het verzenden. Probeer het opnieuw." : "Something went wrong. Please try again.");
    }
    setIsSending(false);
  };

  const shareProgressReport = async () => {
    if (!therapistData.email) {
      alert(lang === "nl" ? "Voeg eerst een fysiotherapeut toe" : "Please add a therapist first");
      return;
    }

    setIsSending(true);
    try {
      const appName = lang === "nl" ? "Artrose Kompas" : "JointWise";
      const appTagline = lang === "nl" ? "Powered by JointWise" : "Smart Care, Strong Joints";
      
      const periodData = measurements.slice(0, reportPeriod);
      
      if (periodData.length === 0) {
        alert(lang === "nl" ? "Geen data beschikbaar om te delen" : "No data available to share");
        setIsSending(false);
        return;
      }

      const avgPain = periodData.reduce((sum, m) => sum + (m.painScore || 0), 0) / periodData.length;
      const avgMobility = periodData.reduce((sum, m) => sum + (m.functionScore || 0), 0) / periodData.length;
      
      const report = `
${lang === "nl" ? "VOORTGANGSRAPPORT" : "PROGRESS REPORT"} - ${user.full_name}
${lang === "nl" ? "Periode" : "Period"}: ${reportPeriod} ${lang === "nl" ? "dagen" : "days"}
${lang === "nl" ? "Datum" : "Date"}: ${new Date().toLocaleDateString(lang)}

${lang === "nl" ? "SAMENVATTING" : "SUMMARY"}:
- ${lang === "nl" ? "Gemiddelde pijn" : "Average pain"}: ${avgPain.toFixed(1)}/10
- ${lang === "nl" ? "Gemiddelde mobiliteit" : "Average mobility"}: ${avgMobility.toFixed(1)}/10
- ${lang === "nl" ? "Metingen" : "Measurements"}: ${periodData.length}

${lang === "nl" ? "DAGELIJKSE METINGEN" : "DAILY MEASUREMENTS"}:
${periodData.map(m => `
${lang === "nl" ? "Datum" : "Date"}: ${new Date(m.date).toLocaleDateString(lang)}
- ${lang === "nl" ? "Pijn" : "Pain"}: ${m.painScore || '-'}/10
- ${lang === "nl" ? "Stijfheid" : "Stiffness"}: ${m.stiffnessScore || '-'}/10
- ${lang === "nl" ? "Functie" : "Function"}: ${m.functionScore || '-'}/10
- ${lang === "nl" ? "Stemming" : "Mood"}: ${m.mood || '-'}
${m.notes ? `- ${lang === "nl" ? "Notities" : "Notes"}: ${m.notes}` : ''}
`).join('\n')}

---
${lang === "nl" ? "Verzonden via" : "Sent via"} ${appName} (${appTagline})
      `;

      await SendEmail({
        to: therapistData.email,
        subject: `${appName} - ${lang === "nl" ? "Voortgangsrapport" : "Progress Report"} ${user.full_name}`,
        body: report
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error sharing report:", error);
      alert(lang === "nl" ? "Er ging iets mis bij het verzenden. Probeer het opnieuw." : "Something went wrong. Please try again.");
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const hasTherapist = therapistData.email !== "";

  const calculateStats = (days) => {
    const data = measurements.filter(m => {
        const date = new Date(m.date);
        const today = new Date();
        today.setHours(0,0,0,0); // Reset time for accurate comparison
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    });

    if (data.length === 0) return { avgPain: 0, avgMobility: 0, count: 0 };
    
    return {
      avgPain: (data.reduce((sum, m) => sum + (m.painScore || 0), 0) / data.length).toFixed(1),
      avgMobility: (data.reduce((sum, m) => sum + (m.functionScore || 0), 0) / data.length).toFixed(1),
      count: data.length
    };
  };

  const stats = calculateStats(reportPeriod);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{t.sent}</p>
          </div>
        )}

        {/* Therapist Info Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              {t.myTherapist}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTherapist ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{therapistData.name}</h3>
                        <Badge className="mt-1">Fysiotherapeut</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 ml-15">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{therapistData.email}</span>
                      </div>
                      {therapistData.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{therapistData.phone}</span>
                        </div>
                      )}
                      {therapistData.agendaUrl && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <a 
                            href={therapistData.agendaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {t.bookAppointment}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTherapistForm(true)}
                  >
                    {lang === "nl" ? "Bewerken" : "Edit"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">{t.noTherapist}</p>
                <Button
                  onClick={() => setShowTherapistForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t.addTherapist}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Therapist Form */}
        {showTherapistForm && (
          <Card className="mb-8 shadow-lg border-blue-200">
            <CardHeader>
              <CardTitle>{t.addTherapist}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.therapistName}</Label>
                <Input
                  value={therapistData.name}
                  onChange={(e) => setTherapistData({ ...therapistData, name: e.target.value })}
                  placeholder="Dr. Jan de Vries"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t.therapistEmail}</Label>
                <Input
                  type="email"
                  value={therapistData.email}
                  onChange={(e) => setTherapistData({ ...therapistData, email: e.target.value })}
                  placeholder="fysio@praktijk.nl"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t.therapistPhone}</Label>
                <Input
                  type="tel"
                  value={therapistData.phone}
                  onChange={(e) => setTherapistData({ ...therapistData, phone: e.target.value })}
                  placeholder="06-12345678"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t.agendaUrl}</Label>
                <Input
                  type="url"
                  value={therapistData.agendaUrl}
                  onChange={(e) => setTherapistData({ ...therapistData, agendaUrl: e.target.value })}
                  placeholder={t.agendaUrlPlaceholder}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {lang === "nl" 
                    ? "Optioneel: Link naar je online agenda voor snelle afspraken" 
                    : "Optional: Link to your online calendar for quick appointments"}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={saveTherapist} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {t.save}
                </Button>
                <Button
                  onClick={() => setShowTherapistForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasTherapist && (
          <>
            {/* Quick Actions */}
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle>{t.quickActions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {therapistData.agendaUrl ? (
                    <a 
                      href={therapistData.agendaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all"
                    >
                      <Calendar className="w-6 h-6" />
                      <span className="font-medium">{t.bookAppointment}</span>
                    </a>
                  ) : (
                    <Button
                      onClick={() => setShowConsultForm(true)}
                      className="h-24 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Calendar className="w-6 h-6" />
                      <span>{t.requestAppointment}</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowMessageForm(true)}
                    className="h-24 flex-col gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span>{t.askQuestion}</span>
                  </Button>
                  <Button
                    onClick={shareProgressReport}
                    disabled={isSending}
                    className="h-24 flex-col gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{t.sendingEmail}</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-6 h-6" />
                        <span>{t.shareProgress}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Request Form */}
            {showConsultForm && (
              <Card className="mb-8 shadow-lg border-blue-200">
                <CardHeader>
                  <CardTitle>{t.consultRequest}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t.urgency}</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {["low", "medium", "high"].map(level => (
                        <button
                          key={level}
                          onClick={() => setConsultData({ ...consultData, urgency: level })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            consultData.urgency === level
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {t[level]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.preferredDate}</Label>
                      <Input
                        type="date"
                        value={consultData.preferredDate}
                        onChange={(e) => setConsultData({ ...consultData, preferredDate: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>{t.preferredTime}</Label>
                      <Input
                        type="time"
                        value={consultData.preferredTime}
                        onChange={(e) => setConsultData({ ...consultData, preferredTime: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.reason}</Label>
                    <Textarea
                      value={consultData.reason}
                      onChange={(e) => setConsultData({ ...consultData, reason: e.target.value })}
                      placeholder={lang === "nl" ? "Beschrijf de reden voor het consult..." : "Describe the reason for consultation..."}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={sendConsultRequest}
                      disabled={isSending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t.send}
                    </Button>
                    <Button
                      onClick={() => setShowConsultForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message Form */}
            {showMessageForm && (
              <Card className="mb-8 shadow-lg border-blue-200">
                <CardHeader>
                  <CardTitle>{t.sendMessage}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t.subject}</Label>
                    <Input
                      value={messageData.subject}
                      onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                      placeholder={lang === "nl" ? "Onderwerp van je bericht" : "Message subject"}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{t.message}</Label>
                    <Textarea
                      value={messageData.message}
                      onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                      placeholder={t.messagePlaceholder}
                      className="mt-2"
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={sendMessage}
                      disabled={isSending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t.send}
                    </Button>
                    <Button
                      onClick={() => setShowMessageForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Report Preview */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {t.reportTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value={7}>{t.last7Days}</option>
                      <option value={30}>{t.last30Days}</option>
                      <option value={90}>{t.last90Days}</option>
                    </select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t.avgPain}</p>
                    <p className="text-2xl font-bold text-red-600">{stats.avgPain}/10</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t.avgMobility}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.avgMobility}/10</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{lang === "nl" ? "Metingen" : "Measurements"}</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.count}</p>
                  </div>
                </div>

                <Button
                  onClick={shareProgressReport}
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t.shareViaEmail}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
