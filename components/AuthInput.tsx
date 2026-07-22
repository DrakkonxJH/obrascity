"use client";

import { useState, useRef } from "react";
import gsap from "gsap";

interface AuthInputProps {
  label: string;
  type?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  optional?: boolean;
}

export default function AuthInput({
  label, type = "text", name, value, onChange,
  placeholder = "", required = false, minLength, optional = false,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const isFloating = focused || value.length > 0;

  const handleFocus = () => {
    setFocused(true);
    gsap.to(lineRef.current, { scaleX: 1, duration: 0.5, ease: "power3.out" });
    gsap.to(glowRef.current, { opacity: 1, duration: 0.4 });
  };

  const handleBlur = () => {
    setFocused(false);
    gsap.to(lineRef.current, { scaleX: 0, duration: 0.4, ease: "power3.in" });
    gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
  };

  return (
    <div className="auth-field relative group">
      {/* Glow behind on focus */}
      <div
        ref={glowRef}
        className="absolute -inset-px rounded-xl bg-bronze/10 blur-sm opacity-0 pointer-events-none transition-opacity"
      />

      <div className="relative">
        {/* Floating label */}
        <label
          className={`absolute left-5 pointer-events-none transition-all duration-300 ease-out ${
            isFloating
              ? "top-2 text-[9px] tracking-[0.3em] uppercase text-bronze"
              : "top-4 text-sm text-bone-dim/50"
          }`}
        >
          {label}
          {optional && (
            <span className="text-bone-dim/30 ml-1 normal-case tracking-normal text-[10px]">
              (opcional)
            </span>
          )}
        </label>

        <input
          type={type}
          name={name}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFloating ? placeholder : ""}
          className={`w-full bg-white/[0.03] border rounded-xl px-5 text-bone outline-none transition-all duration-300 ${
            isFloating ? "pt-6 pb-2.5" : "py-4"
          } ${
            focused
              ? "border-bronze/40 bg-white/[0.06]"
              : "border-white/10 hover:border-white/20"
          }`}
        />

        {/* Animated bottom border */}
        <div className="absolute bottom-0 left-4 right-4 h-px overflow-hidden">
          <div
            ref={lineRef}
            className="h-full bg-gradient-to-r from-transparent via-bronze to-transparent scale-x-0 origin-center"
          />
        </div>
      </div>
    </div>
  );
}
