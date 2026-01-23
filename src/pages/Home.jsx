import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Activity, Apple, TrendingUp, BookOpen, Globe, ArrowRight, CheckCircle, Shield } from "lucide-react";
import { disclaimerContent } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    appName: "Artrose Kompas",
    appTagline: "Powered by JointWise",
    welcome: "Welkom bij",
    subtitle: "Jouw persoonlijke begeleider bij artrose",
    description: "Evidence-based ondersteuning voor een actief leven met artrose. Neuromusculaire oefeningen, anti-inflammatoire voeding en praktische educatie.",
    features: "Wat je krijgt",
    feature1: "NEMEX-TJR oefenprogramma",
    feature2: "Persoonlijk voedingsplan",
    feature3: "Voortgang tracking",
    feature4: "Evidence-based educatie",
    feature5: "Direct contact met fysiotherapeut",
    feature6: "Supplementen advies",
    login: "Inloggen",
    register: "Account Aanmaken",
    alreadyUser: "Al een account?",
    noAccount: "Nog geen account?",
    forPatients: "Voor Patiënten",
    forTherapists: "Voor Fysiotherapeuten",
    scientificBasis: "Gebaseerd op het GLA:D programma en wetenschappelijk onderzoek",
    languageSwitch: "Switch to English",
    scientificProven: "Wetenschappelijk Bewezen",
    scientificProvenDesc: "Gebaseerd op het GLA:D programma met bewezen resultaten",
    personalGuidance: "Persoonlijke Begeleiding",
    personalGuidanceDesc: "Op maat gemaakt programma afgestemd op jouw situatie",
    measurableResults: "Meetbare Resultaten",
    measurableResultsDesc: "Volg je voortgang en zie je verbetering",
    termsAgreement: "Door in te loggen ga je akkoord met onze gebruiksvoorwaarden",
    therapistLogin: "Fysiotherapeut Login"
  },
  en: {
    appName: "JointWise",
    appTagline: "Smart Care, Strong Joints",
    welcome: "Welcome to",
    subtitle: "Your personal guide for arthritis",
    description: "Evidence-based support for an active life with arthritis. Neuromuscular exercises, anti-inflammatory nutrition, and practical education.",
    features: "What you get",
    feature1: "NEMEX-TJR exercise program",
    feature2: "Personalized nutrition plan",
    feature3: "Progress tracking",
    feature4: "Evidence-based education",
    feature5: "Direct therapist contact",
    feature6: "Supplement advice",
    login: "Login",
    register: "Create Account",
    alreadyUser: "Already have an account?",
    noAccount: "Don't have an account?",
    forPatients: "For Patients",
    forTherapists: "For Therapists",
    scientificBasis: "Based on the GLA:D program and scientific research",
    languageSwitch: "Schakel naar Nederlands",
    scientificProven: "Scientifically Proven",
    scientificProvenDesc: "Based on the GLA:D program with proven results",
    personalGuidance: "Personal Guidance",
    personalGuidanceDesc: "Tailored program adapted to your situation",
    measurableResults: "Measurable Results",
    measurableResultsDesc: "Track your progress and see your improvement",
    termsAgreement: "By logging in you agree to our terms of service",
    therapistLogin: "Therapist Login"
  }
};

export default function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("nl");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        // Kleine vertraging om logout proces te laten voltooien
        setTimeout(() => {
          base44.auth.isAuthenticated().then(stillAuth => {
            if (stillAuth) {
              navigate(createPageUrl("Dashboard"));
            } else {
              setIsCheckingAuth(false);
            }
          });
        }, 100);
      } else {
        setIsCheckingAuth(false);
      }
    } catch (error) {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem("preferredLanguage", lang);
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const toggleLanguage = () => {
    setLang(lang === "nl" ? "en" : "nl");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const t = translations[lang];

  const features = [
    { icon: Activity, text: t.feature1 },
    { icon: Apple, text: t.feature2 },
    { icon: TrendingUp, text: t.feature3 },
    { icon: BookOpen, text: t.feature4 },
    { icon: Heart, text: t.feature5 },
    { icon: Heart, text: t.feature6 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2 shadow-md"
        >
          <Globe className="w-4 h-4" />
          <span className="font-semibold">{lang === "nl" ? "🇳🇱 NL" : "🇬🇧 EN"}</span>
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                    {t.appName}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">{t.appTagline}</p>
                </div>
              </div>
              
              <p className="text-xl text-gray-700 mb-4">
                {t.subtitle}
              </p>
              
              <p className="text-gray-600">
                {t.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                {t.features}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>✓</strong> {t.scientificBasis}
              </p>
            </div>
          </div>

          <div className="lg:pl-8">
            <Card className="shadow-2xl border-2 border-blue-100">
              <CardContent className="pt-8 pb-8 px-6 md:px-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t.welcome}
                  </h2>
                  <p className="text-gray-600">{t.forPatients}</p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg shadow-lg"
                  >
                    {t.login}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">{t.noAccount}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full py-6 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    {t.register}
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 mb-3">
                    {t.forTherapists}
                  </p>
                  <Button 
                    variant="ghost"
                    className="w-full text-gray-600 hover:bg-gray-50"
                    onClick={handleLogin}
                  >
                    {t.therapistLogin}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {t.termsAgreement}
              </p>
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                {disclaimerContent[lang].shortDisclaimer}
              </p>
            </div>
            </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t.scientificProven}
            </h3>
            <p className="text-sm text-gray-600">
              {t.scientificProvenDesc}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t.personalGuidance}
            </h3>
            <p className="text-sm text-gray-600">
              {t.personalGuidanceDesc}
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t.measurableResults}
            </h3>
            <p className="text-sm text-gray-600">
              {t.measurableResultsDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}