'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { TourOverlay } from './TourOverlay';

/** Stable noop unsubscribe returned by noopSubscribe. */
const noopUnsubscribe = () => {};

/**
 * Stable subscribe for useSyncExternalStore — no external store to listen to.
 * @returns Unsubscribe noop.
 */
const noopSubscribe = () => {
  return noopUnsubscribe;
};

/**
 * TourPortal component.
 * Renders TourOverlay into document.body via a portal.
 * Server snapshot = false → no portal during SSR.
 * Client snapshot = true → portal mounted after hydration.
 * @returns React portal mounted to document.body, or null on the server.
 */
export function TourPortal() {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => {
      return true;
    },
    () => {
      return false;
    },
  );

  if (!mounted) return null;

  return createPortal(<TourOverlay />, document.body);
}
