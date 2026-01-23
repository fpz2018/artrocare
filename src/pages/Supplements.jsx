import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Pill,
  Leaf,
  Shield,
  Sparkles,
  TrendingUp,
  Crown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FooterDisclaimer } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    title: "Supplementen & Kruiden",
    subtitle: "Evidence-based informatie over supplementen bij artrose",
    safetyFirst: "Veiligheid Voorop",
    safetyWarning: "Supplementen kunnen interacties hebben met medicijnen. Bespreek altijd met je arts voordat je supplementen gaat gebruiken, vooral als je medicijnen gebruikt.",
    categories: "Categorieën",
    allSupplements: "Alle Supplementen",
    omega3: "Omega-3",
    vitamins: "Vitamines",
    minerals: "Mineralen",
    herbs: "Kruiden",
    collagen: "Collageen",
    other: "Overige",
    evidenceLevel: "Wetenschappelijk Bewijs",
    strongEvidence: "Sterk Bewijs",
    moderateEvidence: "Gemiddeld Bewijs",
    limitedEvidence: "Beperkt Bewijs",
    emergingEvidence: "Nieuw Onderzoek",
    dosage: "Dosering",
    timing: "Timing",
    benefits: "Voordelen",
    interactions: "Interacties",
    contraindications: "Waarschuwingen",
    morning: "Ochtend",
    afternoon: "Middag",
    evening: "Avond",
    withMeal: "Met Maaltijd",
    any: "Elk moment",
    viewDetails: "Bekijk Details",
    close: "Sluiten",
    premium: "Premium",
    safetyCheck: "Veiligheidscheck",
    safetyCheckDesc: "Voer hier je huidige medicatie in voor een interactiecheck",
    comingSoon: "Binnenkort Beschikbaar",
    recommendedFor: "Aanbevolen voor",
    yourSituation: "jouw situatie",
    generalInfo: "Algemene Informatie",
    noInteractions: "Geen bekende belangrijke interacties",
    consult: "Raadpleeg altijd je arts",
    scientificBasis: "Wetenschappelijke Basis"
  },
  en: {
    title: "Supplements & Herbs",
    subtitle: "Evidence-based information about supplements for arthritis",
    safetyFirst: "Safety First",
    safetyWarning: "Supplements can interact with medications. Always consult your doctor before starting supplements, especially if you're taking medication.",
    categories: "Categories",
    allSupplements: "All Supplements",
    omega3: "Omega-3",
    vitamins: "Vitamins",
    minerals: "Minerals",
    herbs: "Herbs",
    collagen: "Collagen",
    other: "Other",
    evidenceLevel: "Scientific Evidence",
    strongEvidence: "Strong Evidence",
    moderateEvidence: "Moderate Evidence",
    limitedEvidence: "Limited Evidence",
    emergingEvidence: "Emerging Research",
    dosage: "Dosage",
    timing: "Timing",
    benefits: "Benefits",
    interactions: "Interactions",
    contraindications: "Warnings",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    withMeal: "With Meal",
    any: "Anytime",
    viewDetails: "View Details",
    close: "Close",
    premium: "Premium",
    safetyCheck: "Safety Check",
    safetyCheckDesc: "Enter your current medication for an interaction check",
    comingSoon: "Coming Soon",
    recommendedFor: "Recommended for",
    yourSituation: "your situation",
    generalInfo: "General Information",
    noInteractions: "No known major interactions",
    consult: "Always consult your doctor",
    scientificBasis: "Scientific Basis"
  }
};

const evidenceColors = {
  strong: "bg-green-100 text-green-800 border-green-300",
  moderate: "bg-blue-100 text-blue-800 border-blue-300",
  limited: "bg-yellow-100 text-yellow-800 border-yellow-300",
  emerging: "bg-purple-100 text-purple-800 border-purple-300"
};

const categoryIcons = {
  omega3: Heart,
  vitamins: Sparkles,
  minerals: Shield,
  herbs: Leaf,
  collagen: TrendingUp,
  other: Pill
};

