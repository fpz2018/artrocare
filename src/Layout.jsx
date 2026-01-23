import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  TrendingUp, 
  BookOpen, 
  Crown,
  Settings,
  Menu,
  X,
  Globe,
  Loader2,
  Target,
  MessageCircle,
  Heart,
  Pill,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FooterDisclaimer } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    dashboard: "Dashboard",
    exercises: "Oefeningen",
    nutrition: "Voeding",
    progress: "Voortgang",
    goals: "Doelen",
    supplements: "Supplementen", // Added new translation key
    therapist: "Fysiotherapeut",
    library: "Bibliotheek",
    premium: "Premium",
    settings: "Instellingen",
    upgradePremium: "Upgrade naar Premium",
    appName: "Artrose Kompas",
    appTagline: "Powered by JointWise"
  },
  en: {
    dashboard: "Dashboard",
    exercises: "Exercises",
    nutrition: "Nutrition",
    progress: "Progress",
    goals: "Goals",
    supplements: "Supplements", // Added new translation key
    therapist: "Therapist",
    library: "Library",
    premium: "Premium",
    settings: "Settings",
    upgradePremium: "Upgrade to Premium",
    appName: "JointWise",
    appTagline: "Smart Care, Strong Joints"
  }
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const toggleLanguage = async () => {
    if (!user || isChangingLanguage) return;
    
    setIsChangingLanguage(true);
    const newLang = user.language === "nl" ? "en" : "nl";
    
    try {
      await User.updateMyUserData({ language: newLang });
      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.reload();
    } catch (error) {
      console.error("Error updating language:", error);
      setIsChangingLanguage(false);
    }
  };

  const lang = user?.language || "nl";
  const t = translations[lang];
  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "premium_practice";

  const navItems = [
    ...(user?.role === "therapist" ? [
      { name: lang === "nl" ? "Mijn Patiënten" : "My Patients", icon: Users, path: "TherapistDashboard" }
    ] : [
      { name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
      { name: t.progress, icon: TrendingUp, path: "Progress" },
      { name: t.exercises, icon: Dumbbell, path: "Exercises" },
      { name: t.goals, icon: Target, path: "Goals" },
      { name: t.nutrition, icon: Apple, path: "Nutrition" },
      { name: t.supplements, icon: Heart, path: "Supplements" },
      { name: lang === "nl" ? "Medicatie" : "Medication", icon: Pill, path: "Medication" },
      { name: t.therapist, icon: MessageCircle, path: "Therapist" },
      { name: t.library, icon: BookOpen, path: "Library" },
      { name: t.premium, icon: Crown, path: "Premium", highlight: !isPremium }
    ])
  ];

  if (isChangingLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {lang === "nl" ? "Taal wijzigen..." : "Changing language..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">{lang === "nl" ? "AK" : "JW"}</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">{t.appName}</span>
              <p className="text-[10px] text-gray-500 leading-tight">{t.appTagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              disabled={isChangingLanguage}
              className="text-gray-600"
            >
              {isChangingLanguage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : item.highlight
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.highlight && <Crown className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
            <Link
              to={createPageUrl("Settings")}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">{t.settings}</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <div className="w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{lang === "nl" ? "AK" : "JW"}</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">{t.appName}</h1>
              <p className="text-[10px] text-gray-500 leading-tight">{t.appTagline}</p>
            </div>
          </div>

          <nav className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg"
                      : item.highlight
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200 hover:shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.highlight && <Crown className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <Link
              to={createPageUrl("Settings")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPageName === "Settings"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">{t.settings}</span>
            </Link>

            <Button
              variant="outline"
              onClick={toggleLanguage}
              disabled={isChangingLanguage}
              className="w-full justify-start gap-3"
            >
              {isChangingLanguage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
              <span>{lang === "nl" ? "🇳🇱 Nederlands" : "🇬🇧 English"}</span>
            </Button>
          </div>

          {!isPremium && (
            <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-orange-200">
              <Crown className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Premium</h3>
              <p className="text-xs text-gray-600 mb-3">
                {lang === "nl" 
                  ? "Ontgrendel alle functies" 
                  : "Unlock all features"}
              </p>
              <Link to={createPageUrl("Premium")}>
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                  {t.upgradePremium}
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.full_name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || user.email}
                  </p>
                  {isPremium && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Premium
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-64 flex-1">
          {children}
          <FooterDisclaimer lang={user?.language || "nl"} />
        </div>
        </div>

        <div className="lg:hidden pt-16">
        {children}
        <FooterDisclaimer lang={user?.language || "nl"} />
        </div>
        </div>
        );
        }