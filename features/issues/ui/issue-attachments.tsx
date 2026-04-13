'use client';

import { ExternalLink, Paperclip, Trash2, Upload } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ChatMessageContent } from '@/features/chat/ui/chat-message-content';
import {
  deleteAttachment,
  getIssueAttachments,
  uploadIssueAttachment,
} from '@/features/issues/api/issues';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';

import type { IssueAttachment } from '@/features/issues/model/types';
import type { ReactNode } from 'react';

interface IssueAttachmentsProps {
  issueId: number;
  initialAttachments: IssueAttachment[];
}

/**
 * attachmentLabel.
 * @param attachment - attachment.
 * @returns label text.
 */
function attachmentLabel(attachment: IssueAttachment) {
  return (
    attachment.original_name ??
    attachment.file_name ??
    attachment.name ??
    (attachment.file_path ? attachment.file_path.split('/').pop() : null) ??
    `Attachment #${attachment.id}`
  );
}

/**
 * attachmentUrl.
 * @param attachment - attachment.
 * @returns normalized url.
 */
function attachmentUrl(attachment: IssueAttachment) {
  return attachment.url ?? null;
}

/**
 * attachmentExtension — returns the lowercase file extension including the dot.
 * @param attachment - attachment.
 */
function attachmentExtension(attachment: IssueAttachment) {
  const label = attachmentLabel(attachment).toLowerCase();
  const dotIndex = label.lastIndexOf('.');

  if (dotIndex === -1) return '';

  return label.slice(dotIndex);
}

type AttachmentPreviewKind =
  | 'image'
  | 'pdf'
  | 'markdown'
  | 'text'
  | 'audio'
  | 'video'
  | 'none';

/**
 * getAttachmentPreviewKind — maps file extension to a preview kind.
 * @param attachment - attachment.
 */
