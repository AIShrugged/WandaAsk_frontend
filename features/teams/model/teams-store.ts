import { createCachedListStore } from '@/shared/store/create-cached-list-store';

import type { TeamProps } from '@/entities/team';

export const useTeamsStore = createCachedListStore<TeamProps>();
