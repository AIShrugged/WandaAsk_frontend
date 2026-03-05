import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

import Hover from '@/shared/ui/animation/Hover';

import Input, { type Props as InputProps } from './Input';

type Props = Omit<InputProps, 'type'>;

/**
 * PasswordInput component.
 * @param props - props.
 */
export default function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);

  const shouldShowToggle = props.value?.length >= 1;

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        shouldShowToggle && (
          <Hover>
            <button
              type='button'
              onClick={() => {
                return setVisible((prevState) => {
                  return !prevState;
                });
              }}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className='cursor-pointer text-primary'
            >
              {visible ? (
                <EyeOff aria-hidden='true' />
              ) : (
                <Eye aria-hidden='true' />
              )}
            </button>
          </Hover>
        )
      }
    />
  );
}
