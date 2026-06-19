import React from 'react';
import { motion } from 'framer-motion';

export default function TrainTransition({ direction }) {
  const isMovingRight = direction === 'login';

  const trainVariants = {
    initial: { 
      x: isMovingRight ? '-120vw' : '120vw', 
      scaleX: isMovingRight ? 1 : -1 // Flips the emoji face to look backward during logout
    },
    animate: { 
      x: isMovingRight ? '120vw' : '-120vw', 
      transition: { 
        duration: 4.2, // Time taken to cross screen in seconds
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-slate-950/95 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-5xl h-32 flex items-center overflow-hidden">
        
        {/* 🚂 Train Sticker */}
        <motion.div
          variants={trainVariants}
          initial="initial"
          animate="animate"
          className="absolute text-7xl select-none"
        >
          🚂
        </motion.div>

        {/* 机制 Track UI Layout */}
        <div className="absolute bottom-4 w-full h-2 flex items-center justify-between border-t-4 border-b-4 border-dashed border-slate-700 select-none opacity-50">
          <div className="w-full h-[1px] bg-slate-600"></div>
        </div>

      </div>

      <h2 className="text-cyan-400 font-mono tracking-widest uppercase mt-6 text-xs sm:text-sm animate-pulse">
        {isMovingRight ? "Authenticating Session..." : "Terminating Session..."}
      </h2>
    </div>
  );
}