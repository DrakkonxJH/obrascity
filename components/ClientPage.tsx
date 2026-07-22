"use client";

import { useState } from "react";
import SmoothScroll from "./SmoothScroll";
import Cursor from "./Cursor";
import Preloader from "./Preloader";
import Navigation from "./Navigation";
import SideProgress from "./SideProgress";
import StickyCTA from "./StickyCTA";
import Hero from "./Hero";
import Marquee from "./Marquee";
import SectionDivider from "./SectionDivider";
import Manifesto from "./Manifesto";
import Capabilities from "./Capabilities";
import Impact from "./Impact";
import Works from "./Works";
import Quote from "./Quote";
import FaqSection from "./FaqSection";
import Contact from "./Contact";
import Footer from "./Footer";

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
