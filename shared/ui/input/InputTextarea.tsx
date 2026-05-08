import { type ComponentPropsWithoutRef } from 'react';

import Textarea from '@/shared/ui/input/textarea';

type Props = ComponentPropsWithoutRef<typeof Textarea>;

export default function InputTextarea(props: Props) {
  return <Textarea {...props} />;
}
