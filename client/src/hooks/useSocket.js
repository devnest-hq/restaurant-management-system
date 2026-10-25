import { useEffect } from "react";
import { socket } from "../socket/socket";
import { useAuthStore } from "../store/auth.store";

export function useSocket() {
  const status = useAuthStore(state => state.status);
  const accessToken = useAuthStore(state => state.accessToken);

  // Connect while logged in, disconnect on logout
  useEffect(() => {
    if (status !== "authenticated") return

    socket.connect();

    return () => {
      socket.disconnect();
    }
  }, [status]);

  // Reconnect with new toke if the server rejected the old one
  useEffect(() => {
    if (status !== "authenticated") return;

    if (!socket.active) {
      socket.connect();
    }
  }, [accessToken, status]);
}