'use client';

import { useEffect, useRef } from 'react';

interface ChatMessageContentProps {
  content: string;
}

/**
 * Renders HTML content from AI responses.
 * Uses innerHTML to support tables, charts (canvas + scripts), and other visuals.
 * Scripts are re-created to trigger execution (Chart.js initialization etc.).
 */
export function ChatMessageContent({ content }: ChatMessageContentProps) {
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
