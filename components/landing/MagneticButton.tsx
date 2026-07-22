"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";

interface MagneticButtonProps {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function MagneticButton({
  children, type = "submit", disabled = false, onClick, className = "",
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const magnet = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.2,
      y: (e.clientY - (r.top + r.height / 2)) * 0.25,
      duration: 0.35,
      ease: "power3.out",
    });
  };

  const release = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.35)" });
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={magnet}
      onMouseLeave={release}
      className={`group relative inline-flex items-center justify-center gap-3 overflow-hidden disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {/* Fill sweep */}
      <span className="absolute inset-0 bg-bronze translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-xl" />
      {children}
    </button>
  );
}
