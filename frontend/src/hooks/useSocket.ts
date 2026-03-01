import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!WS_URL) return;
    const s = io(WS_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return { socket, connected };
}
