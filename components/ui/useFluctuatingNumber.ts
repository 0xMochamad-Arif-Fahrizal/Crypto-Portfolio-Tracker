'use client';

import { useEffect, useRef, useState } from 'react';

interface UseFluctuatingNumberOptions {
  /** Center value the number wanders around. */
  base: number;
  /** Base fractional range around `base`, e.g. 0.03 = ±3%. Actual swing size
   *  is randomized per spin between roughly 0.55x and 1.9x of this. */
  volatility?: number;
  /** Baseline duration of one "spin" (rapid flicker → settle); randomized
   *  ±25% per cycle so the rhythm doesn't read as a metronome. */
  spinDurationMs?: number;
  /** Baseline hold time after settling before spinning again; randomized. */
  holdDurationMs?: number;
  /** How long a settled value is remembered and excluded from reappearing. */
  noRepeatWindowMs?: number;
}

interface FluctuatingNumberState {
  /** The current display value. */
  value: number;
  /** Motion-blur amount in px — peaks mid-flicker, clears to 0 on settle. */
  blur: number;
  /** Small vertical offset in px that decays to 0 on settle, paired with
   *  `blur` to read as a fast scroll rather than a flat flicker. */
  shiftY: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const randRange = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(randRange(min, max + 1));
// Smoothstep: zero slope at both ends — every leg of a spin starts and ends
// at rest, so position AND velocity stay continuous where legs meet. This,
// not frame rate, is what makes motion read as smooth rather than jittery.
const smoothstep = (x: number) => x * x * (3 - 2 * x);

// A minimum wall-clock budget per leg. Earlier iterations sized legs purely
// from a curve's derivative and let some legs land under a millisecond —
// shorter than a single animation frame, so the browser had nowhere to draw
// an in-between position and the number visibly teleported. Every leg here
// is guaranteed at least this long, so smoothstep always has several frames
// to actually glide through.
const MIN_LEG_MS = 55;

export function useFluctuatingNumber({
  base,
  volatility = 0.03,
  spinDurationMs = 1200,
  holdDurationMs = 2000,
  noRepeatWindowMs = 30_000,
}: UseFluctuatingNumberOptions): FluctuatingNumberState {
  const [state, setState] = useState<FluctuatingNumberState>({ value: base, blur: 0, shiftY: 0 });
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef(base);
  const recentRef = useRef<Array<{ value: number; time: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    // Pick a settle target that isn't a near-repeat of anything shown in the
    // last `noRepeatWindowMs`, with a randomized swing size each time so the
    // range itself feels less predictable than a fixed ±volatility band.
    const pickTarget = () => {
      const now = performance.now();
      recentRef.current = recentRef.current.filter((e) => now - e.time < noRepeatWindowMs);

      let candidate = base;
      let tries = 0;
      do {
        const spread = volatility * randRange(0.55, 1.9);
        const direction = Math.random() < 0.5 ? -1 : 1;
        candidate = base * (1 + direction * Math.random() * spread);
        tries++;
      } while (
        tries < 12 &&
        recentRef.current.some((e) => Math.abs(e.value - candidate) < base * 0.0015)
      );

      recentRef.current.push({ value: candidate, time: now });
      return candidate;
    };

    // A spin is a single continuous path through a handful of waypoints, not
    // a tween with noise layered on top — noise-on-a-tween always looks
    // jittery because the value keeps reversing direction no matter how
    // correlated the noise is. Waypoints are built as a random walk (each
    // one is a bounded step from the last, pulled increasingly hard toward
    // the target) so *consecutive* waypoints are always close together —
    // that's what a single leg's glide actually has to render — while the
    // walk as a whole can still roam widely over the full spin.
    const spin = () => {
      const target = pickTarget();
      const from = currentRef.current;
      const legs = randInt(5, 8);
      const growth = randRange(1.35, 1.85); // leg-duration growth: short legs early, long legs late
      const flickerBand = base * volatility * randRange(1.6, 2.6);
      const targetDuration = spinDurationMs * randRange(0.85, 1.3);

      // Distribute targetDuration across legs by weight (growth^i), then
      // enforce MIN_LEG_MS by flooring and shrinking the non-floored legs to
      // compensate — guarantees every leg is renderable across multiple
      // frames while keeping total spin length close to targetDuration.
      const weights = Array.from({ length: legs }, (_, i) => growth ** i);
      const weightSum = weights.reduce((a, b) => a + b, 0);
      let legDur = weights.map((w) => (w / weightSum) * targetDuration);
      legDur = legDur.map((d) => Math.max(d, MIN_LEG_MS));
      const overshoot = legDur.reduce((a, b) => a + b, 0) - targetDuration;
      if (overshoot > 0) {
        const shrinkable = legDur.reduce((a, d) => a + (d > MIN_LEG_MS ? d : 0), 0);
        if (shrinkable > 0) {
          legDur = legDur.map((d) => (d > MIN_LEG_MS ? Math.max(MIN_LEG_MS, d - overshoot * (d / shrinkable)) : d));
        }
      }
      const boundary = [0];
      for (let i = 0; i < legs; i++) boundary.push(boundary[i] + legDur[i]);
      const duration = boundary[legs];

      const waypoints: number[] = [from];
      let cur = from;
      for (let i = 1; i < legs; i++) {
        const t = i / legs;
        const pull = 0.12 + 0.55 * t; // pulls harder toward target as the spin progresses
        const noiseAmp = (flickerBand / legs) * (1 + (1 - t) * 1.8); // bigger, wilder steps early
        cur = cur + (Math.random() * 2 - 1) * noiseAmp;
        cur = cur + (target - cur) * pull;
        waypoints.push(cur);
      }
      waypoints.push(target);

      const start = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        const overall = clamp01(elapsed / duration);

        let leg = legs - 1;
        for (let i = 0; i < legs; i++) {
          if (elapsed < boundary[i + 1]) { leg = i; break; }
        }
        const legStart = boundary[leg];
        const legEnd = boundary[leg + 1];
        const legProgress = legEnd > legStart ? clamp01((elapsed - legStart) / (legEnd - legStart)) : 1;
        const legEased = smoothstep(legProgress);

        const display = waypoints[leg] + (waypoints[leg + 1] - waypoints[leg]) * legEased;

        // Kept deliberately subtle: this is an LED dot-matrix pixel font, and
        // a heavy blur smears its crisp dots into a smudge instead of reading
        // as motion. A light touch is enough to suggest speed without
        // fighting the typeface.
        const blur = 1.8 * (1 - overall) ** 1.6;
        const legDirection = Math.sign(waypoints[leg + 1] - waypoints[leg]) || 1;
        const shiftY = legDirection * Math.sin(legProgress * Math.PI) * 1.1 * (1 - overall) ** 1.3;

        currentRef.current = display;
        setState({ value: display, blur, shiftY });

        if (overall >= 1) {
          currentRef.current = target;
          setState({ value: target, blur: 0, shiftY: 0 });
          timeoutRef.current = setTimeout(() => {
            if (!cancelled) spin();
          }, holdDurationMs * randRange(0.65, 1.5));
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    spin();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
