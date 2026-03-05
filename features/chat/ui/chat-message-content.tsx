'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageContentProps {
  content: string;
}

/**
 * Renders AI message content.
 *
 * - Plain text / markdown → react-markdown (handles \n, lists, bold, tables, code, etc.)
 * - Raw HTML (starts with "<") → innerHTML + script re-execution (Chart.js, canvas, etc.)
 * @param root0
 * @param root0.content
 */
export function ChatMessageContent({ content }: ChatMessageContentProps) {
  const isHtml = content.trimStart().startsWith('<');

  if (!isHtml) {
    return (
      <div className='chat-html-content'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return <HtmlContent content={content} />;
}

/**
 * HtmlContent component.
 * @param props - Component props.
 * @param props.content
 */
function HtmlContent({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = content;

    // Re-execute script tags: innerHTML-injected scripts don't execute automatically
    const scripts = ref.current.querySelectorAll('script');

    for (const oldScript of scripts) {
      const newScript = document.createElement('script');

      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }
  }, [content]);

  return <div ref={ref} className='chat-html-content' />;
}
