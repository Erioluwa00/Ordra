import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal — triggers a CSS reveal animation when the element
 * enters the viewport.  Returns a ref to attach and a boolean.
 *
 * @param {Object} opts
 * @param {number} opts.threshold  — IntersectionObserver threshold (0-1)
 * @param {string} opts.rootMargin — margin around the root
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // Only animate once
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

/**
 * RevealWrapper — a lightweight component that wraps children in a
 * scroll-triggered reveal container.
 *
 * Usage:
 *   <RevealWrapper direction="up" delay={0.1}>
 *     <MyCard />
 *   </RevealWrapper>
 */
export function RevealWrapper({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.12,
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  const { ref, isVisible } = useScrollReveal({ threshold });

  const dirClass = `reveal-${direction}`;
  const style = delay ? { transitionDelay: `${delay}s` } : undefined;

  return (
    <Tag
      ref={ref}
      className={`reveal ${dirClass} ${isVisible ? 'visible' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
