import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Main editor store combining all feature slices
 * Uses Zustand for lightweight, performant state management
 */

// Store interfaces will be extended by feature slices
export interface EditorStore {
  // Project state
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  // UI state
  isPanelOpen: boolean;
  togglePanel: () => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      // Project state
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      // UI state
      isPanelOpen: true,
      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

      // Loading state
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "editor-store",
    }
  )
);
