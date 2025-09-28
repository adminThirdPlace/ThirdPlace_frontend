import React from "react";
import { X } from "lucide-react";

interface UnderstandProps {
  /**
   * Callback that hides the component (e.g. toggles state in the parent)
   */
  onClose: () => void;
}

/**
 * A lightweight modal that shows Third Place’s “Before you pay” notice.
 *
 * This component is **client-side** only – keep it out of any RSC layer. Simply
 * render it conditionally when the user presses the **Continue** CTA.
 */
const Understand: React.FC<UnderstandProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur">
      {/* Card */}
      <div className="relative m-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg md:max-w-md">
        {/* X dismiss */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 transition hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Heading */}
        <h2 className="mb-4 text-center text-xl font-semibold">Before you pay</h2>

        {/* Bullet list */}
        <ul className="list-disc space-y-2 pl-4 text-[13px] leading-snug text-gray-900">
          <li>
            By continuing, you acknowledge that refunds will{" "}
            <span className="font-semibold">not</span> be issued after you’ve
            been selected for an experience.
          </li>
          <li>
            Completing this payment will give you the chance to be selected for
            a curated Third Place experience. If you’re not selected, you’ll
            receive a full <span className="font-semibold">REFUND</span> — no
            questions asked.
          </li>
          {/* <li>
            This payment <span className="font-semibold">includes</span> the
            cost of food or drinks for this experience.
          </li> */}
          <li>
            Once confirmed, your spot is final. Third Place does not tolerate
            last-minute cancellations, no-shows, or ghosting. It impacts the
            whole group.
          </li>
          <li>
            Please do <span className="font-semibold">NOT</span> pay if you
            can’t make it{" "}
            <span className="font-semibold">EXACTLY ON TIME.</span> Our
            experiences are sacred and authentic — treat them as such.
          </li>

          {/* ––– UPDATED COPY STARTS HERE ––– */}
          <li>
            You can invite a friend up to{" "}
            <span className="font-semibold">a day before the event</span> —
            just make sure they’re someone who values showing up, too.
          </li>
          <li>
            You can invite{" "}
            <span className="font-semibold">ONE FRIEND</span> per experience.
            They’ll need to{" "}
            <span className="font-semibold">BOOK AND PAY SEPARATELY</span> to
            confirm their spot. If they haven’t received a confirmation text
            yet, they’re not in — we’re still processing. Once confirmed,
            they’ll get all event details separately.
          </li>
          {/* ––– UPDATED COPY ENDS HERE ––– */}
        </ul>

        {/* CTA */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full cursor-pointer rounded-full bg-black py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          I UNDERSTAND
        </button>
      </div>
    </div>
  );
};

export default Understand;
