import { api } from "./client";
import { useAuthStore } from "../store/auth.store";

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout failed. Try again", err);
  } finally {
    useAuthStore.getState().clearSession();
  }
}