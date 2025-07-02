"use client";

import { useState } from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import DoubleDownArrow from "../components/DoubleDownArrow";
import WhyNeed from "../components/WhyNeed";
import NewsSection from "../components/NewsSection";
import StepCarousel from "../components/HowITWorks";
import PickVibe from "../components/PickVibe";
import FindTribe from "../components/FindTribe";
import WhatsappSection from "@/components/ui/WhatsappSection";
import Footer from "../components/Footer";

export default function Home() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  /* ───────── smooth-scroll helper ───────── */
  const scrollToWhyNeed = () => {
    document
      .getElementById("pick-vibe")                 // anchor target
      ?.scrollIntoView({ behavior: "smooth" });   // nice & slow
  };

  return (
    <div className="bg-black">
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      <HeroSection
        videoId="hero"
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      />

      {/* arrow → scroll to WHY NEED section */}
      <DoubleDownArrow onClick={scrollToWhyNeed} />

      {/* ---------- WHY NEED ----------
      <div id="why-need" className="scroll-mt-26.5">
        <WhyNeed />
      </div>

      <NewsSection
        videoId="news"
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      /> */}
          <section id="pick-vibe" className="scroll-mt-18">
        <PickVibe />
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <StepCarousel />
      </section>
      <FindTribe />
      <WhatsappSection />
      <Footer />
    </div>
  );
}
