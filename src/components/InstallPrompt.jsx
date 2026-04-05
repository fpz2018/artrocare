import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'artrocare-install-dismissed';

export default function InstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or not on mobile
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom">
      <div className="mx-auto max-w-md bg-white border border-blue-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
        <Download className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{t('pwa_install_title')}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('pwa_install_desc')}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
              {t('pwa_install_btn')}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              {t('pwa_install_dismiss')}
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
