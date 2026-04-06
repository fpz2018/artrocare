import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import {
  LayoutDashboard, TrendingUp, Dumbbell, Target, Apple, Pill,
  Stethoscope, BookOpen, Crown, Settings, Users, Menu, X,
  Globe, LogOut, ChevronRight, FlaskConical, Database, Building2, ChefHat, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FooterDisclaimer } from '@/components/legal/Disclaimer';
import Logo from '@/components/Logo';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  { path: '/progress', icon: TrendingUp, labelKey: 'nav_progress' },
  { path: '/exercises', icon: Dumbbell, labelKey: 'nav_exercises' },
  { path: '/goals', icon: Target, labelKey: 'nav_goals' },
  { path: '/nutrition', icon: Apple, labelKey: 'nav_nutrition' },
  { path: '/recipes', icon: ChefHat, labelKey: 'nav_recipes' },
  { path: '/supplements', icon: Pill, labelKey: 'nav_supplements' },
  { path: '/medication', icon: Pill, labelKey: 'nav_medication' },
  { path: '/therapist', icon: Stethoscope, labelKey: 'nav_therapist' },
  { path: '/library', icon: BookOpen, labelKey: 'nav_library' },
  { path: '/premium', icon: Crown, labelKey: 'nav_premium' },
  { path: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

const therapistNavItems = [
  { path: '/therapist-dashboard', icon: Users, labelKey: 'nav_my_patients' },
  { path: '/research', icon: FlaskConical, labelKey: 'nav_research' },
  { path: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

const practiceAdminNavItems = [
  { path: '/practice', icon: Building2, labelKey: 'nav_practice' },
  { path: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

const adminNavItems = [
  { path: '/admin/proposals', icon: Database, labelKey: 'nav_content_proposals' },
  { path: '/admin/recipe-imports', icon: ChefHat, labelKey: 'nav_recipe_imports' },
  { path: '/admin/exercises', icon: Dumbbell, labelKey: 'nav_exercises_admin' },
  { path: '/admin/practices', icon: Building2, labelKey: 'nav_practices' },
  { path: '/admin/checklist', icon: ClipboardList, labelKey: 'nav_checklist' },
  { path: '/research', icon: FlaskConical, labelKey: 'nav_research' },
  { path: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = useMemo(() => {
    if (profile?.role === 'admin') return adminNavItems;
    if (profile?.role === 'practice_admin') return practiceAdminNavItems;
    if (profile?.role === 'therapist') return therapistNavItems;
    return navItems;
  }, [profile?.role]);

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'practice';

  // Fetch pending notification count for admins
  const { data: pendingNotifications = 0 } = useQuery({
    queryKey: ['pending-notifications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pending_notifications')
        .eq('id', profile.id)
        .single();
      if (error) return 0;
      return data?.pending_notifications || 0;
    },
    enabled: profile?.role === 'admin',
    refetchInterval: 60000, // Poll every minute
  });

  const toggleLanguage = () => {
    setLanguage(language === 'nl' ? 'en' : 'nl');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Logo height={56} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === '/admin/proposals' && pendingNotifications > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.labelKey)}
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingNotifications > 9 ? '9+' : pendingNotifications}
                    </span>
                  )}
                  {isActive && !showBadge && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-40">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <Logo height={88} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === '/admin/proposals' && pendingNotifications > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {t(item.labelKey)}
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingNotifications > 9 ? '9+' : pendingNotifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Premium upsell */}
          {!isPremium && profile?.role !== 'therapist' && (
            <div className="mx-3 mb-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <Crown className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-1">{t('nav_upgrade')}</p>
              <Link to="/premium">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  {t('prem_upgrade')}
                </Button>
              </Link>
            </div>
          )}

          {/* User profile & actions */}
          <div className="border-t border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                  {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {profile?.full_name || profile?.email || 'User'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} title={language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}>
                <Globe className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="max-w-5xl mx-auto p-4 lg:p-8">
            {children}
          </div>
          <FooterDisclaimer />
        </main>
      </div>
    </div>
  );
}
