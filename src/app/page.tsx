'use client';

import { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import DoubleDownArrow from '../components/DoubleDownArrow';
import WhyNeed from '../components/WhyNeed';
import NewsSection from '../components/NewsSection';
import StepCarousel from '../components/HowITWorks';
import PickVibe from '../components/PickVibe';
import FindTribe from '../components/FindTribe';
import WhatsappSection from '@/components/ui/WhatsappSection';
import Footer from '../components/Footer';
import Image from 'next/image';

export default function Home() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

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

      <DoubleDownArrow />
      <WhyNeed />

      <NewsSection
        videoId="news"
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      />

      <section id="how-it-works" className="scroll-mt-24">
        <StepCarousel />
      </section>

      <section id="pick-vibe" className="scroll-mt-24">
        <PickVibe />
      </section>

      <FindTribe />
      <WhatsappSection />
      <Footer />
    </div>
  );
}
