'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { TeamDashboardData } from '../model/dashboard-types';

/**
 * getTeamDashboard.
 * @param teamId - Team ID.
 * @returns Promise.
 */
export const getTeamDashboard = async (teamId: string) =>
  {return httpClient<TeamDashboardData>(`${API_URL}/teams/${teamId}/dashboard`)};
