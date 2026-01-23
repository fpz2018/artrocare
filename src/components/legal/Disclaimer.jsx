import React from "react";
import { AlertTriangle, UserCheck, Shield } from "lucide-react";

const disclaimerContent = {
  nl: {
    title: "Belangrijke Informatie",
    subtitle: "Lees dit zorgvuldig door voordat je de app gebruikt",
    
    fullDisclaimer: `DISCLAIMER EN GEBRUIKSVOORWAARDEN

Artrose Kompas (powered by JointWise) is een informatieve applicatie bedoeld ter ondersteuning van mensen met artrose. Door gebruik te maken van deze applicatie ga je akkoord met onderstaande voorwaarden.

GEEN MEDISCH ADVIES
De informatie, oefeningen, voedingsadviezen, supplementinformatie en andere content in deze applicatie zijn uitsluitend bedoeld voor algemene informatieve en educatieve doeleinden. Deze informatie vervangt NIET het advies van een gekwalificeerde zorgverlener, fysiotherapeut, arts of andere medische professional.

GEBRUIK OP EIGEN RISICO
Het gebruik van deze applicatie en het opvolgen van de aangeboden adviezen, oefeningen of aanbevelingen geschiedt geheel op eigen risico. De makers van deze applicatie zijn niet aansprakelijk voor enige directe of indirecte schade, letsel of andere nadelige gevolgen die kunnen voortvloeien uit het gebruik van de applicatie of de daarin aangeboden informatie.

PROFESSIONELE BEGELEIDING VEREIST
- Raadpleeg ALTIJD een fysiotherapeut of arts voordat je begint met een nieuw oefenprogramma
- Raadpleeg ALTIJD een arts of apotheker voordat je supplementen gaat gebruiken, vooral als je medicijnen gebruikt
- Stop DIRECT met oefeningen bij ongewone pijn, duizeligheid of andere klachten en raadpleeg een professional
- Bij twijfel over je gezondheid of geschiktheid voor bepaalde oefeningen: neem contact op met je fysiotherapeut

AI-GESTUURDE FUNCTIES
Bepaalde functies in deze app maken gebruik van kunstmatige intelligentie (AI), waaronder voedingsplannen en risicovoorspellingen. Deze AI-gegenereerde content:
- Is gebaseerd op algemene patronen en kan niet jouw specifieke situatie volledig beoordelen
- Vervangt geen professionele diagnose of beoordeling
- Moet altijd worden gevalideerd door een gekwalificeerde zorgverlener

GEEN GARANTIES
Hoewel wij streven naar accurate en actuele informatie gebaseerd op wetenschappelijk onderzoek, geven wij geen garanties over de volledigheid, nauwkeurigheid of geschiktheid van de informatie voor jouw specifieke situatie.

KOPPELING MET FYSIOTHERAPEUT
Wij raden sterk aan om deze app te gebruiken in samenwerking met een fysiotherapeut. De app biedt de mogelijkheid om een fysiotherapeut te koppelen en voortgang te delen. Maak hier gebruik van voor optimale begeleiding.

Door op "Ik ga akkoord" te klikken, bevestig je dat je:
- Bovenstaande voorwaarden hebt gelezen en begrepen
- Begrijpt dat deze app geen vervanging is voor professionele medische zorg
- De app op eigen risico zult gebruiken
- Bij twijfel altijd een zorgprofessional zult raadplegen`,

    shortDisclaimer: "Deze app biedt informatieve ondersteuning en vervangt geen professioneel medisch advies. Gebruik op eigen risico. Raadpleeg bij twijfel altijd een fysiotherapeut of arts.",
    
    footerDisclaimer: "Informatief hulpmiddel - geen medisch advies. Bij klachten of twijfel: raadpleeg je fysiotherapeut.",
    
    exerciseWarning: "Start geen oefeningen zonder goedkeuring van een fysiotherapeut. Stop direct bij ongewone pijn.",
    
    nutritionWarning: "Voedingsadviezen zijn algemeen van aard. Raadpleeg een diëtist of arts bij specifieke voedingsvragen of allergieën.",
    
    supplementWarning: "Raadpleeg altijd een arts of apotheker voordat je supplementen gebruikt, vooral bij medicijngebruik.",
    
    aiWarning: "Deze voorspelling is gebaseerd op AI-analyse en is geen medische diagnose. Raadpleeg een professional voor beoordeling.",
    
    medicationWarning: "Deze tracker is ter ondersteuning van je eigen administratie. Volg altijd het advies van je arts of apotheker.",
    
    agreeButton: "Ik heb gelezen en ga akkoord",
    mustAgree: "Je moet akkoord gaan met de voorwaarden om de app te gebruiken",
    viewFullTerms: "Bekijk volledige voorwaarden",
    linkTherapist: "Koppel een fysiotherapeut voor optimale begeleiding"
  },
  en: {
    title: "Important Information",
    subtitle: "Please read carefully before using the app",
    
    fullDisclaimer: `DISCLAIMER AND TERMS OF USE

JointWise (Artrose Kompas) is an informational application intended to support people with osteoarthritis. By using this application, you agree to the following terms.

NOT MEDICAL ADVICE
The information, exercises, nutritional advice, supplement information, and other content in this application are intended solely for general informational and educational purposes. This information does NOT replace the advice of a qualified healthcare provider, physiotherapist, physician, or other medical professional.

USE AT YOUR OWN RISK
The use of this application and following the offered advice, exercises, or recommendations is entirely at your own risk. The creators of this application are not liable for any direct or indirect damage, injury, or other adverse consequences that may result from using the application or the information provided therein.

PROFESSIONAL GUIDANCE REQUIRED
- ALWAYS consult a physiotherapist or physician before starting a new exercise program
- ALWAYS consult a physician or pharmacist before using supplements, especially if you take medication
- STOP exercises IMMEDIATELY if you experience unusual pain, dizziness, or other complaints and consult a professional
- When in doubt about your health or suitability for certain exercises: contact your physiotherapist

AI-POWERED FEATURES
Certain features in this app use artificial intelligence (AI), including nutrition plans and risk predictions. This AI-generated content:
- Is based on general patterns and cannot fully assess your specific situation
- Does not replace professional diagnosis or assessment
- Should always be validated by a qualified healthcare provider

NO WARRANTIES
While we strive for accurate and current information based on scientific research, we make no guarantees about the completeness, accuracy, or suitability of the information for your specific situation.

LINK WITH PHYSIOTHERAPIST
We strongly recommend using this app in collaboration with a physiotherapist. The app offers the ability to link a physiotherapist and share progress. Use this for optimal guidance.

By clicking "I agree", you confirm that you:
- Have read and understood the above terms
- Understand that this app is not a replacement for professional medical care
- Will use the app at your own risk
- Will always consult a healthcare professional when in doubt`,

    shortDisclaimer: "This app provides informational support and does not replace professional medical advice. Use at your own risk. Always consult a physiotherapist or physician when in doubt.",
    
    footerDisclaimer: "Informational tool - not medical advice. For complaints or doubt: consult your physiotherapist.",
    
    exerciseWarning: "Do not start exercises without approval from a physiotherapist. Stop immediately if you experience unusual pain.",
    
    nutritionWarning: "Nutritional advice is general in nature. Consult a dietitian or physician for specific dietary questions or allergies.",
    
    supplementWarning: "Always consult a physician or pharmacist before using supplements, especially when taking medication.",
    
    aiWarning: "This prediction is based on AI analysis and is not a medical diagnosis. Consult a professional for assessment.",
    
    medicationWarning: "This tracker supports your own administration. Always follow the advice of your physician or pharmacist.",
    
    agreeButton: "I have read and agree",
    mustAgree: "You must agree to the terms to use the app",
    viewFullTerms: "View full terms",
    linkTherapist: "Link a physiotherapist for optimal guidance"
  }
};

