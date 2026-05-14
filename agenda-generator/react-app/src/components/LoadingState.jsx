import React from 'react';
import { motion } from 'framer-motion';

const LoadingState = ({ message = "Synchronizing Data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full h-full min-h-[400px]">
      <div className="relative size-24">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-slate-100 border-t-primary rounded-full"
        />
        
        {/* Inner Pulsing Circle */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-4 bg-primary/20 rounded-full flex items-center justify-center shadow-lg shadow-primary/10"
        >
           <span className="material-symbols-outlined text-primary text-2xl animate-pulse">cloud_sync</span>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center"
      >
        <h3 className="text-slate-800 font-black text-lg tracking-tight">{message}</h3>
        <div className="flex items-center justify-center gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="size-1.5 bg-primary rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Glassmorphic decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-30">
        <div className="absolute -top-24 -left-24 size-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 size-96 bg-blue-400/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default LoadingState;
