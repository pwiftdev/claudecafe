"use client";

import { useEffect, useRef, useState } from "react";

interface Logo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

const LOGO_COUNT = 5;
const LOGO_SIZE = 48;

export default function BouncingLogos() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<Logo[]>([]);
  const animRef = useRef<number>(0);
  const [positions, setPositions] = useState<Logo[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    logosRef.current = Array.from({ length: LOGO_COUNT }, () => ({
      x: Math.random() * (w - LOGO_SIZE),
      y: Math.random() * (h - LOGO_SIZE),
      vx: (0.5 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
      vy: (0.5 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
      size: LOGO_SIZE,
      opacity: 0.15 + Math.random() * 0.2,
    }));

    setPositions([...logosRef.current]);

    const tick = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;

      for (const logo of logosRef.current) {
        logo.x += logo.vx;
        logo.y += logo.vy;

        if (logo.x <= 0) { logo.x = 0; logo.vx *= -1; }
        if (logo.x >= cw - logo.size) { logo.x = cw - logo.size; logo.vx *= -1; }
        if (logo.y <= 0) { logo.y = 0; logo.vy *= -1; }
        if (logo.y >= ch - logo.size) { logo.y = ch - logo.size; logo.vy *= -1; }
      }

      setPositions(logosRef.current.map(l => ({ ...l })));
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
      {positions.map((logo, i) => (
        <img
          key={i}
          src="/tardlogo.jpeg"
          alt=""
          className="absolute rounded-full"
          style={{
            width: logo.size,
            height: logo.size,
            left: logo.x,
            top: logo.y,
            opacity: logo.opacity,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
