import React from 'react';

import ButtonBack from '@/shared/ui/button/button-back';
import ComponentHeader from '@/shared/ui/layout/component-header';
import { H2 } from '@/shared/ui/typography/H2';

interface PageHeaderProps {
  title: string;
  hasButtonBack?: boolean;
  /** Explicit back destination. When set, the back button always navigates here. */
  href?: string;
  fallbackHref?: string;
  extraContent?: React.ReactNode;
}

export default function PageHeader({
  title,
  hasButtonBack,
  href,
  fallbackHref,
  extraContent,
}: PageHeaderProps) {
  return (
    <ComponentHeader>
      {hasButtonBack && <ButtonBack href={href} fallbackHref={fallbackHref} />}
      <H2>{title}</H2>
      <div className='ml-auto'>{extraContent}</div>
    </ComponentHeader>
  );
}
