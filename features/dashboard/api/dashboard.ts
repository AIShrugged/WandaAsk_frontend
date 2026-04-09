'use server';

import { getChats } from '@/features/chat';
import { getMethodologies } from '@/features/methodology';
import { getTeams } from '@/features/teams';
import { getUser } from '@/features/user';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';

/**
 * getDashboardData.
 * @returns Promise.
 */
export async function getDashboardData() {
  const organizationId = await getOrganizationId();
  const [userResult, teamsResult, methodologiesResult, chatsResult] =
    await Promise.allSettled([
      getUser(),
      getTeams(organizationId),
      getMethodologies(String(organizationId)),
      getChats(0, 5),
    ]);

  return {
    user: userResult.status === 'fulfilled' ? userResult.value.data : null,
    teamsCount:
      teamsResult.status === 'fulfilled' ? teamsResult.value.totalCount : 0,
    methodologiesCount:
      methodologiesResult.status === 'fulfilled'
        ? methodologiesResult.value.totalCount
        : 0,
    recentChats:
      chatsResult.status === 'fulfilled' ? chatsResult.value.chats : [],
    chatsCount:
      chatsResult.status === 'fulfilled' ? chatsResult.value.totalCount : 0,
  };
}
