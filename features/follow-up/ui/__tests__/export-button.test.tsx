import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { ExportButton } from '@/features/follow-up/ui/export-button';

describe('ExportButton', () => {
  it('renders the export button', () => {
    render(<ExportButton followUpId={5} />);

    expect(
      screen.getByRole('button', { name: /export follow-up/i }),
    ).toBeInTheDocument();
  });

  it('dropdown is not visible initially', () => {
    render(<ExportButton followUpId={5} />);

    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
    expect(screen.queryByText('Excel')).not.toBeInTheDocument();
    expect(screen.queryByText('HTML')).not.toBeInTheDocument();
  });

  it('opens dropdown on button click', () => {
    render(<ExportButton followUpId={5} />);

    fireEvent.click(screen.getByRole('button', { name: /export follow-up/i }));

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('renders correct download links for each format', () => {
    render(<ExportButton followUpId={12} />);

    fireEvent.click(screen.getByRole('button', { name: /export follow-up/i }));

    const pdfLink = screen.getByText('PDF').closest('a');

    const excelLink = screen.getByText('Excel').closest('a');

    const htmlLink = screen.getByText('HTML').closest('a');

    expect(pdfLink).toHaveAttribute(
      'href',
      '/api/follow-ups/12/export?format=pdf',
    );
    expect(excelLink).toHaveAttribute(
      'href',
      '/api/follow-ups/12/export?format=excel',
    );
    expect(htmlLink).toHaveAttribute(
      'href',
      '/api/follow-ups/12/export?format=html',
    );
  });

  it('download links have the download attribute', () => {
    render(<ExportButton followUpId={5} />);

    fireEvent.click(screen.getByRole('button', { name: /export follow-up/i }));

    const pdfLink = screen.getByText('PDF').closest('a');

    expect(pdfLink).toHaveAttribute('download');
  });

  it('closes dropdown after clicking a format link', () => {
    render(<ExportButton followUpId={5} />);

    fireEvent.click(screen.getByRole('button', { name: /export follow-up/i }));
    expect(screen.getByText('PDF')).toBeInTheDocument();

    fireEvent.click(screen.getByText('PDF'));

    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('toggles dropdown closed on second button click', () => {
    render(<ExportButton followUpId={5} />);

    const button = screen.getByRole('button', { name: /export follow-up/i });

    fireEvent.click(button);
    expect(screen.getByText('PDF')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('button has aria-expanded=false when closed', () => {
    render(<ExportButton followUpId={5} />);

    expect(
      screen.getByRole('button', { name: /export follow-up/i }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('button has aria-expanded=true when open', () => {
    render(<ExportButton followUpId={5} />);

    fireEvent.click(screen.getByRole('button', { name: /export follow-up/i }));

    expect(
      screen.getByRole('button', { name: /export follow-up/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  });
});
