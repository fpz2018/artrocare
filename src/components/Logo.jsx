import React from 'react';
import { useI18n } from '@/i18n';

export default function Logo({ className = '', height = 40 }) {
  const { language } = useI18n();
  const src = language === 'en'
    ? '/images/artrocare-logo-en.svg'
    : '/images/artrocare-logo-nl.svg';

  return (
    <img
      src={src}
      alt="ArtroCare"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={className}
    />
  );
}
