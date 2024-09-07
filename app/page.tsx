"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import Link from "next/link"; // Import Link from Next.js

export default function Component() {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTitle(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {" "}
      {/* Add 'relative' to the parent */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900 to-black opacity-50" />
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute"
      >
        <Flame className="w-32 h-32 text-red-600" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showTitle ? 1 : 0, y: showTitle ? 0 : 20 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-6xl md:text-8xl font-bold text-red-600 tracking-wider z-10 text-center"
      >
        Welcome to Hell
      </motion.h1>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900 to-transparent" />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        {" "}
        {/* Center button horizontally */}
        <Link href="/pages/level-1">
          {" "}
          {/* Update with your desired page path */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showTitle ? 1 : 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Enter if you dare
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
