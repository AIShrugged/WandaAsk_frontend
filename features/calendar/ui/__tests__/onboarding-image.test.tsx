/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import React from 'react';

// next/image is auto-transformed by next/jest, but stub it explicitly for clarity
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({
      alt,
      src,
      width,
      height,
    }: {
      alt: string;
      src: string;
      width: number;
      height: number;
      // eslint-disable-next-line @next/next/no-img-element
    }) => {
      return <img alt={alt} src={src} width={width} height={height} />;
    },
  };
});

import OnboardingImage from '@/features/calendar/ui/onboarding-image';

describe('OnboardingImage', () => {
  it('renders the "Sign In" text', () => {
    render(<OnboardingImage />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders the Google icon image with correct alt', () => {
    render(<OnboardingImage />);
    expect(screen.getByAltText('Google Icon')).toBeInTheDocument();
  });

  it('renders the image with correct src', () => {
    render(<OnboardingImage />);
    expect(screen.getByAltText('Google Icon')).toHaveAttribute(
      'src',
      '/images/icons/icon_google.png',
    );
  });
});
