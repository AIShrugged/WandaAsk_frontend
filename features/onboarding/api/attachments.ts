'use server';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type { IssueAttachment } from '@/features/issues/model/types';
import type { ActionResult } from '@/shared/types/server-action';

export async function uploadPendingAttachment(
  file: File,
  uploadToken: string,
  organizationId: number,
): Promise<ActionResult<IssueAttachment>> {
  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_token', uploadToken);
    formData.append('organization_id', String(organizationId));

    const { data } = await httpClient<IssueAttachment>(
      `${API_URL}/attachments/pending`,
      { method: 'POST', body: formData },
    );

    if (!data) return { data: null, error: 'Upload failed' };

    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to upload file',
      );

      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw error;
  }
}

// To download an attachment, use GET /api/v1/attachments/{id}/download
// with Authorization: Bearer <token>. No unauthenticated signed-URL route exists.
export async function deletePendingAttachment(
  attachmentId: number,
): Promise<ActionResult<null>> {
  try {
    await httpClient(`${API_URL}/attachments/pending/${attachmentId}`, {
      method: 'DELETE',
    });

    return { data: null, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to delete file',
      );

      return { data: null, error: parsed.message };
    }

    throw error;
  }
}
