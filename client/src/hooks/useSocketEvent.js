import { useEffect, useRef } from "react";
import { socket } from "../socket/socket";

export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args);

    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}