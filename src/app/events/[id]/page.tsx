"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Gift,
  Calendar,
  TicketPlus,
  Info,
  X as XIcon,
} from "lucide-react";

import { eventService, type BackendEvent } from "@/services/events.service";
import { paymentService } from "@/services/payment.service";
import { personalityTestService } from "@/services/personalityTest.service";
import { useRazorpay } from "@/hooks/useRazorpay";
import PaymentUtils from "@/utils/payment.utils";
import { useUser } from "@/hooks/useUser";
import { usePersonalityTestReturn } from "@/hooks/usePersonalityTestReturn";
import { EventDetailsSkeleton } from "@/components/ui/skeleton";
import Understand from "../_components/UnderStand";

type PageProps = { params: Promise<{ id: string }> };

function EventPageContent({ params }: PageProps) {
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const router = useRouter();
  const { openRazorpay } = useRazorpay();
  const { user } = useUser();
  
  // Handle user data refresh when returning from personality test
  usePersonalityTestReturn();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [friendPhone, setFriendPhone] = useState("");
  const [showUnderstandModal, setShowUnderstandModal] = useState(false);
  const [hasSeenUnderstand, setHasSeenUnderstand] = useState(false);

  function handleInvite() {
    if (inviteInput.trim().length === 10) {
      setFriendPhone(inviteInput.trim());
      setInviteInput("");
      setShowInviteModal(false);
    }
  }


  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { id } = await params;
        const fetchedEvent = await eventService.getEventById(id);
        setEvent(fetchedEvent);
      } catch (error) {
        console.error('Error fetching event:', error);
        return notFound();
      }
    };

    fetchEvent();
  }, [params]);

  if (!event) return <EventDetailsSkeleton />;  const handleContinue = async () => {
    // First, check if personality test is completed
    if (!user?.personalityTestCompleted) {
      const currentPath = window.location.pathname;
      router.push(`/personality-test?returnTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    // If personality test is completed but user hasn't seen the UnderStand modal, show it first
    if (!hasSeenUnderstand) {
      setShowUnderstandModal(true);
      return;
    }

    // If user has seen the modal and completed personality test, proceed with payment
    await handleProceedWithPayment();
  };

  const handleUnderstandClose = () => {
    setShowUnderstandModal(false);
    setHasSeenUnderstand(true);
  };  const handleProceedWithPayment = async () => {
    try {
      setIsLoading(true);

      console.log('💰 Payment calculation details:', {
        baseCuration: event.price,
        discountPercentage: event.discountedPrice || 0,
        experienceTicketPrice: event.experienceTicketPrice,
        grandTotal,
        numberOfSeats
      });

      // Log payment initiation
      PaymentUtils.logPaymentActivity('PAYMENT_INITIATED', {
        eventId: event._id,
        eventName: event.title,
        numberOfSeats,
        totalAmount: grandTotal
      });

      // Create payment order with the calculated grandTotal
      const orderResponse = await paymentService.createPaymentOrder(event._id, numberOfSeats, grandTotal);
      PaymentUtils.logPaymentActivity('ORDER_CREATED', {
        orderId: orderResponse.data.orderId,
        bookingId: orderResponse.data.bookingId,
        amount: orderResponse.data.amount
      });      // Validate order response
      if (!orderResponse.data.orderId || !orderResponse.data.razorpayKeyId) {
        throw new Error('Invalid order response from server');
      }      // Immediately redirect to booking success page with payment details
      // The booking success page will show "Processing Payment" and handle Razorpay
      const paymentParams = new URLSearchParams({
        orderId: orderResponse.data.orderId,
        razorpayKey: orderResponse.data.razorpayKeyId,
        amount: orderResponse.data.amount.toString(),
        currency: orderResponse.data.currency || 'INR',
        eventName: orderResponse.data.event.name,
        eventId: event._id,
        userName: user ? `${user.firstName} ${user.lastName}` : '',
        userEmail: user?.email || '',
        userContact: user?.phoneNumber || '',
      });
      
      const successUrl = `/booking-success/${orderResponse.data.bookingId}?${paymentParams.toString()}`;
      console.log('🔗 Redirecting to booking success page for payment processing:', successUrl);      router.push(successUrl);

    } catch (error: any) {
      console.error('Payment process failed:', error);
      
      // Show user-friendly error message
      if (error.message.includes('minimum amount')) {
        alert('The order amount is too low. Please contact support.');
      } else if (error.message.includes('Invalid payment request')) {
        alert('There was an issue with your booking request. Please try again.');
      } else {
        alert(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  // itinerary text - use backend description or default
  const itinerary = event.description || 
    "This experience will start with dinner with your closest matches and continue with going to a nearby bar for a holiday party with a live band.";

  // pricing - use backend data  // Calculate pricing based on new logic
 const baseCuration = event.price; // Base curation fee from backend
const discountPercentage = event.discountedPrice || 0; // Discount percentage from backend

const discountAmount = Math.round(baseCuration * (discountPercentage / 100));
const curationAfterDiscount = Math.round(baseCuration - discountAmount);
const gstOnCuration = Math.round(curationAfterDiscount * 0.18); // 18% GST
const totalCurationWithGST = Math.round(curationAfterDiscount + gstOnCuration);
const grandTotal = Math.round(event.experienceTicketPrice + totalCurationWithGST);

  // date & time - use backend startTime
  const dateObj = new Date(event.startTime);
  const dateLabel = dateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });  const timeLabel = dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Determine the button text based on current state
  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (!user?.personalityTestCompleted) return 'Continue';
    if (!hasSeenUnderstand) return 'Continue';
    return 'Proceed to payment';
  };

  return (
    <div className="bg-[#FAFAFA]">      {/* Sticky footer CTA */}
      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-300 bg-[#FAFAFA] px-4 py-3 backdrop-blur md:px-0">
        <div className="mx-auto w-full md:max-w-lg">          <button 
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full rounded-full bg-black py-3 text-[16px] font-[500] text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {getButtonText()}
          </button>
        </div>
      </footer>
      {showInviteModal && (
  <div className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm bg-black/20">
    <div className="mx-2 w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl flex flex-col items-center">
      <h3 className="text-[22px] font-[500] text-center text-black mb-1">
        {friendPhone ? "Change your friend" : "Invite a friend"}
      </h3>
      <p className="text-[15px] font-[300] text-center mb-5">
        Please enter your friend's phone number
      </p>

      <div className="flex w-full items-center mb-6 border border-black/50 rounded-xl px-3 py-2 bg-[#fafafa]">
        <span className="text-gray-700 font-[400] text-[18px] pr-2">+91</span>
        <input
          type="text"
          value={inviteInput}
          onChange={e => setInviteInput(e.target.value.replace(/\D/, ""))}
          placeholder={friendPhone ? friendPhone : "33333 33333"}
          className="w-full border-0 bg-transparent focus:outline-none text-[17px] font-[300] tracking-wide"
          maxLength={10}
          inputMode="numeric"
        />
      </div>

      <div className="flex w-full gap-2 mt-1">
        {friendPhone ? (
          <>
            <button
              className="w-1/2 py-2 rounded-2xl border border-black text-black font-[400] bg-white"
              onClick={() => {
                setFriendPhone("");
                setInviteInput("");
                setShowInviteModal(false);
              }}
            >
              remove friend
            </button>
            <button
              className="w-1/2 py-2 rounded-2xl bg-black text-white font-[400]"
              onClick={handleInvite}
            >
              change friend
            </button>
          </>
        ) : (
          <>
            <button
              className="w-1/2 py-2 rounded-2xl border border-black text-black font-[400] bg-white"
              onClick={() => setShowInviteModal(false)}
            >
              cancel
            </button>
            <button
              className="w-1/2 py-2 rounded-2xl bg-black text-white font-[400]"
              onClick={handleInvite}
            >
              invite friend
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}


    {/* ─── Main article ─────────────────────────────────────── */}
      <article className="mx-auto w-full max-w-md px-5 pb-28 pt-4 md:max-w-lg md:px-0">
        {/* Header */}
        <header className="relative -mx-5 -mt-2.5 mb-4 border-b border-[#E5E5EA] px-0 py-2">
  {/* Back arrow */}
  <Link
    href="/dashboard"
    className="absolute left-5 top-1/2 transform -translate-y-1/2 p-1 text-black"
  >
    <ArrowLeft className="h-5 w-5" />
  </Link>

  {/* Title:  */}
  <h2 className="text-center text-[24px] font-[400] italic tracking-wide text-black">
    YOUR INVITATION
  </h2>
</header>

        {/* Cover photo */}
        <div className="overflow-hidden rounded-2xl border border-gray-300">
          <Image
            src={event.imageUrls[0] || "/placeholder-event.jpg"}
            alt={event.title}
            width={348}
            height={391}
            priority
            className="h-[391px] w-full object-cover"
          />
        </div>

        {/* Event title */}
        <h1 className="mt-3 text-center text-[20px] font-[500] text-black">
          {event.title}
        </h1>      {/* Time + Location */}
        <div className="mt-3 overflow-hidden rounded-2xl border bg-white text-[16px] text-black divide-y divide-[#E5E5EA] border-[#E5E5EA]">
          <div className="flex items-center gap-2 px-4 py-2">
            <Calendar className="h-5 w-5 text-black" />
            <span>
              {dateLabel} | <span className="uppercase">{timeLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <MapPin className="h-5 w-5 text-black" />
            <span>{event.eventLocation.venueName}</span>
          </div>
        </div>

      {/* Itinerary */}
        <section className="mt-4 overflow-hidden font-[300] rounded-2xl border bg-white border-[#E5E5EA]">
          <Header label="ITINERARY" />
          <p className="px-4 py-3 text-[14px] leading-relaxed text-black">
            {itinerary}
          </p>
        </section>

        {/* Bring a Friend */}
<section className="mt-4 overflow-hidden rounded-2xl border bg-white border-[#E5E5EA]">
  {/* 1️⃣ Header row */}
  <div className="flex justify-between items-center px-4 py-2">
    <h3 className="text-[20px] font-[400] italic tracking-wide text-black">
      BRING A FRIEND
    </h3>

    {/* Invite button only if no friendPhone */}
    {!friendPhone && (
      <button
        className="flex items-center gap-1 rounded-2xl bg-gray-900 px-3 py-[3px] text-[16px] font-[400] text-white"
        onClick={() => setShowInviteModal(true)}
      >
        <TicketPlus className="h-4 w-4" />
        Invite a friend
      </button>
    )}
  </div>

  {/* 2️⃣ Border */}
  <hr className="border-[#E5E5EA]" />

  {/* 3️⃣ Friend info block (only when friendPhone exists) */}
  {friendPhone && (
    <div className="px-4 py-2 space-y-2">
      <span className="text-lg font-[500] text-black">
        +91 {friendPhone}
      </span>
      <p className="text-sm text-gray-700 leading-snug">
        They must join Third Place in order to attend.
        We’ll text a priority signup link.
      </p>
      <button
        className="inline-block rounded-full bg-black px-4 py-1 text-sm font-[400] text-white"
        onClick={() => {
          setInviteInput(friendPhone);
          setShowInviteModal(true);
        }}
      >
        change/remove your friend
      </button>
    </div>
  )}

  {/* 4️⃣ Gift info) */}
  <div className="m-3 flex gap-3 rounded-2xl bg-[#FFF3CD] px-4 ml-3.5 mr-3.5 py-3 text-black">
    <Gift className="h-16 w-16 text-gray-800" />
    <div>
      <p className="leading-snug font-[500] text-[16px]">
        friends attend in your group
      </p>
      <p className="font-[300] text-[14px]">
        your friend stays in your group throughout the experience.
      </p>
    </div>
  </div>
</section>

     {/* PAYMENT SUMMARY */}
<section className="mt-4 overflow-visible rounded-2xl border bg-white border-[#E5E5EA] relative">
  <Header label="PAYMENT SUMMARY" />

  <div className="space-y-1 px-4 py-3 text-[16px] text-black">

    {/* 1️⃣ Experience Ticket */}
    <div className="flex items-center justify-between">
      <div className="relative">
        {/* hidden toggle */}
        <input
          type="checkbox"
          id="experience-info"
          className="peer sr-only"
        />

        {/* label + icon both inside a <label> so clicking either toggles the checkbox */}
        <label
          htmlFor="experience-info"
          className="flex items-center gap-1 cursor-pointer"
        >
          {/* dotted underline */}
          <span className="border-b border-dotted  border-gray-500 ">
            Experience Ticket
          </span>
          <Info className="h-[14px] w-[14px] text-gray-500" />
        </label>

        {/* your overlay */}
        <div
          className="peer-checked:block hidden absolute top-full left-0 z-20 mt-2 w-[280px]
                      max-h-[60vh] overflow-y-auto rounded-2xl bg-[#FAFAFA] p-4 text-sm text-black shadow-lg"
        >
          <div className="flex justify-between">
            <p className="whitespace-pre-line">
              This covers the cost of the curated activity – like salsa,
              game night or a hands-on workshop. Food & drinks not included.
            </p>
            <label
              htmlFor="experience-info"
              className="cursor-pointer pl-2"
            >
              <XIcon className="h-4 w-4 text-black" />
            </label>
          </div>
        </div>
      </div>

      <span className="font-[300] -mt-0.5">
        ₹{event.experienceTicketPrice}
      </span>
    </div>


    {/* 2️⃣ Curation Fee */}
    <details className="group">
      <summary className="flex cursor-pointer list-none items-start justify-between">
        <div className="relative flex items-center gap-1">
          {/* hidden toggle */}
          <input
            type="checkbox"
            id="curation-info"
            className="peer sr-only"
          />

          {/* wrap text+icon in label */}
          <label
            htmlFor="curation-info"





            
            className="flex items-center gap-1 cursor-pointer"
          >
            <span className="border-b border-dotted border-gray-500">
              Curation fee
            </span>
            <Info className="h-[14px] w-[14px] text-gray-500" />
          </label>

          <span className="text-gray-500 text-[12px]">(inc. of GST)</span>

          {/* overlay */}
          <div
            className="peer-checked:block hidden absolute top-full left-0 z-20 mt-2 w-[280px]
                        max-h-[60vh] overflow-y-auto rounded-2xl bg-[#FAFAFA] p-4 text-sm text-black shadow-lg"
          >
            <div className="flex justify-between">
              <p className="whitespace-pre-line">
                This enables us to create a unique experience and match
                you with people you’re most likely to vibe with.
              </p>
              <label
                htmlFor="curation-info"
                className="cursor-pointer pl-2"
              >
                <XIcon className="h-4 w-4 text-black" />
              </label>
            </div>
          </div>

          {/* dropdown arrow stays the same */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block transition-transform group-open:rotate-180"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="#222"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>        <div className="text-right leading-[1.1]">
          {discountPercentage > 0 && (
            <>
              <span className="inline-block rounded-2xl mr-13 bg-green-100 px-[6px] py-[1px] text-[12px] font-medium text-green-600">
                {discountPercentage}% off
              </span>
              <span className="block text-xs text-gray-400 -mt-4 line-through font-[300]">
                ₹{baseCuration.toLocaleString()}
              </span>
            </>
          )}
          <span className="block font-[300]">
            ₹{totalCurationWithGST.toLocaleString()}
          </span>
        </div>
      </summary>      {/* breakdown lines */}
      <div className="pl-19 space-y-0.5">
        <Line label="Base curation fee" value={baseCuration} small />
        {discountPercentage > 0 && (
          <Line
            label={`Discount (-${discountPercentage}%)`}
            value={`-₹${discountAmount.toLocaleString()}`}
            small
            extraClass="text-green-600"
          />
        )}
        <Line label="GST on base fee" value={gstOnCuration} small />
      </div>
    </details>

  </div>

  <hr className="w-full border-gray-300" />

  <div className="space-y-1 px-4 py-2 text-[16px] text-black">
    <Line label="Grand Total" value={grandTotal} extra />
  </div>
</section>

{/* Info Boxes */}
<section className="mt-4 rounded-2xl border bg-white border-[#E5E5EA]">
  <div className="px-4 py-2 space-y-4">
    {/* 1️⃣ First heading */}
    <h4 className="text-[20px] italic  font-[400] text-black">
      YOU'RE ON THE LIST — ALMOST
    </h4>

    {/* ─── full-width border, no left/right padding ─── */}
    <hr className="-mx-4 border-t -mt-2 border-[#E5E5EA]" />

    {/* first paragraph */}
    <p className="text-[16px] -mt-1 font-[300] text-black leading-snug">
      You’ll be notified if you’re selected on the day of the experience.  
      If not, you’ll get a full refund – no questions asked.
    </p>

    {/* 2️⃣ Second heading */}
    <h4 className="mt-4 text-[18px] italic font-[400] text-black">
      EACH MEMBER CAN BRING A FRIEND
    </h4>
    {/* second paragraph */}
    <p className="text-[16px] -mt-2 font-[300] mb-2 text-black leading-snug">
      Simply add them above, before the cutoff time.
    </p>
  </div>
</section>      </article>

      {/* Understand Modal */}
      {showUnderstandModal && (
        <Understand onClose={handleUnderstandClose} />
      )}
    </div>
  );
}

  /* -------------------- Helpers -------------------- */
      const Header = ({ label }: { label: string }) => (
        <>
          <div className="px-4 py-2">
            <h3 className="text-[20px] font-[400] italic tracking-wide text-black">
              {label}
            </h3>
          </div>
          <hr className="border-[#E5E5EA]" />
        </>
      );
      
      interface LineProps {
        label: string;
        value: number | string;
        bold?: boolean;
        large?: boolean;
        small?: boolean;
        extra?: boolean;
        extraClass?: string;
        valueClass?: string;
      }
      
      const Line = ({
        label,
        value,
        bold,
        large,
        small,
        extra,
        valueClass,
        extraClass = "",
      }: LineProps) => (
        <div className="flex items-center justify-between">
          <span
            className={`${
              extra
                ? "text-[18px] font-[500]"
                : large
                ? "text-[16px]"
                : small
                ? "text-[14px]"
                : "text-[16px]"
            } ${bold ? "font-medium" : ""} ${extraClass}`}
          >
            {label}
          </span>
          <span
            className={`${
              extra
                ? "text-[18px]"
                : large
                ? "text-[16px]"
                : small
                ? "text-[14px]"
                : "text-[16px]"
            } ${
              extra
                ? "font-[500]"
                : bold || large
                ? "font-[300]"
                : ""
            } ${valueClass ?? ""} ${extraClass}`}
          >            {typeof value === "number" ? `₹${value.toLocaleString()}` : value}
          </span>
        </div>
      );

export default function EventPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EventDetailsSkeleton />}>
      <EventPageContent params={params} />
    </Suspense>
  );
}
