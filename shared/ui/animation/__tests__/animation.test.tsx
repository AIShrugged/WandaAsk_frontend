/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('motion/react-client', () => {
  return {
    div: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      whileHover: _w,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      whileHover?: unknown;
    }) => {
      return <div {...rest}>{children}</div>;
    },
  };
});

import Border from '@/shared/ui/animation/Border';
import Opacity from '@/shared/ui/animation/Opacity';

describe('Border', () => {
  it('renders children', () => {
    render(
      <Border>
        <span>Border content</span>
      </Border>,
    );
    expect(screen.getByText('Border content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Border>
        <p>First</p>
        <p>Second</p>
      </Border>,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

describe('Opacity', () => {
  it('renders children', () => {
    render(
      <Opacity>
        <span>Opacity content</span>
      </Opacity>,
    );
    expect(screen.getByText('Opacity content')).toBeInTheDocument();
  });

  it('renders nested children', () => {
    render(
      <Opacity>
        <div>
          <button>Click me</button>
        </div>
      </Opacity>,
    );
    expect(
      screen.getByRole('button', { name: 'Click me' }),
    ).toBeInTheDocument();
  });
});
