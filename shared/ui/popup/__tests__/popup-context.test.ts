import { PopupContext } from '@/shared/ui/popup/popup-context';

describe('PopupContext', () => {
  it('is created with null as the default value', () => {
    expect(PopupContext).toBeDefined();
    // React context exposes _currentValue for the default (pre-Provider) value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((PopupContext as any)._currentValue).toBeNull();
  });
});
