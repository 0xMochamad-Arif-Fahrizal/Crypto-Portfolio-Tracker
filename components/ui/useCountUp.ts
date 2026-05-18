'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = value;
    startedAtRef.current = null;
    let raf: number;

    const tick = (t: number) => {
      if (startedAtRef.current == null) startedAtRef.current = t;
      const dt = t - startedAtRef.current;
      const p = Math.min(1, dt / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
