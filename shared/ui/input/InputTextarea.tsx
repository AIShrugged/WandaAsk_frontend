import React from 'react';

import Textarea from '@/shared/ui/input/textarea';

import { type Props as InputProps } from './Input';

type Props = Omit<InputProps, 'type'>;

/**
 * InputTextarea component.
 * @param props - props.
 */
export default function InputTextarea(props: Props) {
  // @ts-ignore
  return <Textarea {...props} />;
}
