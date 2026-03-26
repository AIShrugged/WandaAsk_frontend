'use client';

import dynamic from 'next/dynamic';

// Dynamic import lives in a Client Component — required for ssr: false
const DemoSeedButton = dynamic(
  () => {
    return import('@/features/demo/ui/demo-seed-button').then((m) => {
      return { default: m.default };
    });
  },
  {
    ssr: false,
    loading: () => {
      return null;
    },
  },
);

/**
 * DemoSeedButtonLoader component.
 * @returns JSX element.
 */
export function DemoSeedButtonLoader() {
  return <DemoSeedButton />;
}
