'use client';

import { Bot, BotOff } from 'lucide-react';

import type { BotPillIndicator } from '../model/bot-pill-indicator';

interface BotPillIconProps {
  indicator: BotPillIndicator;
  size?: number;
}

export function BotPillIcon({ indicator, size = 12 }: BotPillIconProps) {
  const Icon = indicator.icon === 'bot' ? Bot : BotOff;

  return (
    <span
      className={`flex-shrink-0 ${indicator.colorClass}`}
      aria-label={indicator.label}
      title={indicator.label}
    >
      <Icon size={size} />
    </span>
  );
}
