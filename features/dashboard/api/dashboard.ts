'use server';

import { getChats } from '@/features/chat/api/chats';
import { getMethodologies } from '@/features/methodology/api/methodology';
import { getTeams } from '@/features/teams/api/team';
import { getUser } from '@/features/user/api/user';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';

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
