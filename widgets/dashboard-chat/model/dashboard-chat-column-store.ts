import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DashboardChatColumnStore = {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

export const useDashboardChatColumnStore = create<DashboardChatColumnStore>()(
  persist(
    (set, get) => {
      return {
        isCollapsed: false,
        toggle: () => {
          return set({ isCollapsed: !get().isCollapsed });
        },
        setCollapsed: (value) => {
          return set({ isCollapsed: value });
        },
      };
    },
    { name: 'dashboard-chat-column' },
  ),
);