export function InlineDisclaimer({ type, lang = "nl" }) {
  const t = disclaimerContent[lang];
  
  const warnings = {
    exercise: { icon: AlertTriangle, text: t.exerciseWarning, color: "orange" },
    nutrition: { icon: AlertTriangle, text: t.nutritionWarning, color: "blue" },
    supplement: { icon: AlertTriangle, text: t.supplementWarning, color: "orange" },
    ai: { icon: AlertTriangle, text: t.aiWarning, color: "purple" },
    medication: { icon: AlertTriangle, text: t.medicationWarning, color: "blue" }
  };
  
  const warning = warnings[type];
  if (!warning) return null;
  
  const Icon = warning.icon;
  const colorClasses = {
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800"
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colorClasses[warning.color]} flex items-start gap-2 text-sm`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{warning.text}</span>
    </div>
  );
}

export function FooterDisclaimer({ lang = "nl" }) {
  const t = disclaimerContent[lang];
  
  return (
    <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-200 mt-8">
      <p className="flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        {t.footerDisclaimer}
      </p>
    </div>
  );
}

export function FullDisclaimer({ lang = "nl", onAgree, agreed = false }) {
  const t = disclaimerContent[lang];
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>
      
      <div 
        className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto text-sm text-gray-700 whitespace-pre-line"
        onScroll={handleScroll}
      >
        {t.fullDisclaimer}
      </div>
      
      {!hasScrolledToBottom && (
        <p className="text-xs text-gray-500 text-center">
          {lang === "nl" ? "Scroll naar beneden om verder te gaan" : "Scroll down to continue"}
        </p>
      )}
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">{t.linkTherapist}</p>
            <p className="text-sm text-blue-800">
              {lang === "nl" 
                ? "Je kunt later in de app een fysiotherapeut koppelen voor persoonlijke begeleiding en het delen van je voortgang."
                : "You can link a physiotherapist later in the app for personal guidance and sharing your progress."}
            </p>
          </div>
        </div>
      </div>
      
      {onAgree && (
        <button
          onClick={onAgree}
          disabled={!hasScrolledToBottom && !agreed}
          className={`w-full py-4 rounded-lg font-semibold transition-all ${
            hasScrolledToBottom || agreed
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.agreeButton}
        </button>
      )}
    </div>
  );
}

export { disclaimerContent };
export default FullDisclaimer;