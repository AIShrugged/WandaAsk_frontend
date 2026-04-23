'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

import type { TodayBriefing } from '../model/types';

interface TodayBriefingContextValue {
  data: TodayBriefing;
  date: string | undefined;
}

const TodayBriefingContext = createContext<TodayBriefingContextValue | null>(
  null,
);

export function TodayBriefingProvider({
  children,
  data,
  date,
}: PropsWithChildren<{ data: TodayBriefing; date: string | undefined }>) {
  return (
    <TodayBriefingContext.Provider value={{ data, date }}>
      {children}
    </TodayBriefingContext.Provider>
  );
}

export function useTodayBriefing(): TodayBriefingContextValue {
  const context = useContext(TodayBriefingContext);
  if (!context) {
    throw new Error(
      'useTodayBriefing must be used within TodayBriefingProvider',
    );
  }
  return context;
}
