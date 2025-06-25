import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { FaWhatsapp } from 'react-icons/fa'

function WhatsappSection() {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center mb-8">
        <h2 className="text-white text-[32px] md:text-4xl mb-2">
          JOIN THE{' '}
          <span className="text-green-500 italic  text-[32px]">
            VIBE
          </span>
        </h2>
        <p className="text-white text-[18px]">Real talk. Real people, No small talk, just</p>
        <p className="text-white text-[18px]">a Whatsapp away</p>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        {/* Subtle Glowing effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[310px] h-[520px] rounded-3xl blur-lg " />
        </div>
        {/* Main Image */}
        <Image
          src="/whatsappimg.png"
          alt="Animated character"
          width={355}
          height={629}
          className="relative -mt-10 z-10 object-contain rounded-2xl"
          unoptimized
        />
      </div>

   <Link href="https://chat.whatsapp.com/FvtR65ZwPn0IV1Pe8ftJcW" target="_blank" rel="noopener noreferrer">
  <button
    className="flex items-center  w-[240px] -mt-3 h-[50px] gap-3 bg-green-500 hover:bg-green-600 transition rounded-2xl  px-4.5 shadow-lg text-white text-[16px] tracking-wide"
    style={{ minWidth: 220 }}
  >
    <FaWhatsapp className="text-2xl" />
    Join the community
    <span className="ml-2 text-2xl font-light">{'>'}</span>
  </button>
</Link>
    </div>
  )
}

export default WhatsappSection
