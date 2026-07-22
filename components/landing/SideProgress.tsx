"use client";

import { useEffect, useState } from "react";
import { scrollStore } from "@/lib/scroll";

const items = [
  { id: "topo", label: "Início" },
  { id: "sincronia", label: "Sincronia" },
  { id: "plataforma", label: "Plataforma" },
  { id: "obras", label: "Obras" },
  { id: "contato", label: "Contato" },
];

export default function SideProgress() {
  const [active, setActive] = useState("topo");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Progresso da página"
      className="fixed right-7 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-5"
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() =>
              scrollStore.lenis
                ? scrollStore.lenis.scrollTo(
                    item.id === "topo" ? 0 : `#${item.id}`
                  )
                : document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth" })
            }
            className="group flex items-center gap-3"
            aria-label={item.label}
          >
            <span
              className={`text-[9px] tracking-[0.3em] uppercase transition-all duration-300 ${
                isActive
                  ? "opacity-80 text-bronze"
                  : "opacity-0 translate-x-2 text-bone-dim group-hover:opacity-70 group-hover:translate-x-0"
              }`}
            >
              {item.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-500 ${
                isActive
                  ? "w-2 h-6 bg-bronze"
                  : "w-2 h-2 bg-bone/25 group-hover:bg-bone/60"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
