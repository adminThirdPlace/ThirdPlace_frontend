import React from 'react';
import Image from 'next/image';
import AuthLink from './AuthLink';

function PickVibe() {
  return (
    <div className=" w-full bg-white text-black flex flex-col items-center justify-center text-center p-4 pb-13 py-3 -mt-2">
      <h1 className="text-[32px] sm:text-5xl md:text-6xl lg:text-7xl  mb-1">
        PICK YOUR <span className="italic">VIBE</span>
      </h1>
      <h2 className="text-[18px] sm:text-xl -mt-0.5 md:text-2xl ">
        From cozy dinners to dance-all-night
      </h2>
      <h2 className="text-[18px]  -mt-0.5 sm:text-xl md:text-2xl ">
        parties- it's all here.
      </h2>

      <div className="bg-white items-center flex flex-col justify-center  mt-4">
        <Image
          src="/protoType1.svg"
          alt="Animated character"
          width={260}
          height={580}
          className="object-contain"
          unoptimized
        />
      </div>
           <div className="flex mt-8 mb-5 justify-center items-center  bg-white">
    <div className="border w-[170px] h-[40px]  bg-black rounded-xl px-6 py-1.5 flex items-center justify-center">   <AuthLink
  className="text-white text-[18px] tracking-wide cursor-pointer"
>
  SIGN UP NOW!
</AuthLink>
    </div>
  </div>
    
    </div>
  );
}

export default PickVibe;
