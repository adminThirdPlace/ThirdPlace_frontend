"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import Image from "next/image";
import { DM_Sans } from "next/font/google";
import Link from "next/link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

interface Step {
  id: number;
  title: string;
  description: string;
  image: string;
}

/* ---------- slide data ---------- */
const slides: Step[] = [
  {
    id: 1,
    title: "TELL US ABOUT YOU",
    description:
      "Take a quick personality test — so we can match you with the right people and the right vibes.",
    image: "/step1.gif",
  },
  {
    id: 2,
    title: "GET MATCHED",
    description:
      "Our algorithm matches you with amazing people for unforgettable evenings and deep conversations.",
    image: "/step2-ezgif.com-reverse.gif",
  },
  {
    id: 3,
    title: "SHOW UP & LET THE MAGIC HAPPEN",
    description:
      "Join curated experiences, meet real people, and spark something real—right here, in real life. ✨",
    image: "/step3-ezgif.com-crop.gif",
  },
];

/* ---------- sizing ---------- */
const CARD_W = 270;
const CARD_H = 320;
const PEEK   = 50; // width of the “peek” you want to show
const GAP    = 8;  // **constant space between any two cards**

/* ---------- helpers ---------- */
const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));

export default function StepCarousel() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);      // -1 = back, 1 = next
  const lock = useRef(false);

  const next = () => setIdx(i => clamp(i + 1, slides.length - 1));
  const prev = () => setIdx(i => clamp(i - 1, slides.length - 1));

  /* ---------- swipe ---------- */
  const swipeHandlers = useSwipeable({
    onSwipedLeft : () => { setDir( 1); next(); },
    onSwipedRight: () => { setDir(-1); prev(); },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: true,
  });

  /* ---------- wheel ---------- */
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (lock.current) return;
    if (Math.abs(e.deltaX) < 15 && Math.abs(e.deltaY) < 15) return;
    lock.current = true;
    if (e.deltaX > 0 || e.deltaY > 0) { setDir(1);  next(); }
    else                               { setDir(-1); prev(); }
    setTimeout(() => (lock.current = false), 350);
  };

  /* ---------- framer variants ---------- */
  const variants = {
    enter : (d: number) => ({ x: d > 0 ?  CARD_W : -CARD_W, opacity: 0 }),
    center:               { x: 0,                          opacity: 1 },
    exit  : (d: number) => ({ x: d > 0 ? -CARD_W :  CARD_W, opacity: 0 }),
  };

  /* ---------- Card ---------- */
  const Card = ({ step }: { step: Step }) => (
    <div
      className="rounded-4xl shadow-sm flex flex-col items-center px-4 py-5 bg-[#FAF0E5]"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full bg-black text-white text-[16px] mb-3 select-none ${dmSans.className}`}
      >
        {step.id}
      </div>
      <h3 className="text-center text-[18px] font-medium mb-1 select-none">
        {step.title}
      </h3>
      <p className="text-center text-[14px] leading-relaxed mb-3 select-none">
        {step.description}
      </p>
      <div className="relative flex-1 w-full pointer-events-none -mb-12">
        <Image
          src={step.image}
          alt={`Step ${step.id}`}
          fill
          style={{ objectFit: "contain" }}
          unoptimized
          priority={step.id === 1}
        />
      </div>
    </div>
  );

  /* ---------- progress ---------- */
  const pct = ((idx + 1) / slides.length) * 100;

  /* ---------- dynamic positions ---------- */
  const hasLeft  = idx > 0;
  const hasRight = idx < slides.length - 1;

  // main card’s left edge: flush on first slide, shifted when a left neighbour exists
  const mainLeft = hasLeft ? PEEK + GAP : 0;

  // frame width so that the right neighbour peeks by `PEEK`
  const frameW   = mainLeft + CARD_W + GAP + PEEK;

  /* ---------- render ---------- */
  return (
    <div
      className="flex flex-col items-center w-full -mt-2 bg-white space-y-4 select-none"
      onWheel={onWheel}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {/* Headings */}
      <h1 className="text-black text-[32px] sm:text-5xl md:text-6xl lg:text-7xl text-center">
        HOW IT <span className="italic">WORKS?</span>
      </h1>
      <h2 className="text-black text-center text-[18px] sm:text-base -mt-3">
        Real connection in 3 easy steps
      </h2>

      {/* Progress bar */}
      <div className="w-[310px] -ml-4 h-px bg-[#E5E5E5] rounded-full overflow-hidden">
        <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Slide frame */}
      <div
        className="relative"
        style={{ width: frameW, height: CARD_H, overflow: "hidden" }}
        {...swipeHandlers}
      >
        {/* Left neighbour */}
        {hasLeft && (
          <div
            className="absolute top-0 opacity-60 pointer-events-none"
            style={{
              left: mainLeft - GAP - CARD_W,
              width: CARD_W,
              height: CARD_H,
              transform: "scale(0.92)",
            }}
          >
            <Card step={slides[idx - 1]} />
          </div>
        )}

        {/* Main animated card */}
        <AnimatePresence custom={dir} initial={false} mode="popLayout">
          <motion.div
            key={slides[idx].id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="absolute"
            style={{ top: 0, left: mainLeft }}
          >
            <Card step={slides[idx]} />
          </motion.div>
        </AnimatePresence>

        {/* Right neighbour */}
        {hasRight && (
          <div
            className="absolute top-0 opacity-60 pointer-events-none"
            style={{
              left: mainLeft + CARD_W + GAP,
              width: CARD_W,
              height: CARD_H,
              transform: "scale(0.92)",
            }}
          >
            <Card step={slides[idx + 1]} />
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/auth"
        className="w-[210px] mb-14 mt-4 bg-black h-[40px] text-white rounded-xl py-1.5 text-[18px] hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        START YOUR JOURNEY
      </Link>
    </div>
  );
}
