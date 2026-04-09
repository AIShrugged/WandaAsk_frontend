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
}: {
  title: string;
  hasButtonBack?: boolean;
}) {
  return (
    <ComponentHeader>
      {hasButtonBack && <ButtonBack />}
      <H2>{title}</H2>
    </ComponentHeader>
  );
}
