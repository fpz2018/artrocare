import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { AlertTriangle, Info, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

export function InlineDisclaimer({ type = 'general' }) {
  const { t } = useI18n();

  const messages = {
    general: t('disclaimer_short'),
    exercise: t('disclaimer_exercise'),
    nutrition: t('disclaimer_nutrition'),
    supplements: t('disclaimer_supplements'),
    ai: t('disclaimer_ai'),
    medication: t('disclaimer_medication'),
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p>{messages[type] || messages.general}</p>
    </div>
  );
}

export function FooterDisclaimer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-4 py-4 mt-8">
      <div className="max-w-5xl mx-auto flex items-start gap-2 text-xs text-gray-500">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t('disclaimer_footer')}</p>
      </div>
    </footer>
  );
}

export function FullDisclaimer({ open, onOpenChange, onAgree }) {
  const { t } = useI18n();
  const [canAgree, setCanAgree] = useState(false);
  const scrollRef = useRef(null);

  // Controleer bij render of scrollen überhaupt nodig is
  useEffect(() => {
    if (!open) return;
    // Kleine timeout zodat de dialog DOM klaar is
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 10) {
        setCanAgree(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      if (isNearBottom) setCanAgree(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t('disclaimer_title')}
          </DialogTitle>
          <DialogDescription>{t('disclaimer_subtitle')}</DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[50vh] overflow-y-auto pr-2 text-sm text-gray-700 space-y-4"
        >
          <p>{t('disclaimer_text')}</p>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Specifieke waarschuwingen:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t('disclaimer_exercise')}</li>
              <li>{t('disclaimer_nutrition')}</li>
              <li>{t('disclaimer_supplements')}</li>
              <li>{t('disclaimer_ai')}</li>
              <li>{t('disclaimer_medication')}</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={onAgree}
          disabled={!canAgree}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {t('disclaimer_agree')}
        </Button>
        {!canAgree && (
          <p className="text-xs text-center text-gray-500">
            Scroll naar beneden om akkoord te gaan
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FullDisclaimer;
