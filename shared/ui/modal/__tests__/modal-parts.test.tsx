/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';

jest.mock('@/shared/ui/animation/Hover', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

describe('ModalHeader', () => {
  it('renders the title', () => {
    render(<ModalHeader title='Confirm Action' onClick={jest.fn()} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('calls onClick when close button clicked', () => {
    const onClick = jest.fn();

    render(<ModalHeader title='Title' onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders close icon button', () => {
    render(<ModalHeader title='Title' onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('ModalBody', () => {
  it('renders children', () => {
    render(
      <ModalBody>
        <p>Body content</p>
      </ModalBody>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('returns null when no children', () => {
    const { container } = render(<ModalBody>{null}</ModalBody>);

    expect(container.firstChild).toBeNull();
  });
});

describe('ModalFooter', () => {
  it('renders children', () => {
    render(
      <ModalFooter>
        <button>Save</button>
      </ModalFooter>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('returns null when no children', () => {
    const { container } = render(<ModalFooter>{null}</ModalFooter>);

    expect(container.firstChild).toBeNull();
  });
});
