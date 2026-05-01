"use client";
import { useEffect, useState } from "react";

export default function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono text-base font-semibold text-gray-700 tabular-nums" aria-live="polite">
      {time}
    </div>
  );
}
