import { useState, useEffect, useRef } from "react";

export function useRestTimer(defaultSeconds = 90) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => { setTimeLeft(defaultSeconds); };
  const dismiss = () => { setTimeLeft(null); if (intervalRef.current) clearInterval(intervalRef.current); };
  const addTime = (s: number) => setTimeLeft(t => t != null ? t + s : null);

  useEffect(() => {
    if (timeLeft === null) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    if (timeLeft <= 0) { setTimeLeft(null); return; }
    intervalRef.current = setInterval(() => setTimeLeft(t => t != null ? t - 1 : null), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timeLeft !== null && timeLeft <= 0 ? "done" : timeLeft === null ? "null" : "running"]);

  return { timeLeft, start, dismiss, addTime };
}
