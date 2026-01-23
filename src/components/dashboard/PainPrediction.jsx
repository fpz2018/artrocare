import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Shield,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Moon,
  Zap,
  Dumbbell,
  Activity
} from "lucide-react";
import { InlineDisclaimer } from "@/components/legal/Disclaimer";

const translations = {
  nl: {
    title: "Flare Voorspelling",
    poweredBy: "AI-gestuurde analyse",
    lowRisk: "Laag Risico",
    moderateRisk: "Gemiddeld Risico",
    highRisk: "Hoog Risico",
    insufficientData: "Onvoldoende Data",
    insufficientDataDesc: "Log minimaal 7 dagen om voorspellingen te krijgen",
    confidence: "Betrouwbaarheid",
    riskFactors: "Risicofactoren",
    recommendations: "Aanbevelingen",
    refresh: "Vernieuwen",
    showMore: "Toon meer",
    showLess: "Toon minder",
    basedOn: "Gebaseerd op je laatste 90 dagen data",
    noRiskFactors: "Geen significante risicofactoren gedetecteerd",
    keepItUp: "Ga zo door!"
  },
  en: {
    title: "Flare Prediction",
    poweredBy: "AI-powered analysis",
    lowRisk: "Low Risk",
    moderateRisk: "Moderate Risk",
    highRisk: "High Risk",
    insufficientData: "Insufficient Data",
    insufficientDataDesc: "Log at least 7 days to get predictions",
    confidence: "Confidence",
    riskFactors: "Risk Factors",
    recommendations: "Recommendations",
    refresh: "Refresh",
    showMore: "Show more",
    showLess: "Show less",
    basedOn: "Based on your last 90 days of data",
    noRiskFactors: "No significant risk factors detected",
    keepItUp: "Keep it up!"
  }
};

const riskColors = {
  low: "bg-green-500",
  moderate: "bg-yellow-500",
  high: "bg-red-500",
  insufficient_data: "bg-gray-400"
};

const riskBgColors = {
  low: "from-green-50 to-emerald-50 border-green-200",
  moderate: "from-yellow-50 to-orange-50 border-yellow-200",
  high: "from-red-50 to-pink-50 border-red-200",
  insufficient_data: "from-gray-50 to-slate-50 border-gray-200"
};

const factorIcons = {
  rising_pain: TrendingUp,
  poor_sleep: Moon,
  high_stress: Zap,
  low_activity: Dumbbell,
  multiple_triggers: AlertTriangle,
  high_volatility: Activity
};

export default function PainPrediction({ user }) {
  const [expanded, setExpanded] = useState(false);
  const lang = user?.language || "nl";
  const t = translations[lang];

  const { data: prediction, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['painPrediction', user?.email],
    queryFn: () => base44.functions.predictPainFlare({}),
    enabled: !!user,
    staleTime: 1000 * 60 * 60
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const riskLevel = prediction.prediction;
  const riskScore = prediction.riskScore || 0;

  return (
    <Card className={`shadow-lg border-2 bg-gradient-to-br ${riskBgColors[riskLevel]}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            {t.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {t.poweredBy}
        </p>
      </CardHeader>

      <CardContent>
        {riskLevel === "insufficient_data" ? (
          <div className="text-center py-4">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="font-semibold text-gray-700">{t.insufficientData}</p>
            <p className="text-sm text-gray-500">{t.insufficientDataDesc}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full ${riskColors[riskLevel]} flex items-center justify-center`}>
                {riskLevel === "low" && <Shield className="w-8 h-8 text-white" />}
                {riskLevel === "moderate" && <AlertTriangle className="w-8 h-8 text-white" />}
                {riskLevel === "high" && <AlertTriangle className="w-8 h-8 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-gray-900">
                  {riskLevel === "low" && t.lowRisk}
                  {riskLevel === "moderate" && t.moderateRisk}
                  {riskLevel === "high" && t.highRisk}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{t.confidence}:</span>
                  <Progress value={prediction.confidence * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{Math.round(prediction.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Laag</span>
                <span>Hoog</span>
              </div>
              <div className="h-3 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-full relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow"
                  style={{ left: `${Math.min(riskScore, 100)}%`, marginLeft: '-8px' }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between"
            >
              {expanded ? t.showLess : t.showMore}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t.riskFactors}</h4>
                  {prediction.riskFactors?.length > 0 ? (
                    <div className="space-y-2">
                      {prediction.riskFactors.map((factor, idx) => {
                        const Icon = factorIcons[factor.factor] || AlertTriangle;
                        return (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 rounded-lg">
                            <Icon className={`w-4 h-4 mt-0.5 ${
                              factor.severity === "high" ? "text-red-500" :
                              factor.severity === "medium" ? "text-yellow-600" : "text-blue-500"
                            }`} />
                            <span className="text-sm text-gray-700">
                              {lang === "nl" ? factor.description_nl : factor.description_en}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      {t.noRiskFactors} {t.keepItUp}
                    </p>
                  )}
                </div>

                {prediction.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t.recommendations}</h4>
                    <div className="space-y-2">
                      {prediction.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span className="text-sm text-blue-900">
                            {lang === "nl" ? rec.description_nl : rec.description_en}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">{t.basedOn}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <InlineDisclaimer type="ai" lang={lang} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}