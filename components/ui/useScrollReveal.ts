'use client';

import { useEffect } from 'react';

/**
 * Scroll-triggered reveal: any element rendered with `data-reveal` (and the
 * `cf-reveal` class, see colors_and_type.css) fades/slides/unblurs into
 * view the first time it scrolls into the viewport, then stops being
 * observed. Pure presentation — no data, no state beyond a CSS class.
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (elements.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('cf-reveal-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cf-reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
