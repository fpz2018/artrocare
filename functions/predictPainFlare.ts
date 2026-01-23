export default async function predictPainFlare(params, context) {
  const { base44, entities } = context;
  const user = context.user;

  // Haal measurements op (laatste 90 dagen)
  const measurements = await entities.Measurement.filter(
    { created_by: user.email },
    "-date",
    90
  );

  // Analyseer patronen
  function analyzePatterns(measurements) {
    if (measurements.length < 7) {
      return {
        prediction: "insufficient_data",
        confidence: 0,
        riskScore: 0,
        riskFactors: [],
        recommendations: []
      };
    }

    const recent7Days = measurements.slice(0, 7);
    const previous7Days = measurements.slice(7, 14);

    // Bereken trends
    const recentAvgPain = recent7Days.reduce((s, m) => s + (m.painScore || 0), 0) / recent7Days.length;
    const previousAvgPain = previous7Days.length > 0
      ? previous7Days.reduce((s, m) => s + (m.painScore || 0), 0) / previous7Days.length
      : recentAvgPain;

    const recentAvgSleep = recent7Days.reduce((s, m) => s + (m.sleepQuality || 5), 0) / recent7Days.length;
    const recentAvgStress = recent7Days.reduce((s, m) => s + (m.stressLevel || 5), 0) / recent7Days.length;

    // Identificeer risicofactoren
    const riskFactors = [];
    let riskScore = 0;

    // Factor 1: Stijgende pijntrend
    if (recentAvgPain > previousAvgPain + 1) {
      riskFactors.push({
        factor: "rising_pain",
        severity: "high",
        description_nl: "Je pijn is de afgelopen week gestegen",
        description_en: "Your pain has increased over the past week"
      });
      riskScore += 30;
    }

    // Factor 2: Slechte slaap
    if (recentAvgSleep < 5) {
      riskFactors.push({
        factor: "poor_sleep",
        severity: "medium",
        description_nl: "Je slaapkwaliteit is onder gemiddeld",
        description_en: "Your sleep quality is below average"
      });
      riskScore += 20;
    }

    // Factor 3: Hoge stress
    if (recentAvgStress > 6) {
      riskFactors.push({
        factor: "high_stress",
        severity: "medium",
        description_nl: "Je stressniveau is verhoogd",
        description_en: "Your stress level is elevated"
      });
      riskScore += 20;
    }

    // Factor 4: Weinig beweging (geen oefeningen gelogd)
    const exerciseDays = recent7Days.filter(m => m.exercisesCompleted?.length > 0).length;
    if (exerciseDays < 3) {
      riskFactors.push({
        factor: "low_activity",
        severity: "medium",
        description_nl: "Je hebt minder dan 3 dagen geoefend",
        description_en: "You exercised less than 3 days"
      });
      riskScore += 15;
    }

    // Factor 5: Bekende triggers gedetecteerd
    const allTriggers = recent7Days.flatMap(m => m.triggers || []);
    if (allTriggers.length > 3) {
      riskFactors.push({
        factor: "multiple_triggers",
        severity: "medium",
        description_nl: `${allTriggers.length} triggers gedetecteerd deze week`,
        description_en: `${allTriggers.length} triggers detected this week`
      });
      riskScore += 15;
    }

    // Factor 6: Volatiliteit (grote schommelingen)
    const painScores = recent7Days.map(m => m.painScore || 0);
    const maxPain = Math.max(...painScores);
    const minPain = Math.min(...painScores);
    if (maxPain - minPain > 4) {
      riskFactors.push({
        factor: "high_volatility",
        severity: "low",
        description_nl: "Grote schommelingen in pijnniveau",
        description_en: "Large fluctuations in pain level"
      });
      riskScore += 10;
    }

    // Bepaal voorspelling
    let prediction = "low";
    let confidence = 0.6;

    if (riskScore >= 60) {
      prediction = "high";
      confidence = 0.8;
    } else if (riskScore >= 35) {
      prediction = "moderate";
      confidence = 0.7;
    }

    // Genereer aanbevelingen
    const recommendations = [];

    if (riskFactors.some(f => f.factor === "poor_sleep")) {
      recommendations.push({
        type: "sleep",
        priority: "high",
        description_nl: "Focus op slaaphygiëne: vast slaapritme, geen schermen voor bedtijd",
        description_en: "Focus on sleep hygiene: consistent sleep schedule, no screens before bed"
      });
    }

    if (riskFactors.some(f => f.factor === "high_stress")) {
      recommendations.push({
        type: "stress",
        priority: "high",
        description_nl: "Probeer ademhalingsoefeningen of meditatie",
        description_en: "Try breathing exercises or meditation"
      });
    }

    if (riskFactors.some(f => f.factor === "low_activity")) {
      recommendations.push({
        type: "exercise",
        priority: "medium",
        description_nl: "Probeer minimaal 3x per week je oefeningen te doen",
        description_en: "Try to do your exercises at least 3 times per week"
      });
    }

    if (prediction === "high" || prediction === "moderate") {
      recommendations.push({
        type: "prevention",
        priority: "high",
        description_nl: "Overweeg preventief je intensiteit te verlagen de komende dagen",
        description_en: "Consider preventively reducing your intensity in the coming days"
      });
    }

    return {
      prediction,
      riskScore,
      confidence,
      riskFactors,
      recommendations,
      stats: {
        recentAvgPain: recentAvgPain.toFixed(1),
        previousAvgPain: previousAvgPain.toFixed(1),
        recentAvgSleep: recentAvgSleep.toFixed(1),
        recentAvgStress: recentAvgStress.toFixed(1),
        exerciseDays
      }
    };
  }

  const result = analyzePatterns(measurements);

  // Sla voorspelling op voor tracking
  await entities.User.update(user.id, {
    lastPrediction: {
      ...result,
      generatedAt: new Date().toISOString()
    }
  });

  return result;
}