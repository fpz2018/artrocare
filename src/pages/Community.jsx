import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  MessageCircle,
  Heart,
  Award,
  Sparkles
} from "lucide-react";

const translations = {
  nl: {
    title: "Community",
    subtitle: "Verbind met anderen en deel je ervaringen",
    shareStory: "Deel je verhaal",
    post: "Plaatsen",
    cancel: "Annuleren",
    writePost: "Schrijf een bericht...",
    likes: "likes",
    replies: "reacties",
    reply: "Reageren",
    noPost: "Nog geen berichten",
    beFirst: "Wees de eerste om iets te delen",
    supportGroup: "Ondersteuningsgroep",
    successStories: "Succesverhalen",
    tips: "Tips & Tricks",
    questions: "Vragen",
    inspirational: "Inspirerend",
    member: "Lid",
    newMember: "Nieuw Lid",
    activeMember: "Actief Lid",
    superMember: "Super Lid",
    comingSoon: "Binnenkort beschikbaar",
    comingSoonText: "De community wordt binnenkort gelanceerd! Hier kun je straks ervaringen delen, tips uitwisselen en steun vinden bij lotgenoten."
  },
  en: {
    title: "Community",
    subtitle: "Connect with others and share your experiences",
    shareStory: "Share your story",
    post: "Post",
    cancel: "Cancel",
    writePost: "Write a message...",
    likes: "likes",
    replies: "replies",
    reply: "Reply",
    noPost: "No posts yet",
    beFirst: "Be the first to share something",
    supportGroup: "Support Group",
    successStories: "Success Stories",
    tips: "Tips & Tricks",
    questions: "Questions",
    inspirational: "Inspirational",
    member: "Member",
    newMember: "New Member",
    activeMember: "Active Member",
    superMember: "Super Member",
    comingSoon: "Coming Soon",
    comingSoonText: "The community will be launched soon! Here you can share experiences, exchange tips and find support from others."
  }
};

export default function Community() {
  const [user, setUser] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  // Voor nu tonen we een "coming soon" bericht
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-xl">
          <CardContent>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              {t.comingSoon}
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              {t.comingSoonText}
            </p>
            
            {/* Preview Features */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <MessageCircle className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{t.supportGroup}</h3>
                <p className="text-sm text-gray-600">
                  {lang === "nl" ? "Deel ervaringen en vind steun" : "Share experiences and find support"}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <Award className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{t.successStories}</h3>
                <p className="text-sm text-gray-600">
                  {lang === "nl" ? "Laat je inspireren door anderen" : "Get inspired by others"}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <Heart className="w-10 h-10 text-pink-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{t.tips}</h3>
                <p className="text-sm text-gray-600">
                  {lang === "nl" ? "Deel praktische tips en tricks" : "Share practical tips and tricks"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}