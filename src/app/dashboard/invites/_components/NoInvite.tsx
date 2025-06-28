
import { Ticket } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

export default function NoInvites() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#161616]">
     

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 -mt-95">
      
        <Ticket className="h-19 w-16 stroke-1 rotate-315" />

        {/* Empty state heading */}
        <h2 className="mt-2 text-[28px] font-medium leading-snug">
          No Invites accepted&nbsp;… yet!
        </h2>

        {/* Sub‑copy */}
        <p className="mt-1 text-[18px] text-gray-800">A few beautiful nights are waiting.</p>
        <p className="-mt-1 text-[18px] text-gray-800">Just for you</p>

        {/* Call‑to‑action button */}
        <Link href={'/dashboard'}>
         <button
          type="button"
          className="mt-4  cursor-pointer w-[230px] rounded-full bg-black px-8 py-3 text-[20px] italic text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/40"
        >
       CURATE MY NIGHT
        </button></Link>
       
      </main>
    </div>
  );
}
