
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Check, 
  Zap,
  Building2,
  Sparkles
} from "lucide-react";

const translations = {
  nl: {
    title: "Upgrade naar Premium",
    subtitle: "Ontgrendel alle functies voor optimaal herstel",
    currentPlan: "Huidig plan",
    free: "Gratis",
    premium: "Premium",
    premiumPractice: "Premium Praktijk",
    perMonth: "/maand",
    perYear: "/jaar",
    selectPlan: "Kies dit plan",
    yourPlan: "Je huidige plan",
    monthly: "Maandelijks",
    yearly: "Jaarlijks",
    save20: "Bespaar 20%",
    freeFeatures: [
      "Basis onboarding en assessment",
      "10 oefeningen bibliotheek",
      "3 anti-inflammatoire recepten",
      "Dagelijkse voortgang tracking",
      "Maandelijks rapport (PDF)",
      "Community tips"
    ],
    premiumFeatures: [
      "Alle gratis functies",
      "Volledige oefeningen bibliotheek (100+)",
      "Volledige recepten collectie (50+)",
      "Supplementen veiligheidscheck",
      "Geavanceerde voortgangsanalyse",
      "Persoonlijke coach chat",
      "Flare protocol & aanpassingen",
      "Alle educatie lessen",
      "Prioriteit ondersteuning"
    ],
    practiceFeatures: [
      "Alle Premium functies",
      "White-label branding",
      "5-20 patiënten",
      "Patiënten dashboard",
      "Aangepaste protocollen",
      "Data export (CSV)",
      "API toegang",
      "Praktijk analytics"
    ],
    popularChoice: "Populairste keuze",
    forPractices: "Voor praktijken",
    contactUs: "Neem contact op",
    comingSoon: "Binnenkort beschikbaar"
  },
  en: {
    title: "Upgrade to Premium",
    subtitle: "Unlock all features for optimal recovery",
    currentPlan: "Current plan",
    free: "Free",
    premium: "Premium",
    premiumPractice: "Premium Practice",
    perMonth: "/month",
    perYear: "/year",
    selectPlan: "Select this plan",
    yourPlan: "Your current plan",
    monthly: "Monthly",
    yearly: "Yearly",
    save20: "Save 20%",
    freeFeatures: [
      "Basic onboarding and assessment",
      "10 exercise library",
      "3 anti-inflammatory recipes",
      "Daily progress tracking",
      "Monthly report (PDF)",
      "Community tips"
    ],
    premiumFeatures: [
      "All free features",
      "Full exercise library (100+)",
      "Full recipe collection (50+)",
      "Supplement safety check",
      "Advanced progress analysis",
      "Personal coach chat",
      "Flare protocol & adjustments",
      "All education lessons",
      "Priority support"
    ],
    practiceFeatures: [
      "All Premium features",
      "White-label branding",
      "5-20 patients",
      "Patient dashboard",
      "Custom protocols",
      "Data export (CSV)",
      "API access",
      "Practice analytics"
    ],
    popularChoice: "Most popular",
    forPractices: "For practices",
    contactUs: "Contact us",
    comingSoon: "Coming soon"
  }
};

export default function Premium() {
  const [user, setUser] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setIsLoading(false);
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

  const currentTier = user?.subscriptionTier || "free";
  const isPremium = currentTier === "premium" || currentTier === "premium_practice";

  const plans = [
    {
      id: "free",
      name: t.free,
      price: "€0",
      period: t.perMonth,
      features: t.freeFeatures,
      icon: Zap,
      color: "from-gray-400 to-gray-500"
    },
    {
      id: "premium",
      name: t.premium,
      price: billingPeriod === "monthly" ? "€19.99" : "€15.99",
      period: billingPeriod === "monthly" ? t.perMonth : t.perMonth, // This should probably be t.perYear for yearly billing
      features: t.premiumFeatures,
      icon: Crown,
      color: "from-emerald-500 to-sky-500",
      popular: true,
      yearlyPrice: "€191.88"
    },
    {
      id: "premium_practice",
      name: t.premiumPractice,
      price: t.contactUs,
      period: "",
      features: t.practiceFeatures,
      icon: Building2,
      color: "from-purple-500 to-pink-500",
      forPractices: true
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-2xl mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-8">{t.subtitle}</p>
          
          {!isPremium && (
            <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-white shadow-md font-semibold"
                    : "text-gray-600"
                }`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
                  billingPeriod === "yearly"
                    ? "bg-white shadow-md font-semibold"
                    : "text-gray-600"
                }`}
              >
                {t.yearly}
                {billingPeriod === "yearly" && (
                  <Badge className="bg-emerald-600">{t.save20}</Badge>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = currentTier === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative shadow-xl transition-all hover:shadow-2xl ${
                  plan.popular ? "md:scale-105 border-2 border-emerald-500" : ""
                } ${isCurrentPlan ? "ring-2 ring-emerald-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-emerald-600 px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t.popularChoice}
                    </Badge>
                  </div>
                )}
                {plan.forPractices && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-purple-600 px-4 py-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {t.forPractices}
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-sky-600 px-4 py-1">
                      <Check className="w-3 h-3 mr-1" />
                      {t.currentPlan}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <PlanIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price}
                    {plan.period && <span className="text-lg text-gray-600">{plan.period}</span>}
                  </div>
                  {billingPeriod === "yearly" && plan.yearlyPrice && (
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.yearlyPrice} {lang === "nl" ? "per jaar" : "per year"}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-6 text-lg ${
                      plan.id === "free"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : plan.id === "premium"
                        ? "bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    }`}
                    disabled={isCurrentPlan || plan.id === "free"}
                  >
                    {isCurrentPlan ? t.yourPlan : plan.id === "premium_practice" ? t.contactUs : t.selectPlan}
                  </Button>

                  {plan.id === "premium" && (
                    <p className="text-xs text-center text-gray-500">
                      {t.comingSoon} - Stripe integratie
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-2">
            {lang === "nl" 
              ? "Vragen over Premium? Neem contact met ons op via support@artrosekompas.nl"
              : "Questions about Premium? Contact us at support@jointwiseapp.com"}
          </p>
          <p className="text-sm text-gray-500">
            {lang === "nl"
              ? "Alle prijzen zijn inclusief BTW. Je kunt op elk moment opzeggen."
              : "All prices include VAT. You can cancel anytime."}
          </p>
        </div>
      </div>
    </div>
  );
}
