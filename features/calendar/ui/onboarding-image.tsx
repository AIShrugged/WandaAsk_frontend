import Image from 'next/image';

import { onboardingImageOptions } from '@/features/calendar/lib/options';

export default function OnboardingImage() {
  return (
    <div className={'flex flex-row gap-[22px] items-center'}>
      <Image {...onboardingImageOptions} />
      <p className={'text-[#818F85] text-[24px]'}>Sign In</p>
    </div>
  );
}
