import { createCachedListStore } from '@/shared/store/create-cached-list-store';

import type { TeamProps } from '@/features/teams/model/types';

export const useTeamsStore = createCachedListStore<TeamProps>();
