import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AppLoader({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;
    const interval = setInterval(() => {
      value += Math.random() * 15;
      if (value >= 100) {
        value = 100;
        clearInterval(interval);
        setTimeout(() => {
          onFinish();
        }, 500);
      }
      setProgress(value);
    }, 180);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fcfdfe] relative overflow-hidden font-display">
      {/* Subtle organic background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px] animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8">
        {/* Brand Identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center space-y-8"
        >
          <img
            src="./Fristine-Infotech-Website-Logo.png"
            alt="Logo"
            className="h-16 object-contain mb-2"
          />
          
        </motion.div>

        {/* Professional Minimalist Loader */}
        <div className="w-full mt-16 space-y-4">
          <div className="h-[2px] w-full bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute left-0 top-0 h-full bg-blue-600"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            ></motion.div>
          </div>
          
          <div className="flex justify-between items-center px-1">
            <motion.span 
              key={Math.floor(progress / 25)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
            >
              {progress < 30 ? "Initializing Environment..." : 
               progress < 60 ? "Syncing Global Assets..." : 
               progress < 90 ? "Architecting Workspace..." : "Finalizing Secure Link..."}
            </motion.span>
            <span className="text-[10px] font-black text-slate-700 tabular-nums">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>

        {/* Bottom Metadata */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2">
            <div className="size-1 bg-blue-500 rounded-full animate-ping"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
