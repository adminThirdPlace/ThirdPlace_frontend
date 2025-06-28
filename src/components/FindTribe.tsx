"use client";

import React from "react";
import Image from "next/image";

export default function FindTribe() {
  return (
    <div className="bg-black rounded-2xl pt-13 flex flex-col items-center w-full overflow-hidden">
      {/* ------- Heading ------- */}
      <h2 className="text-[32px] text-white mb-1">
        FIND YOUR <span className="italic">PEOPLE</span>
      </h2>
      <p className="text-white w-full text-center pl-7 text-[18px]">
        Say "yes" and discover the people, places, and
      </p>
      <p className="text-white w-full text-center pl-9 text-[18px] mb-13">
        moments you were never supposed to miss.
      </p>

      {/* ------- Single–image block ------- */}
      <div
        className="relative w-full max-w-4xl -mt-8 flex items-center justify-center"      /* keeps the same overall height */
      >
        <Image
          src="/Untitled design (6) (1).png"              /* your single image */
          alt="Find your people"
          width={470}                   /* set explicit size */
          height={470}
          style={{
            objectFit: "cover",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
