"use client";

import { useEffect, useState } from "react";
import { scrollStore } from "@/lib/scroll";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const contact = document.getElementById("contato");
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      const atContact = contact
        ? contact.getBoundingClientRect().top < window.innerHeight * 0.6
        : false;
      setVisible(pastHero && !atContact);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      onClick={() =>
        scrollStore.lenis
          ? scrollStore.lenis.scrollTo("#contato")
          : document
              .getElementById("contato")
              ?.scrollIntoView({ behavior: "smooth" })
      }
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center gap-3 bg-bronze text-ink rounded-full pl-6 pr-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[0_18px_60px_rgba(201,169,110,0.35)] ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      aria-label="Agendar demonstração"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full bg-bronze/30 animate-ping [animation-duration:2.6s]"
      />
      <span className="relative text-[11px] md:text-[12px] tracking-[0.18em] uppercase font-medium">
        Agendar demonstração
      </span>
      <svg
        className="relative"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M7 17L17 7M17 7H8M17 7V16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
