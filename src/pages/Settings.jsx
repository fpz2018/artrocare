import React, { useState, useEffect } from "react";
import { sanitizeInput } from "@/components/utils/sanitize";
import { base44 } from "@/api/base44Client";
import { requestNotificationPermission } from "@/components/utils/notifications";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Bell, 
  Shield,
  LogOut,
  Save,
  FileText
} from "lucide-react";
import { disclaimerContent } from "@/components/legal/Disclaimer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const translations = {
  nl: {
    title: "Instellingen",
    subtitle: "Beheer je account en voorkeuren",
    profile: "Profiel",
    notifications: "Meldingen",
    privacy: "Privacy & Veiligheid",
    language: "Taal",
    fullName: "Volledige naam",
    email: "E-mailadres",
    height: "Lengte (cm)",
    weight: "Gewicht (kg)",
    save: "Opslaan",
    saved: "Opgeslagen!",
    dailyReminders: "Dagelijkse herinneringen",
    exerciseNotifications: "Oefening notificaties",
    progressReports: "Voortgangsrapporten",
    pushNotifications: "Push notificaties",
    pushNotificationsDesc: "Ontvang herinneringen op je apparaat",
    enabled: "Ingeschakeld",
    enable: "Inschakelen",
    reminderTime: "Herinneringstijd",
    dataExport: "Data exporteren",
    deleteAccount: "Account verwijderen",
    logout: "Uitloggen",
    exportData: "Exporteer mijn data",
    dangerZone: "Gevaarzone",
    deleteWarning: "Dit kan niet ongedaan worden gemaakt",
    accountSettings: "Account instellingen"
  },
  en: {
    title: "Settings",
    subtitle: "Manage your account and preferences",
    profile: "Profile",
    notifications: "Notifications",
    privacy: "Privacy & Security",
    language: "Language",
    fullName: "Full name",
    email: "Email address",
    height: "Height (cm)",
    weight: "Weight (kg)",
    save: "Save",
    saved: "Saved!",
    dailyReminders: "Daily reminders",
    exerciseNotifications: "Exercise notifications",
    progressReports: "Progress reports",
    pushNotifications: "Push notifications",
    pushNotificationsDesc: "Receive reminders on your device",
    enabled: "Enabled",
    enable: "Enable",
    reminderTime: "Reminder time",
    dataExport: "Export data",
    deleteAccount: "Delete account",
    logout: "Logout",
    exportData: "Export my data",
    dangerZone: "Danger zone",
    deleteWarning: "This cannot be undone",
    accountSettings: "Account settings"
  }
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    height: "",
    weight: "",
    language: "nl"
  });
  const [notifications, setNotifications] = useState({
    dailyCheckIn: true,
    exerciseReminders: true,
    progressReports: true,
    pushEnabled: false,
    reminderTime: "09:00"
  });
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && "Notification" in window ? Notification.permission : "default"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

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
      setFormData({
        full_name: userData.full_name || "",
        height: userData.height || "",
        weight: userData.weight || "",
        language: userData.language || "nl"
      });
      setNotifications(userData.notificationSettings || notifications);
    } catch (error) {
      console.error("Error loading settings:", error);
      window.location.href = '/Home';
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const languageChanged = formData.language !== user.language;
      
      await base44.auth.updateMe({
        full_name: sanitizeInput(formData.full_name),
        height: parseFloat(formData.height) || null,
        weight: parseFloat(formData.weight) || null,
        language: formData.language,
        notificationSettings: notifications
      });
      
      // Als taal is veranderd, direct reloaden
      if (languageChanged) {
        window.location.reload();
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        loadData();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? "granted" : "denied");
    if (granted) {
      setNotifications({ ...notifications, pushEnabled: true });
    }
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const lang = formData.language;
  const t = translations[lang];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" />
                {t.profile}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">{t.fullName}</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 bg-gray-50"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">{t.height}</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">{t.weight}</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>{t.language}</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setFormData({ ...formData, language: "nl" })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.language === "nl"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🇳🇱</span>
                      <span className="font-medium">Nederlands</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, language: "en" })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.language === "en"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🇬🇧</span>
                      <span className="font-medium">English</span>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                {t.notifications}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.dailyReminders}</p>
                  <p className="text-sm text-gray-600">
                    {lang === "nl" ? "Ontvang dagelijkse herinneringen voor check-ins" : "Receive daily check-in reminders"}
                  </p>
                </div>
                <Switch
                  checked={notifications.dailyCheckIn}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, dailyCheckIn: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.exerciseNotifications}</p>
                  <p className="text-sm text-gray-600">
                    {lang === "nl" ? "Herinneringen voor oefeningen" : "Exercise reminders"}
                  </p>
                </div>
                <Switch
                  checked={notifications.exerciseReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, exerciseReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.progressReports}</p>
                  <p className="text-sm text-gray-600">
                    {lang === "nl" ? "Wekelijkse voortgangsrapporten" : "Weekly progress reports"}
                  </p>
                </div>
                <Switch
                  checked={notifications.progressReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, progressReports: checked })}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900">{t.pushNotifications}</p>
                    <p className="text-sm text-gray-600">
                      {t.pushNotificationsDesc}
                    </p>
                  </div>
                  {notificationPermission === "granted" ? (
                    <Badge className="bg-green-100 text-green-800">
                      {t.enabled}
                    </Badge>
                  ) : (
                    <Button onClick={enableNotifications} size="sm">
                      {t.enable}
                    </Button>
                  )}
                </div>

                {notificationPermission === "granted" && (
                  <div className="mt-4">
                    <Label htmlFor="reminderTime">{t.reminderTime}</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={notifications.reminderTime || "09:00"}
                      onChange={(e) => setNotifications({ ...notifications, reminderTime: e.target.value })}
                      className="mt-2 w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                {t.privacy}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                {t.exportData}
              </Button>
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-red-600 mb-2">{t.dangerZone}</p>
                <Button variant="destructive" className="w-full">
                  {t.deleteAccount}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">{t.deleteWarning}</p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Disclaimer */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {lang === "nl" ? "Voorwaarden & Disclaimer" : "Terms & Disclaimer"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowTerms(true)}
              >
                <Shield className="w-4 h-4 mr-2" />
                {lang === "nl" ? "Bekijk gebruiksvoorwaarden" : "View terms of use"}
              </Button>
              
              {user?.disclaimerAcceptedAt && (
                <p className="text-xs text-gray-500">
                  {lang === "nl" ? "Akkoord gegaan op: " : "Agreed on: "}
                  {new Date(user.disclaimerAcceptedAt).toLocaleDateString(lang, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || showSuccess}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            >
              {showSuccess ? (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t.saved}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t.save}
                </>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:bg-red-50 py-6"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t.logout}
            </Button>
          </div>
        </div>

        {showTerms && (
          <Dialog open={showTerms} onOpenChange={setShowTerms}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {lang === "nl" ? "Gebruiksvoorwaarden & Disclaimer" : "Terms of Use & Disclaimer"}
                </DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {disclaimerContent[lang].fullDisclaimer}
              </div>
              <Button onClick={() => setShowTerms(false)} className="mt-4">
                {lang === "nl" ? "Sluiten" : "Close"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}