function getAttachmentPreviewKind(
  attachment: IssueAttachment,
): AttachmentPreviewKind {
  const ext = attachmentExtension(attachment);

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
    return 'image';
  }

  if (ext === '.pdf') return 'pdf';

  if (ext === '.md' || ext === '.markdown') return 'markdown';

  if (
    [
      '.txt',
      '.json',
      '.csv',
      '.tsv',
      '.yml',
      '.yaml',
      '.xml',
      '.html',
      '.css',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.sql',
      '.sh',
      '.py',
      '.rb',
      '.go',
      '.rs',
      '.java',
      '.kt',
      '.php',
      '.env',
      '.log',
      '.ini',
      '.toml',
      '.conf',
    ].includes(ext)
  ) {
    return 'text';
  }

  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return 'audio';

  if (['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video';

  return 'none';
}

interface TextAttachmentPreviewProps {
  url: string;
  kind: 'markdown' | 'text';
}

/**
 * TextAttachmentPreview — fetches and displays text or markdown file content.
 * Manages its own loading/error state so the parent component stays clean.
 * @param props - component props.
 * @param props.url - file URL to fetch.
 * @param props.kind - preview kind ('markdown' or 'text').
 */
function TextAttachmentPreview({ url, kind }: TextAttachmentPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load attachment');
        }

        const text = await response.text();

        setContent(text);
      })
      .catch((fetchError: Error) => {
        if (fetchError.name === 'AbortError') return;

        setError(fetchError.message || 'Failed to load attachment');
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  let previewContent: ReactNode;

  if (error !== null) {
    previewContent = <p className='text-sm text-destructive'>{error}</p>;
  } else if (content === null) {
    previewContent = (
      <p className='text-sm text-muted-foreground'>Loading...</p>
    );
  } else if (kind === 'markdown') {
    previewContent = (
      <div className='max-h-[480px] overflow-auto'>
        <ChatMessageContent content={content} />
      </div>
    );
  } else {
    previewContent = (
      <pre className='max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs leading-relaxed text-foreground'>
        {content}
      </pre>
    );
  }

  return (
    <div className='rounded-[var(--radius-card)] border border-border bg-background p-4'>
      {previewContent}
    </div>
  );
}

interface AttachmentInlinePreviewProps {
  attachment: IssueAttachment;
}

/**
 * AttachmentInlinePreview — always-visible inline content for an attachment.
 * Returns null for unsupported types ('none' kind).
 * @param props - component props.
 * @param props.attachment - the attachment to preview.
 */
function AttachmentInlinePreview({ attachment }: AttachmentInlinePreviewProps) {
  const url = attachmentUrl(attachment);
  const kind = getAttachmentPreviewKind(attachment);

  if (!url || kind === 'none') return null;

  if (kind === 'image') {
    return (
      <div className='overflow-hidden rounded-[var(--radius-card)] border border-border bg-black/10'>
        <img
          src={url}
          alt={attachmentLabel(attachment)}
          className='max-h-[420px] w-full object-contain'
        />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className='overflow-hidden rounded-[var(--radius-card)] border border-border bg-background'>
        <iframe
          title={attachmentLabel(attachment)}
          src={url}
          className='h-[480px] w-full'
        />
      </div>
    );
  }

  if (kind === 'audio') {
    return (
      <div className='rounded-[var(--radius-card)] border border-border bg-background p-4'>
        <audio controls className='w-full' src={url}>
          Your browser does not support audio preview.
        </audio>
      </div>
    );
  }

  if (kind === 'video') {
    return (
      <div className='overflow-hidden rounded-[var(--radius-card)] border border-border bg-black'>
        <video controls className='max-h-[480px] w-full' src={url}>
          Your browser does not support video preview.
        </video>
      </div>
    );
  }

  if (kind === 'markdown' || kind === 'text') {
    return <TextAttachmentPreview url={url} kind={kind} />;
  }

  return null;
}

/**
 * IssueAttachments component.
 * @param props - component props.
 * @param props.issueId
 * @param props.initialAttachments
 * @returns JSX element.
 */
export function IssueAttachments({
  issueId,
  initialAttachments,
}: IssueAttachmentsProps) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isPending, startTransition] = useTransition();

  /**
   * refresh — reloads the attachment list from the server.
   */
  const refresh = async () => {
    const next = await getIssueAttachments(issueId);

    setAttachments(next);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>Attachments</h3>
          <p className='text-sm text-muted-foreground'>
            Upload files related to the selected issue.
          </p>
        </div>
        <label className='inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent'>
          <Upload className='h-4 w-4' />
          Upload
          <input
            type='file'
            className='hidden'
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              startTransition(async () => {
                const formData = new FormData();

                formData.append('file', file);

                const result = await uploadIssueAttachment(issueId, formData);

                if ('error' in result) {
                  toast.error(result.error);

                  return;
                }

                toast.success('Attachment uploaded');
                await refresh();
              });
            }}
          />
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className='rounded-[var(--radius-card)] border border-border bg-background/30 p-4 text-sm text-muted-foreground'>
          No attachments yet.
        </div>
      ) : (
        attachments.map((attachment) => {
          const url = attachmentUrl(attachment);
          const urlBadge = url ? (
            <Badge variant='primary'>Viewable</Badge>
          ) : (
            <Badge variant='warning'>No file URL</Badge>
          );
          const openButton = url ? (
            <a
              href={url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-10 w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent'
            >
              <ExternalLink className='h-4 w-4' />
              Open
            </a>
          ) : null;

          return (
            <div
              key={attachment.id}
              className='flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-background/30 p-4'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <Paperclip className='h-4 w-4 text-muted-foreground' />
                    <span className='truncate text-sm font-medium text-foreground'>
                      {attachmentLabel(attachment)}
                    </span>
                  </div>
                  <div className='mt-1 flex flex-wrap items-center gap-2'>
                    <Badge variant='default'>#{attachment.id}</Badge>
                    {urlBadge}
                  </div>
                </div>
                <div className='flex flex-wrap justify-end gap-2'>
                  {openButton}
                  <Button
                    type='button'
                    variant={BUTTON_VARIANT.danger}
                    className='w-auto px-3'
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteAttachment(attachment.id);
                        toast.success('Attachment deleted');
                        await refresh();
                      });
                    }}
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete
                  </Button>
                </div>
              </div>

              <AttachmentInlinePreview attachment={attachment} />
            </div>
          );
        })
      )}
    </div>
  );
}
