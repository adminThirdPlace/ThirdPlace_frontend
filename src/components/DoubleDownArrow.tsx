"use client";

import React from "react";
import { motion } from "framer-motion";

interface DoubleDownArrowProps {
  /** Callback fired when the arrow is clicked */
  onClick?: () => void;
}

const DoubleDownArrow: React.FC<DoubleDownArrowProps> = ({ onClick }) => (
  <motion.div
    /* ───────── visual & motion ───────── */
    className="flex justify-center items-center bg-black w-full mt-10 mb-10 cursor-pointer"
    animate={{ y: [0, 10, 0, -10, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    /* ───────── click → scroll ───────── */
    onClick={onClick}
  >
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="15,22 30,37 45,22"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="15,32 30,47 45,32"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </motion.div>
);

export default DoubleDownArrow;
