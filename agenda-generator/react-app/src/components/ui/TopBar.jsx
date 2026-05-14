import React from "react";

export const TopBar = ({ userDetails }) => {
  return (
    <header className="bg-white border-b border-slate-300 h-16 sticky top-0 z-30">
      <div className="flex items-center justify-between h-full">
        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl px-12">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search services, components or visits..."
              className="w-full bg-slate-50 border border-slate-300 rounded py-2 pl-12 pr-12 text-[13px] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary/50 transition-all font-medium shadow-sm"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-slate-500 border border-slate-300 px-1.5 py-0.5 rounded bg-white">
                Ctrl
              </span>
              <span className="text-[10px] font-bold text-slate-500 border border-slate-300 px-1.5 py-0.5 rounded bg-white">
                K
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border-l border-slate-300 ml-2 pl-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-all">
              <span className="material-symbols-outlined text-[20px]">
                settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
