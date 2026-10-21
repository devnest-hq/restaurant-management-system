import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  // mustChangePassword: false,

  setSession: ({ user, accessToken }) => set({
    user,
    accessToken,
    status: "authenticated",
    // mustChangePassword
  }),

  setToken: (token) => set({ accessToken: token }),

  clearSession: () => set({
    user: null,
    accessToken: null,
    status: "unauthenticated",
    // mustChangePassword: false,
  })
  
}));