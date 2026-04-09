import { ModalContext } from '@/shared/ui/modal/modal-context';

describe('ModalContext', () => {
  it('is created with null as the default value', () => {
    expect(ModalContext).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ModalContext as any)._currentValue).toBeNull();
  });
});
