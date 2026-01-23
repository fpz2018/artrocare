export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export function scheduleNotification(title, body, delay = 0) {
  if (Notification.permission !== "granted") return;
  
  setTimeout(() => {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "artrose-kompas"
    });
  }, delay);
}

export function getNotificationTranslations(lang) {
  return {
    nl: {
      checkInTitle: "Tijd voor je dagelijkse check-in",
      checkInBody: "Hoe voel je je vandaag? Log je voortgang.",
      exerciseTitle: "Tijd voor je oefeningen",
      exerciseBody: "Je lichaam zal je dankbaar zijn!",
      medicationTitle: "Medicatie herinnering",
      medicationBody: "Vergeet je medicatie niet in te nemen."
    },
    en: {
      checkInTitle: "Time for your daily check-in",
      checkInBody: "How are you feeling today? Log your progress.",
      exerciseTitle: "Time for your exercises",
      exerciseBody: "Your body will thank you!",
      medicationTitle: "Medication reminder",
      medicationBody: "Don't forget to take your medication."
    }
  }[lang];
}