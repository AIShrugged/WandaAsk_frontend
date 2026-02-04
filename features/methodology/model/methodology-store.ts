import { createCachedListStore } from '@/shared/store/create-cached-list-store';

import type { MethodologyProps } from '@/features/methodology/model/types';

export const useMethodologyStore = createCachedListStore<MethodologyProps>();
