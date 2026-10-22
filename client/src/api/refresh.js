import axios from "axios";
import { useAuthStore } from "../store/auth.store";
const API_ORIGIN = import.meta.env.VITE_API_URL;

const refreshClient = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

export const refreshSession = async () => {
  const res = await refreshClient.post("/auth/refresh");
  const { user, accessToken } = res.data;

  useAuthStore.getState().setSession({ user, accessToken });
  return accessToken;
}