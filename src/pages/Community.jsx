import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';

export default function Community() {
  const { profile } = useAuth();
  const { t, language } = useI18n();

  const features = [
    { icon: Users, title: t('comm_support'), desc: t('comm_support_desc'), color: 'text-blue-600 bg-blue-100' },
    { icon: BookOpen, title: t('comm_stories'), desc: t('comm_stories_desc'), color: 'text-green-600 bg-green-100' },
    { icon: Lightbulb, title: t('comm_tips'), desc: t('comm_tips_desc'), color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <MessageSquare className="w-7 h-7 text-blue-600" />
        {t('comm_title')}
      </h1>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('comm_coming')}</h2>
          <p className="text-gray-600">{t('comm_desc')}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, desc, color }) => (
          <Card key={title} className="bg-white">
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
