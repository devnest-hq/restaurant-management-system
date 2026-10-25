import { io } from "socket.io-client";
import { API_ORIGIN } from "../api/client";
import { useAuthStore } from "../store/auth.store";

export const socket = io(API_ORIGIN, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    cb({ token: useAuthStore.getState().accessToken });
  },
});