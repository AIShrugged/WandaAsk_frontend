'use server';

import { revalidatePath } from 'next/cache';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import {
  MEETING_SUMMARY_DEFAULT_SECTIONS,
  type MeetingSummarySection,
  type MeetingSummaryTemplate,
  type MeetingSummaryTemplateResolved,
} from '@/features/teams/model/types';
import type { ActionResult } from '@/shared/types/server-action';

/**
 * Fetch the meeting summary template for a team.
 * Backend returns 404 when no template exists — we normalize to a defaulted
 * shape so the UI always has a sections list to render.
 */
export async function getMeetingSummaryTemplate(
  teamId: number,
): Promise<MeetingSummaryTemplateResolved> {
  try {
    const { data } = await httpClient<MeetingSummaryTemplate>(
      `${API_URL}/teams/${teamId}/meeting-summary-template`,
    );

    if (!data) {
      return {
        template: null,
        sections: MEETING_SUMMARY_DEFAULT_SECTIONS,
        isDefault: true,
      };
    }

    return {
      template: data,
      sections: data.sections,
      isDefault: false,
    };
  } catch (err) {
    if (err instanceof ServerError && err.status === 404) {
      return {
        template: null,
        sections: MEETING_SUMMARY_DEFAULT_SECTIONS,
        isDefault: true,
      };
    }
    throw err;
  }
}

/**
 * Create or update the meeting summary template for a team.
 */
export async function upsertMeetingSummaryTemplate(
  teamId: number,
  sections: MeetingSummarySection[],
): Promise<ActionResult<MeetingSummaryTemplate>> {
  try {
    const { data } = await httpClient<MeetingSummaryTemplate>(
      `${API_URL}/teams/${teamId}/meeting-summary-template`,
      {
        method: 'PUT',
        body: JSON.stringify({ sections }),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    revalidatePath('/dashboard/teams', 'page');

    if (!data) {
      return { data: null, error: 'Empty response from server' };
    }

    return { data, error: null };
  } catch (err) {
    if (err instanceof ServerError) {
      const parsed = parseApiError(
        err.responseBody ?? '',
        'Failed to save meeting summary template',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw err;
  }
}
