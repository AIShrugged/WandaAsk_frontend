import React from 'react';

import ButtonBack from '@/shared/ui/button/button-back';
import ComponentHeader from '@/shared/ui/layout/component-header';
import { H2 } from '@/shared/ui/typography/H2';

/**
 * PageHeader component.
 * @param root0
 * @param root0.title
 * @param root0.hasButtonBack
 */
export default function PageHeader({
  title,
  hasButtonBack,
  extraContent,
}: {
  title: string;
  hasButtonBack?: boolean;
  extraContent?: React.ReactNode;
}) {
  return (
    <ComponentHeader>
      {hasButtonBack && <ButtonBack />}
      <H2>{title}</H2>
      <div className='ml-auto'>{extraContent}</div>
    </ComponentHeader>
  );
}
