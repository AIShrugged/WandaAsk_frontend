'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { TaskTable } from '@/entities/artifact/ui/task-table';

import type { TaskTableArtifact } from '@/entities/artifact/model/types';

type Segment =
  | { type: 'text'; content: string }
  | { type: 'tasks'; tasks: TaskTableArtifact['data']['tasks'] };

function splitTaskBlocks(content: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /```json\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }
    try {
      const parsed: unknown = JSON.parse(match[1]);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0] === 'object' &&
        parsed[0] !== null &&
        'title' in parsed[0]
      ) {
        segments.push({
          type: 'tasks',
          tasks: parsed as TaskTableArtifact['data']['tasks'],
        });
        lastIndex = match.index + match[0].length;
        continue;
      }
    } catch {
      // not valid JSON — fall through to text
    }
    segments.push({ type: 'text', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return segments;
}

interface ChatMessageContentProps {
  content: string;
}

/**
 * Renders AI message content.
 *
 * - Plain text / markdown → react-markdown (handles \n, lists, bold, tables, code, etc.)
 * - Raw HTML (starts with "<") → innerHTML + script re-execution (Chart.js, canvas, etc.)
 * @param root0 - Component props.
 * @param root0.content - The raw message content string to render.
 * @returns Result.
 */
export function ChatMessageContent({ content }: ChatMessageContentProps) {
  const isHtml = content.trimStart().startsWith('<');

  if (!isHtml) {
    const segments = splitTaskBlocks(content);

    if (segments.length === 1 && segments[0].type === 'text') {
      return (
        <div className='chat-html-content'>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      );
    }

    return (
      <div className='chat-html-content flex flex-col gap-3'>
        {segments.map((seg, i) => {
          return seg.type === 'tasks' ? (
            <TaskTable key={i} data={{ tasks: seg.tasks }} />
          ) : (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
              {seg.content}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  }

  return <HtmlContent content={content} />;
}

/**
 * HtmlContent component.
 * @param props - Component props.
 * @param props.content - Raw HTML string to inject and execute.
 * @returns Result.
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
