import {
  AUTH_TITLE_VARIANT,
  type AuthTitleVariant,
} from '@/features/auth/lib/options';
import { H1 } from '@/shared/ui/typography/H1';

/**
 * AuthTitle component.
 * @param props - Component props.
 * @param props.type
 */
export default function AuthTitle({ type }: { type: AuthTitleVariant }) {
  const titleVariant = {
    [AUTH_TITLE_VARIANT.SIGN_IN]: 'Sign In',
    [AUTH_TITLE_VARIANT.REGISTER]: 'Register',
    [AUTH_TITLE_VARIANT.ORGANIZATION]: 'Organization',
  };

  return (
    <div className={'flex justify-center mb-8 md:mb-[70px]'}>
      <H1>{titleVariant[type]}</H1>
    </div>
  );
}
