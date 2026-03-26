import { render, screen } from '@testing-library/react';

import { ChatMessageContent } from '@/features/chat/ui/chat-message-content';

jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => {
      return <div data-testid='markdown'>{children}</div>;
    },
  };
});

jest.mock('remark-gfm', () => {
  return { __esModule: true, default: () => {} };
});

describe('ChatMessageContent', () => {
  it('renders markdown for plain text', () => {
    render(<ChatMessageContent content='Hello **world**' />);
    expect(screen.getByTestId('markdown')).toBeInTheDocument();
  });

  it('passes content to ReactMarkdown for plain text', () => {
    render(<ChatMessageContent content='Some text' />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('Some text');
  });

  it('renders a div container for HTML content', () => {
    const { container } = render(
      <ChatMessageContent content='<p>HTML content</p>' />,
    );

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('does not render markdown for HTML content', () => {
    render(<ChatMessageContent content='<p>HTML content</p>' />);
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
  });

  it('handles multiline plain text', () => {
    render(<ChatMessageContent content={'Line 1\nLine 2'} />);
    expect(screen.getByTestId('markdown')).toBeInTheDocument();
  });

  it('sets innerHTML of the container for HTML content', () => {
    const { container } = render(
      <ChatMessageContent content='<p id="injected">Hello HTML</p>' />,
    );

    // The HtmlContent effect runs via useEffect which fires synchronously in RTL
    expect(container.querySelector('#injected')).toBeInTheDocument();
  });

  it('re-executes script tags inside HTML content', () => {
    const executed: string[] = [];
    // Capture document.createElement calls to detect script creation
    const originalCreate = document.createElement.bind(document);
    const createSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = originalCreate(tag);

        if (tag === 'script') executed.push(tag);

        return el;
      });

    render(
      <ChatMessageContent content='<script>var x=1;</script><p>text</p>' />,
    );

    expect(executed).toContain('script');
    createSpy.mockRestore();
  });
});
