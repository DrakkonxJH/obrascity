"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const works = [
  {
    img: "/images/work-residential.jpg",
    name: "Projeto Residencial",
    meta: "32 pavimentos · Exemplo ilustrativo",
  },
  {
    img: "/images/work-tower.jpg",
    name: "Projeto Corporativo",
    meta: "Torre comercial · Exemplo ilustrativo",
  },
  {
    img: "/images/work-interior.jpg",
    name: "Projeto Misto",
    meta: "Uso misto · Exemplo ilustrativo",
  },
];

export default function Works() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const figures = gsap.utils.toArray<HTMLElement>(".work-fig");

      figures.forEach((fig) => {
        const img = fig.querySelector("img");
        const caption = fig.querySelector("figcaption");
        const speed = Number(fig.dataset.speed || 6);

        // Clip reveal animation
        gsap.fromTo(
          fig,
          { clipPath: "inset(10% 5% 10% 5%)", opacity: 0.3 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: fig,
              start: "top 82%",
              once: true,
            },
          }
        );

        // Caption slide up
        if (caption) {
          gsap.fromTo(
            caption,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              delay: 0.3,
              ease: "power3.out",
              scrollTrigger: {
                trigger: fig,
                start: "top 82%",
                once: true,
              },
            }
          );
        }

        // Image parallax
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -speed },
            {
              yPercent: speed,
              ease: "none",
              scrollTrigger: {
                trigger: fig,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }

        // Figure drift for asymmetry
        const drift = Number(fig.dataset.drift || 0);
        if (drift !== 0) {
          gsap.to(fig, {
            y: drift,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="obras"
      className="relative bg-bone text-ink py-28 md:py-40 overflow-hidden"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-16 md:mb-24">
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-bronze-deep mb-4 flex items-center gap-4">
              <span className="inline-block w-10 h-px bg-bronze-deep" />
              Tipos de projeto
            </p>
            <h2 className="font-display font-light text-[clamp(2rem,4.5vw,4rem)] leading-[1.05]">
              Qualquer escala.
              <br />
              <span className="serif-i">Total controle.</span>
            </h2>
          </div>
          <span className="hidden md:block text-[10px] tracking-[0.2em] uppercase text-ink/40 pb-2 max-w-[180px] text-right leading-relaxed">
            Imagens meramente ilustrativas
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-6 md:gap-10">
          {/* Main large image */}
          <figure
            className="work-fig col-span-12 md:col-span-7 relative overflow-hidden h-[52vh] md:h-[72vh] group"
            data-speed="7"
            data-drift="0"
          >
            <img
              src={works[0].img}
              alt={works[0].name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-[120%] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
            <figcaption className="absolute bottom-0 inset-x-0 p-6 md:p-8 text-bone">
              <div className="font-display text-2xl md:text-3xl font-light">
                {works[0].name}
              </div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-bone/60 mt-1">
                {works[0].meta}
              </div>
            </figcaption>
          </figure>

          {/* Two stacked images */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6 md:gap-10">
            <figure
              className="work-fig relative overflow-hidden h-[42vh] md:h-[52vh] md:mt-20 group"
              data-speed="9"
              data-drift="-40"
            >
              <img
                src={works[1].img}
                alt={works[1].name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-[120%] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <figcaption className="absolute bottom-0 inset-x-0 p-6 text-bone">
                <div className="font-display text-2xl font-light">
                  {works[1].name}
                </div>
                <div className="text-[11px] tracking-[0.25em] uppercase text-bone/60 mt-1">
                  {works[1].meta}
                </div>
              </figcaption>
            </figure>

            <figure
              className="work-fig relative overflow-hidden h-[42vh] md:h-[52vh] group"
              data-speed="6"
              data-drift="35"
            >
              <img
                src={works[2].img}
                alt={works[2].name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-[120%] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <figcaption className="absolute bottom-0 inset-x-0 p-6 text-bone">
                <div className="font-display text-2xl font-light">
                  {works[2].name}
                </div>
                <div className="text-[11px] tracking-[0.25em] uppercase text-bone/60 mt-1">
                  {works[2].meta}
                </div>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-[10px] tracking-[0.15em] uppercase text-ink/35 text-center">
          * Imagens de banco de imagem para fins ilustrativos. Cases reais disponíveis sob consulta.
        </p>
      </div>
    </section>
  );
}
