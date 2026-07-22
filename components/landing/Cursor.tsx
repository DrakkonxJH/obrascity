"use client";

import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100,
      my = -100;
    let rx = -100,
      ry = -100;
    let raf = 0;
    let isHover = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const interactives = "a, button, [data-cursor]";
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      isHover = !!t.closest(interactives);
      ring.classList.toggle("is-hover", isHover);
    };

    const loop = () => {
      // dot follows instantly
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      // micro dot — 4px, sits exactly on mouse
      dot.style.transform = `translate(${mx - 2}px, ${my - 2}px)`;

      // ring — trails behind, grows only on interactive hover
      const half = isHover ? 22 : 10;
      ring.style.transform = `translate(${rx - half}px, ${ry - half}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />
    </>
  );
}
