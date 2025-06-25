'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import JoinNowDiv from './FirstButton';

type Props = {
  videoId: string;
  activeVideo: string | null;
  setActiveVideo: (id: string | null) => void;
};

function HeroSection({ videoId, activeVideo, setActiveVideo }: Props) {
  const isMuted = activeVideo !== videoId;

  return (
    <section className="w-full mt-14 flex flex-col items-center justify-start bg-black">
      {/* Video wrapper */}
      <div className="relative w-full">
        <video
          
          src="https://res.cloudinary.com/dfm1bqcnz/video/upload/v1749924972/nd1lstcb1wc5ra3tutru.mp4"
          poster="/poster_video1.png"
          autoPlay
          loop
          playsInline
          muted={isMuted}
        />
        {/* Mute / un-mute button - now left side, bigger */}
         <button
              onClick={() => setActiveVideo(isMuted ? videoId : null)}
              className="absolute bottom-4 left-4 bg-black/70 text-white  pl-2 h-7 w-10 rounded-3xl backdrop-blur-lg"
            >
              {isMuted ? <VolumeX size={20}  /> : <Volume2 size={20} />}
            </button>
      </div>

      {/* -------- Existing content below stays exactly the same -------- */}
      <div className="w-full px-4 mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between max-w-6xl mx-auto">
        <div className="w-full lg:w-2/3 text-center lg:text-left">
          <h1 className="text-[30px] uppercase italic sm:text-5xl md:text-6xl lg:text-7xl  text-white tracking-tight ">
         Find something real✨
          </h1>
          <h1 className="text-[32px] sm:text-5xl italic md:text-6xl lg:text-7xl text-white tracking-tight -mt-2 mb-4">
           
          </h1>
          <p className="text-[22px] sm:text-xl font-[300] md:text-2xl lg:text-3xl text-gray-200 max-w-2xl mx-auto lg:mx-0">
           Curated IRL experiences that spark 
          </p>
          <p className="text-[22px] sm:text-xl font-[300] md:text-2xl lg:text-3xl text-gray-200 max-w-2xl mx-auto lg:mx-0">
           real connections.
          </p>
        </div>
        <div className="mt-6 lg:mt-0 lg:ml-8 flex justify-center lg:justify-end w-full lg:w-1/3">
          <JoinNowDiv />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
