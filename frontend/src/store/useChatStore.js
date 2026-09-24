import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useChatStore = create(
  persist(
    (set) => ({
      activeChatId: null,
      setActiveChat: (id) => set({ activeChatId: id }),
      closeChat: () => set({ activeChatId: null }),
    }),
    {
      name: "chat-workbench-storage", // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Optional: Only persist specific fields if your store grows
      // partialize: (state) => ({ activeChatId: state.activeChatId }),
    }
  )
);