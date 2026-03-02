import { create } from 'zustand';

interface LayoutState {
  isSidebarOpen: boolean;
  activeWorkspace: string;
  toggleSidebar: () => void;
  setActiveWorkspace: (id: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarOpen: true,
  activeWorkspace: 'default',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveWorkspace: (id) => set({ activeWorkspace: id }),
}));