export default function Supplements() {
  const [selectedSupplement, setSelectedSupplement] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: supplements = [], isLoading } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list("name_nl", 50),
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];
  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "premium_practice";

  const filteredSupplements = activeCategory === "all" 
    ? supplements 
    : supplements.filter(s => s.category === activeCategory);

  const categories = [
    { id: "all", label: t.allSupplements, icon: Pill },
    { id: "omega3", label: t.omega3, icon: Heart },
    { id: "vitamins", label: t.vitamins, icon: Sparkles },
    { id: "minerals", label: t.minerals, icon: Shield },
    { id: "herbs", label: t.herbs, icon: Leaf },
    { id: "collagen", label: t.collagen, icon: TrendingUp },
    { id: "other", label: t.other, icon: Pill }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-emerald-600" />
            {t.title}
          </h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Safety Warning */}
        <Card className="mb-8 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-2">{t.safetyFirst}</h3>
                <p className="text-orange-800 mb-4">{t.safetyWarning}</p>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">{t.consult}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.categories}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50 shadow-lg"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                  <p className={`text-xs font-medium ${isActive ? "text-emerald-900" : "text-gray-600"}`}>
                    {cat.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Supplements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupplements.map(supplement => {
            const isLocked = supplement.isPremium && !isPremium;
            const CategoryIcon = categoryIcons[supplement.category] || Pill;
            
            return (
              <Card
                key={supplement.id}
                className={`shadow-lg hover:shadow-xl transition-all ${
                  isLocked ? "opacity-60" : "cursor-pointer hover:scale-102"
                }`}
                onClick={() => !isLocked && setSelectedSupplement(supplement)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>
                    {supplement.isPremium && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Crown className="w-3 h-3 mr-1" />
                        {t.premium}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    {lang === "nl" ? supplement.name_nl : supplement.name_en}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {lang === "nl" ? supplement.description_nl : supplement.description_en}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${evidenceColors[supplement.evidenceLevel]} border`}>
                        {supplement.evidenceLevel === "strong" && t.strongEvidence}
                        {supplement.evidenceLevel === "moderate" && t.moderateEvidence}
                        {supplement.evidenceLevel === "limited" && t.limitedEvidence}
                        {supplement.evidenceLevel === "emerging" && t.emergingEvidence}
                      </Badge>
                    </div>

                    {supplement.dosage && (
                      <div className="flex items-start gap-2 text-sm">
                        <Pill className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-700">{t.dosage}:</p>
                          <p className="text-gray-600">{supplement.dosage}</p>
                        </div>
                      </div>
                    )}

                    {supplement.timing && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{t[supplement.timing] || supplement.timing}</span>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLocked}
                    >
                      {t.viewDetails}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSupplements.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {lang === "nl" 
                  ? "Geen supplementen gevonden in deze categorie" 
                  : "No supplements found in this category"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Supplement Detail Dialog */}
        {selectedSupplement && (
          <SupplementDialog 
            supplement={selectedSupplement} 
            t={t} 
            lang={lang}
            onClose={() => setSelectedSupplement(null)} 
          />
        )}

        <FooterDisclaimer lang={lang} />
      </div>
    </div>
  );
}

function SupplementDialog({ supplement, t, lang, onClose }) {
  const CategoryIcon = categoryIcons[supplement.category] || Pill;
  
  return (
    <Dialog open={!!supplement} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">
                {lang === "nl" ? supplement.name_nl : supplement.name_en}
              </DialogTitle>
              <Badge className={`${evidenceColors[supplement.evidenceLevel]} border`}>
                {supplement.evidenceLevel === "strong" && t.strongEvidence}
                {supplement.evidenceLevel === "moderate" && t.moderateEvidence}
                {supplement.evidenceLevel === "limited" && t.limitedEvidence}
                {supplement.evidenceLevel === "emerging" && t.emergingEvidence}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.generalInfo}</h3>
            <p className="text-gray-700">
              {lang === "nl" ? supplement.description_nl : supplement.description_en}
            </p>
          </div>

          {/* Dosage & Timing */}
          <div className="grid md:grid-cols-2 gap-4">
            {supplement.dosage && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">{t.dosage}</h4>
                </div>
                <p className="text-gray-700">{supplement.dosage}</p>
              </div>
            )}

            {supplement.timing && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">{t.timing}</h4>
                </div>
                <p className="text-gray-700">{t[supplement.timing] || supplement.timing}</p>
              </div>
            )}
          </div>

          {/* Benefits */}
          {supplement[`benefits_${lang}`] && supplement[`benefits_${lang}`].length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {t.benefits}
              </h3>
              <ul className="space-y-2">
                {supplement[`benefits_${lang}`].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactions */}
          {supplement.interactions && supplement.interactions.length > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t.interactions}
              </h3>
              <ul className="space-y-2">
                {supplement.interactions.map((interaction, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <span>{interaction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contraindications */}
          {supplement.contraindications && supplement.contraindications.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {t.contraindications}
              </h3>
              <ul className="space-y-2">
                {supplement.contraindications.map((contra, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <XCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>{contra}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                {t.consult}
              </p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}