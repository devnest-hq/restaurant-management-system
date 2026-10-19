import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  mustChangePassword: false,

  setSession: ({ user, accessToken, mustChangePassword = false }) => set({
    user,
    accessToken,
    status: "authenticated",
    mustChangePassword
  }),

  setToken: (token) => set({ token }),

  clearSession: () => set({
    user: null,
    accessToken: null,
    status: "unauthenticated",
    mustChangePassword: false,
  })
  
}));