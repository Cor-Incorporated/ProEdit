import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { MediaFile } from '@/types/media'

export interface MediaStore {
  // State
  mediaFiles: MediaFile[]
  isLoading: boolean
  uploadProgress: number
  selectedMediaIds: string[]
  isInitialized: boolean

  // Actions
  setMediaFiles: (files: MediaFile[]) => void
  addMediaFile: (file: MediaFile) => void
  removeMediaFile: (id: string) => void
  setLoading: (loading: boolean) => void
  setUploadProgress: (progress: number) => void
  toggleMediaSelection: (id: string) => void
  clearSelection: () => void
}

export const useMediaStore = create<MediaStore>()(
  devtools(
    (set) => ({
      // Initial state
      mediaFiles: [],
      isLoading: false,
      uploadProgress: 0,
      selectedMediaIds: [],
      isInitialized: false,

      // Actions
      setMediaFiles: (files) => set({ mediaFiles: files, isInitialized: true }),

      addMediaFile: (file) => set((state) => ({
        mediaFiles: [file, ...state.mediaFiles],
        isInitialized: true,
      })),

      removeMediaFile: (id) => set((state) => ({
        mediaFiles: state.mediaFiles.filter(f => f.id !== id),
        selectedMediaIds: state.selectedMediaIds.filter(sid => sid !== id),
        isInitialized: true,
      })),

      setLoading: (loading) => set({ isLoading: loading }),

      setUploadProgress: (progress) => set({ uploadProgress: progress }),

      toggleMediaSelection: (id) => set((state) => ({
        selectedMediaIds: state.selectedMediaIds.includes(id)
          ? state.selectedMediaIds.filter(sid => sid !== id)
          : [...state.selectedMediaIds, id]
      })),

      clearSelection: () => set({ selectedMediaIds: [] }),
    }),
    { name: 'media-store' }
  )
)
