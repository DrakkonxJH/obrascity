"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";

const Building3D = dynamic(() => import("../landing/Building3D"), { ssr: false });

interface AuthShellProps {
  children: ReactNode;
  panelImage: string;
  panelContent: ReactNode;
}

export default function AuthShell({ children, panelImage, panelContent }: AuthShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelImgRef = useRef<HTMLImageElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  /* ── Custom cursor ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -80, my = -80, rx = -80, ry = -80, isHover = false, raf = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      isHover = !!t.closest("a,button,input,select,label,textarea,[data-cursor]");
      ring.classList.toggle("is-hover", isHover);
    };
    const loop = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      dot.style.transform = `translate(${mx - 2}px,${my - 2}px)`;
      const h = isHover ? 22 : 10;
      ring.style.transform = `translate(${rx - h}px,${ry - h}px)`;
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

  /* ── Mouse parallax on side panel image ── */
  useEffect(() => {
    const panel = panelRef.current;
    const img = panelImgRef.current;
    if (!panel || !img) return;
    const onMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(img, { x: cx * 20, y: cy * 15, duration: 1, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(img, { x: 0, y: 0, duration: 1, ease: "power3.out" });
    panel.addEventListener("mousemove", onMove, { passive: true });
    panel.addEventListener("mouseleave", onLeave);
    return () => {
      panel.removeEventListener("mousemove", onMove);
      panel.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  /* ── GSAP entrance animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      document.querySelectorAll<SVGPathElement | SVGCircleElement>(".auth-stroke-draw").forEach((p) => {
        if ("getTotalLength" in p) {
          const len = (p as SVGPathElement).getTotalLength();
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
            strokeDashoffset: 0, duration: 2, ease: "power2.inOut", delay: 0.5,
          });
        }
      });
      gsap.utils.toArray<HTMLElement>(".auth-float").forEach((el, i) => {
        gsap.to(el, {
          y: "random(-16,16)", x: "random(-6,6)", rotation: "random(-5,5)",
          duration: "random(5,8)", repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.6,
        });
      });
      gsap.to(".auth-glow", { scale: 1.15, opacity: 0.6, duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.fromTo(".auth-panel", { clipPath: "inset(0 0 0 100%)" }, {
        clipPath: "inset(0 0 0 0%)", duration: 1.4, ease: "power4.inOut", delay: 0.15,
      });
      gsap.fromTo(".auth-3d", { opacity: 0 }, {
        opacity: 1, duration: 2.2, ease: "power2.out", delay: 0.2,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ── Magnetic logo ── */
  const logoMagnet = (e: React.MouseEvent) => {
    const el = logoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.25,
      y: (e.clientY - (r.top + r.height / 2)) * 0.3,
      duration: 0.35, ease: "power3.out",
    });
  };
  const logoRelease = () => {
    if (!logoRef.current) return;
    gsap.to(logoRef.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" });
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-ink flex relative overflow-hidden">
      {/* ── Film grain ── */}
      <div className="grain" aria-hidden />

      {/* ── Custom cursor ── */}
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />

      {/* ── 3D Building scene — sits at z-[1], receives pointer events ── */}
      <div className="auth-3d absolute inset-0 z-[1] opacity-0">
        <Building3D />
      </div>

      {/* ── Vignettes — pointer-events-none so mouse passes to 3D ── */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_30%_50%,transparent_10%,#0e0d0b_70%)] pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-ink/60 via-ink/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-ink/20 pointer-events-none" />

      {/* ── Glow orbs ── */}
      <div className="auth-glow absolute top-[30%] left-[18%] w-[500px] h-[500px] rounded-full bg-bronze/[0.06] blur-[140px] pointer-events-none z-[3]" />
      <div className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] rounded-full bg-bronze/[0.03] blur-[100px] pointer-events-none z-[3]" />

      {/* ── SVG stroke-draw decorations ── */}
      <svg className="absolute top-[6%] left-[4%] w-28 h-28 pointer-events-none z-[4] hidden md:block" viewBox="0 0 120 120" fill="none">
        <path className="auth-stroke-draw" d="M20,35 L60,15 L100,35 L100,85 L60,105 L20,85 Z" stroke="#c9a96e" strokeWidth="0.6" strokeOpacity="0.15" fill="none" />
        <path className="auth-stroke-draw" d="M20,35 L60,55 L100,35 M60,55 L60,105" stroke="#c9a96e" strokeWidth="0.6" strokeOpacity="0.12" fill="none" />
      </svg>
      <svg className="absolute bottom-[8%] left-[28%] w-20 h-20 pointer-events-none z-[4] hidden md:block" viewBox="0 0 100 100" fill="none">
        <circle className="auth-stroke-draw" cx="50" cy="50" r="40" stroke="#c9a96e" strokeWidth="0.5" strokeOpacity="0.12" fill="none" />
        <circle className="auth-stroke-draw" cx="50" cy="50" r="24" stroke="#c9a96e" strokeWidth="0.4" strokeOpacity="0.1" fill="none" />
      </svg>

      {/* ── Floating shapes ── */}
      <div className="auth-float absolute top-[50%] left-[3%] w-10 h-10 opacity-[0.08] pointer-events-none z-[4] hidden md:block">
        <svg viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" stroke="#c9a96e" strokeWidth="0.5" /><rect x="10" y="10" width="20" height="20" stroke="#c9a96e" strokeWidth="0.4" /></svg>
      </div>
      <div className="auth-float absolute top-[20%] left-[38%] w-8 h-8 opacity-[0.06] pointer-events-none z-[4] hidden lg:block">
        <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,36 4,36" stroke="#c9a96e" strokeWidth="0.5" fill="none" /></svg>
      </div>

      {/* ── Accent lines ── */}
      <div className="absolute top-[55%] left-0 w-[44%] h-px bg-gradient-to-r from-transparent via-bronze/15 to-transparent pointer-events-none z-[4] hidden lg:block" />
      <div className="absolute top-[30%] left-[10%] w-px h-[25%] bg-gradient-to-b from-transparent via-bronze/10 to-transparent pointer-events-none z-[4] hidden lg:block" />

      {/* ── LEFT: Form ──
           pointer-events-none on the wrapper so mouse falls through to 3D,
           pointer-events-auto on every interactive element inside ── */}
      <div className="relative z-10 w-full lg:w-[48%] flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-28 py-12 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_label]:pointer-events-auto [&_textarea]:pointer-events-auto">
        {/* Magnetic Logo */}
        <Link
          ref={logoRef}
          href="/"
          onMouseMove={logoMagnet}
          onMouseLeave={logoRelease}
          className="flex items-baseline gap-1.5 mb-14 group w-fit"
        >
          <span className="font-display text-xl tracking-tight text-bone group-hover:text-bronze transition-colors duration-300">
            ObrasCity
          </span>
          <span className="text-[9px] tracking-[0.3em] uppercase text-bronze group-hover:text-bone transition-colors duration-300">
            ®
          </span>
        </Link>

        <div className="max-w-md flex-1 flex flex-col justify-center">
          {children}
        </div>

        <div className="pt-12">
          <p className="text-[10px] tracking-[0.2em] uppercase text-bone/20">
            © 2026 AtlasTech · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── RIGHT: Visual panel ── */}
      <div ref={panelRef} className="auth-panel hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img
          ref={panelImgRef}
          src={panelImage}
          alt=""
          className="absolute inset-[-5%] w-[110%] h-[110%] object-cover will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/20 via-ink/60 to-ink" />
        <div className="absolute inset-0 bg-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-bronze/[0.06] via-transparent to-bronze/[0.04]" />

        {/* Corner accents */}
        <div className="absolute top-12 right-12 w-20 h-20 border-r border-t border-bronze/20" />
        <div className="absolute bottom-12 left-12 w-16 h-16 border-l border-b border-bronze/20" />

        <div className="relative z-10 flex flex-col justify-between p-14 xl:p-20 w-full pointer-events-none">
          {panelContent}
        </div>
      </div>
    </div>
  );
}
