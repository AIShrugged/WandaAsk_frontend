'use client';

import { Pencil, Reply, Trash2, X, Check } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createIssueComment,
  deleteIssueComment,
  updateIssueComment,
} from '@/features/issues/api/comments';
import { Button } from '@/shared/ui/button/Button';
import { MarkdownContent } from '@/shared/ui/markdown-content';
import Textarea from '@/shared/ui/input/textarea';
import { BUTTON_SIZE, BUTTON_VARIANT } from '@/shared/types/button';

import type { IssueComment } from '@/features/issues/model/types';

interface IssueCommentsProps {
  issueId: number;
  initialComments: IssueComment[];
  currentUserId: number;
}

interface CommentItemProps {
  comment: IssueComment;
  issueId: number;
  currentUserId: number;
  isReply?: boolean;
  onReplyPosted: (parentId: number, reply: IssueComment) => void;
  onUpdated: (updated: IssueComment) => void;
  onDeleted: (commentId: number, parentId: number | null) => void;
}

/**
 * Formats a date string to a readable relative or absolute format.
 * @param dateStr - ISO date string.
 * @returns Formatted string.
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * CommentItem renders a single comment with edit/delete/reply actions.
 */
function CommentItem({
  comment,
  issueId,
  currentUserId,
  isReply = false,
  onReplyPosted,
  onUpdated,
  onDeleted,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const isOwner = comment.user.id === currentUserId;

  function handleEdit() {
    startTransition(async () => {
      if (!editContent.trim()) return;
      const result = await updateIssueComment(issueId, comment.id, editContent.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        onUpdated(result.data);
        setIsEditing(false);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIssueComment(issueId, comment.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onDeleted(comment.id, comment.parent_id);
    });
  }

  function handleReply() {
    startTransition(async () => {
      if (!replyContent.trim()) return;
      const result = await createIssueComment(issueId, {
        content: replyContent.trim(),
        parent_id: comment.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        onReplyPosted(comment.id, result.data);
        setReplyContent('');
        setIsReplying(false);
      }
    });
  }

  return (
    <div className={isReply ? 'ml-8 mt-2' : ''}>
      <div className='group flex gap-3'>
        {/* Avatar */}
        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary uppercase'>
          {comment.user.name.charAt(0)}
        </div>

        <div className='flex-1 min-w-0'>
          {/* Header */}
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-sm font-medium text-foreground'>
              {comment.user.name}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatDate(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className='text-xs text-muted-foreground italic'>(edited)</span>
            )}
          </div>

          {/* Content or edit form */}
          {isEditing ? (
            <div className='flex flex-col gap-2'>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                resizable={false}
                height={80}
                autoFocus
              />
              <div className='flex gap-2'>
                <Button
                  size={BUTTON_SIZE.sm}
                  onClick={handleEdit}
                  disabled={isPending || !editContent.trim()}
                  loading={isPending}
                  loadingText='Saving...'
                >
                  <Check className='w-3.5 h-3.5 mr-1' />
                  Save
                </Button>
                <Button
                  size={BUTTON_SIZE.sm}
                  variant={BUTTON_VARIANT.secondary}
                  onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                  disabled={isPending}
                >
                  <X className='w-3.5 h-3.5 mr-1' />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <MarkdownContent>{comment.content}</MarkdownContent>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className='flex items-center gap-3 mt-1.5'>
              {!isReply && (
                <button
                  className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
                  onClick={() => setIsReplying((v) => !v)}
                  disabled={isPending}
                >
                  <Reply className='w-3 h-3' />
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
                    onClick={() => setIsEditing(true)}
                    disabled={isPending}
                  >
                    <Pencil className='w-3 h-3' />
                    Edit
                  </button>
                  <button
                    className='text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors'
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    <Trash2 className='w-3 h-3' />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className='flex flex-col gap-2 mt-2'>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder='Write a reply...'
                resizable={false}
                height={72}
                autoFocus
              />
              <div className='flex gap-2'>
                <Button
                  size={BUTTON_SIZE.sm}
                  onClick={handleReply}
                  disabled={isPending || !replyContent.trim()}
                  loading={isPending}
                  loadingText='Posting...'
                >
                  Reply
                </Button>
                <Button
                  size={BUTTON_SIZE.sm}
                  variant={BUTTON_VARIANT.secondary}
                  onClick={() => { setIsReplying(false); setReplyContent(''); }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {!isReply && comment.replies.length > 0 && (
        <div className='border-l-2 border-border ml-4 pl-2 mt-2 flex flex-col gap-3'>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              issueId={issueId}
              currentUserId={currentUserId}
              isReply
              onReplyPosted={onReplyPosted}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * IssueComments renders the full comments section for an issue.
 */
export function IssueComments({
  issueId,
  initialComments,
  currentUserId,
}: IssueCommentsProps) {
  const [comments, setComments] = useState<IssueComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();

  function handlePost() {
    startTransition(async () => {
      if (!newComment.trim()) return;
      const result = await createIssueComment(issueId, { content: newComment.trim() });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setComments((prev) => [...prev, { ...result.data!, replies: [] }]);
        setNewComment('');
      }
    });
  }

  function handleReplyPosted(parentId: number, reply: IssueComment) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c,
      ),
    );
  }

  function handleUpdated(updated: IssueComment) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updated.id) return { ...updated, replies: c.replies };
        return {
          ...c,
          replies: c.replies.map((r) => (r.id === updated.id ? updated : r)),
        };
      }),
    );
  }

  function handleDeleted(commentId: number, parentId: number | null) {
    if (parentId === null) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
            : c,
        ),
      );
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No comments yet.</p>
      ) : (
        <div className='flex flex-col gap-4'>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              issueId={issueId}
              currentUserId={currentUserId}
              onReplyPosted={handleReplyPosted}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className='flex flex-col gap-2 pt-2 border-t border-border'>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Add a comment...'
          resizable={false}
          height={80}
        />
        <div className='flex justify-end'>
          <Button
            size={BUTTON_SIZE.sm}
            onClick={handlePost}
            disabled={isPending || !newComment.trim()}
            loading={isPending}
            loadingText='Posting...'
          >
            Post comment
          </Button>
        </div>
      </div>
    </div>
  );
}
