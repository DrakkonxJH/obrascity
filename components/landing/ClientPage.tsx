"use client";

import { useState } from "react";
import SmoothScroll from "@/components/landing/SmoothScroll";
import Cursor from "@/components/landing/Cursor";
import Preloader from "@/components/landing/Preloader";
import Navigation from "@/components/landing/Navigation";
import SideProgress from "@/components/landing/SideProgress";
import StickyCTA from "@/components/landing/StickyCTA";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import SectionDivider from "@/components/landing/SectionDivider";
import Manifesto from "@/components/landing/Manifesto";
import Capabilities from "@/components/landing/Capabilities";
import Impact from "@/components/landing/Impact";
import Works from "@/components/landing/Works";
import Quote from "@/components/landing/Quote";
import FaqSection from "@/components/landing/FaqSection";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function ClientPage() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Preloader onDone={() => setReady(true)} />
      <div className="grain" aria-hidden />
      <Navigation ready={ready} />
      <SideProgress />
      <StickyCTA />
      <main>
        <Hero ready={ready} />
        <Marquee />
        <SectionDivider from="#ece5d8" to="#0e0d0b" />
        <Manifesto />
        <Capabilities />
        <Impact />
        <SectionDivider from="#0e0d0b" to="#ece5d8" />
        <Works />
        <Quote />
        <SectionDivider from="#ece5d8" to="#0e0d0b" />
        <FaqSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
