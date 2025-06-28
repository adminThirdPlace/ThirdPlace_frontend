'use client';

import React from 'react';
import { DM_Sans } from 'next/font/google';
import { Volume2, VolumeX } from 'lucide-react';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

type Props = {
  videoId: string;
  activeVideo: string | null;
  setActiveVideo: (id: string | null) => void;
};

export default function NewsSection({ videoId, activeVideo, setActiveVideo }: Props) {
  const isMuted = activeVideo !== videoId;

  return (
    <div className={`bg-black w-full py-10 px-2 sm:px-4 md:px-6 lg:px-8 ${dmSans.className}`}>
      <div className="flex flex-col-reverse lg:flex-row items-center max-w-6xl mx-auto gap-8 font-sans">
        {/* Left text block */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center">
  <div className="relative flex mr-6 ml-6 gap-3 md:gap-6 items-start">
    <div className="absolute left-0 top-0 h-full w-1 bg-white" />
    <div className="pl-3 sm:pl-5 md:pl-8 w-full">
      {/* BREAKING NEWS + SOURCE ROW */}
      <div className="flex items-center justify-between w-full mb-4 md:mb-6">
        <div className="bg-white text-black font-bold font-sans text-[14px] h-[21px] px-2 whitespace-nowrap shadow-md">
          BREAKING NEWS
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          Source:{' '}
          <a
            href="https://www.instagram.com/reel/DFtbvs5JReH/?igsh=aXptNnF1aGU2dXM5"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @christianb.23
          </a>
        </span>
      </div>

      {/* HEADLINE */}
      <h3 className="font-bold uppercase font-sans mr-6 tracking-tight leading-snug text-left w-full text-white mt-2">
        <span
          className="block whitespace-normal md:whitespace-nowrap"
          style={{ fontSize: '15px' }}
        >
          OUR GENERATION IS SO DISCONNECTED
        </span>
        <span
          className="block whitespace-normal md:whitespace-nowrap"
          style={{ fontSize: '16px' }}
        >
          BECAUSE WE LACK THIRD PLACES.
        </span>
      </h3>
    </div>
  </div>
</div>


        {/* Right video block */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative mr-6 ml-6 border-white border-[2px] rounded-xl overflow-hidden shadow-xl w-full max-w-xl">
            <video
              src="https://l7qzt21i1euwjh0a.public.blob.vercel-storage.com/lem6stjjtzd0bptsyb8v-vwMA6jLaDq7mpY2QxQyKU0JY456JQS.mp4"
              poster="/poster_video2.png"
              autoPlay
              loop
              playsInline
              muted={isMuted}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <button
              onClick={() => setActiveVideo(isMuted ? videoId : null)}
              className="absolute bottom-4 left-4 bg-black/70 text-white h-7 w-10 rounded-3xl backdrop-blur-lg flex items-center justify-center"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
