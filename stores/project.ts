import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Project } from "@/types/project";

export interface ProjectStore {
  project: Project | null;
  setProject: (project: Project | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set) => ({
      project: null,
      setProject: (project) => set({ project }),
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "project-store" }
  )
);
