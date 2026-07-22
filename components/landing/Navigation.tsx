"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { scrollStore } from "@/lib/scroll";

const links = [
  { label: "Sincronia", href: "#sincronia" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Obras", href: "#obras" },
];

export default function Navigation({ ready }: { ready: boolean }) {
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const lastY = useRef(0);
  const [shown, setShown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  /* entrance after preloader */
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShown(true), 250);
    return () => clearTimeout(t);
  }, [ready]);

  /* hide on scroll down, reveal on scroll up + active section */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 60);
        setHidden(!open && y > 160 && y > lastY.current);
        lastY.current = y;

        const mid = window.innerHeight * 0.45;
        let current = "";
        for (const l of links) {
          const el = document.getElementById(l.href.slice(1));
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) {
            current = l.href.slice(1);
            break;
          }
        }
        setActive(current);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  /* close mobile menu if header hides */
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    if (scrollStore.lenis) scrollStore.lenis.scrollTo(href);
    else document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  /* gentle magnetic pull on the pill CTA */
  const magnet = (e: React.MouseEvent) => {
    const el = ctaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.22,
      y: (e.clientY - (r.top + r.height / 2)) * 0.3,
      duration: 0.35,
      ease: "power3.out",
    });
  };
  const release = () => {
    if (!ctaRef.current) return;
    gsap.to(ctaRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.4)",
    });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-[transform,opacity,background-color,border-color] duration-500 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      } ${hidden ? "-translate-y-full" : "translate-y-0"} ${
        scrolled
          ? "bg-ink/80 backdrop-blur-md border-b border-bone/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-[76px] flex items-center justify-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            scrollStore.lenis?.scrollTo(0);
          }}
          className="flex items-baseline gap-1.5"
        >
          <span className="font-display text-xl tracking-tight text-bone">
            ObrasCity
          </span>
          <span className="text-[9px] tracking-[0.3em] uppercase text-bronze">
            ®
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                className={`nav-link relative text-[13px] tracking-[0.12em] uppercase transition-colors duration-300 ${
                  isActive ? "text-bone" : "text-bone-dim hover:text-bone"
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="absolute -bottom-[5px] left-0 right-0 h-px bg-bronze" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Auth buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[12px] tracking-[0.1em] uppercase text-bone-dim hover:text-bone transition-colors duration-300 px-4 py-2"
          >
            Login
          </Link>
          <Link
            href="/cadastro"
            className="text-[12px] tracking-[0.1em] uppercase text-bone border border-bone/20 hover:border-bone/40 px-5 py-2.5 rounded-full transition-all duration-300"
          >
            Criar conta
          </Link>
          <a
            ref={ctaRef}
            href="#contato"
            onMouseMove={magnet}
            onMouseLeave={release}
            onClick={(e) => go(e, "#contato")}
            className="text-[12px] tracking-[0.1em] uppercase text-ink bg-bronze hover:bg-bronze/90 px-5 py-2.5 rounded-full transition-colors duration-300 ml-1"
          >
            Agendar demo
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menu"
        >
          <span
            className={`block w-6 h-px bg-bone transition-transform duration-300 ${
              open ? "rotate-45 translate-y-[3.5px]" : ""
            }`}
          />
          <span
            className={`block w-6 h-px bg-bone transition-transform duration-300 ${
              open ? "-rotate-45 -translate-y-[3.5px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-ink/98 backdrop-blur-lg border-t border-bone/10 px-6 py-8 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(e, l.href)}
              className="font-display text-2xl text-bone"
            >
              {l.label}
            </a>
          ))}
          
          <div className="h-px bg-bone/10 my-3" />
          
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-display text-xl text-bone-dim hover:text-bone transition-colors"
          >
            Login
          </Link>
          <Link
            href="/cadastro"
            onClick={() => setOpen(false)}
            className="font-display text-xl text-bone-dim hover:text-bone transition-colors"
          >
            Criar conta
          </Link>
          
          <a
            href="#contato"
            onClick={(e) => go(e, "#contato")}
            className="mt-3 text-[13px] tracking-[0.12em] uppercase text-ink bg-bronze px-6 py-4 rounded-full text-center"
          >
            Agendar demonstração
          </a>
        </div>
      )}
    </header>
  );
}
