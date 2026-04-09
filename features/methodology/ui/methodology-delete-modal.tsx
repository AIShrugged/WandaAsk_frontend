import { BUTTON } from '@/shared/lib/buttons';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';

import type { MethodologyProps } from '@/features/methodology/model/types';
import type { ModalContextValue } from '@/shared/types/modal';

interface MethodologyDeleteModalProps extends ModalContextValue {
  methodology: MethodologyProps;
}

/**
 * MethodologyDeleteModal component.
 * @param root0
 * @param root0.close
 * @param root0.methodology
 */
export default function MethodologyDeleteModal({
  close,
  methodology,
}: MethodologyDeleteModalProps) {
  return (
    <>
      <ModalHeader onClick={close} title={'Delete methodology?'} />
      <ModalBody>
        <p className={'text-[20px]'}>
          Are you sure you want to delete the methodology {methodology.name}?
          This action cannot be undone.
        </p>
      </ModalBody>

      <ModalFooter>
        <div className={'flex flex-col gap-3'}>
          <Button type='submit' disabled variant={BUTTON_VARIANT.danger}>
            {BUTTON.DELETE}
          </Button>
        </div>
      </ModalFooter>
    </>
  );
}
