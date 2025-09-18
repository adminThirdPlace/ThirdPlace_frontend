"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

/* ---------- swap with live data ---------- */
const events = [
  { src: "/a.PNG",           title: "Pitch and Pair",  location: "MG Road, BLR"      },
  { src: "/b.PNG",           title: "⁠Listening room",  location: "MG Road, BLR"      },
   { src: "/secret supper & stories.png", title: "Secret, Supper & Stories", location: "Koramangala, BLR" },
  { src: "/c.PNG",           title: "Sunset & Walk by the lake",  location: "MG Road, BLR"      },
   
  { src: "/secret picnic.PNG",           title: "Secret Picnic Meet-Cute",  location: "MG Road, BLR"      },
];

export default function PickVibe() {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stripRef.current?.scrollTo({ left: 0 });
  }, []);

  return (
    <div className="w-full mt-10 bg-white text-black flex flex-col items-center text-center p-4 py-8">
      {/* ---------- headings ---------- */}
      <h1 className="text-[32px] sm:text-5xl md:text-6xl lg:text-7xl mb-1">
        PICK YOUR <span className="italic">VIBE</span>
      </h1>
      <h2 className="text-[18px] sm:text-xl md:text-2xl">
        From cozy dinners to dance-all-night
      </h2>
      <h2 className="text-[18px] sm:text-xl md:text-2xl -mt-0.5">
        parties — it’s all here.
      </h2>

      {/* ---------- horizontal strip ---------- */}
      <div
        ref={stripRef}
        className="
          flex flex-nowrap 
          overflow-x-scroll
          w-full  pr-4 py-6
          snap-x snap-mandatory scroll-smooth
          scrollbar-hide
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {events.map((evt, i) => (
          <div           /* ⬅ no link wrapper here */
            key={i}
            className="
              flex-none snap-center bg-white rounded-xl cursor-pointer
              w-[80vw] max-w-[316px]
            "
          >
            {/* image */}
            <div
              className="
                relative flex-shrink-0
                w-[292px] h-[322px] mx-auto
                md:w-full md:h-56
                overflow-hidden rounded-4xl
              "
              style={{ maxHeight: "100vh" }}
            >
              <Image
                src={evt.src}
                alt={evt.title}
                fill
                priority={i === 0}
                className="object-cover rounded-xl transition-transform duration-200 hover:scale-105"
              />
            </div>

            {/* text */}
            <div className="text-left pl-3 pt-2 pb-4">
              <h3 className="text-[22px] font-[500]">{evt.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- CTA ---------- */}
      <div className="mb-8">
        <Link         /* ⬅ button still links to /auth */
          href="/auth"
          className="bg-black rounded-xl w-[210px] h-[40px] -mt-3 flex items-center justify-center"
        >
          <span className="text-white text-[18px] tracking-wide">
            RESERVE YOUR SPOT
          </span>
        </Link>
      </div>
    </div>
  );
}
