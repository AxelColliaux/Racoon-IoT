import { useEffect, useState, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3000/ws`;

export function usePostureWebSocket() {
  const [lastPosture, setLastPosture] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'posture_alert') {
          setAlerts((prev) => [{ ...data, id: Date.now() + Math.random() }, ...prev].slice(0, 50));
        }
        if (data.type === 'posture' || data.type === 'posture_alert') {
          setLastPosture(data);
        }
      } catch (_) {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  return { lastPosture, alerts, connected };
}
