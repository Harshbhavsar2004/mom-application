import React, { useState, useEffect } from "react";
import { LogIn, UserPlus, Menu, X, Sparkles } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const login = () => {
    window.location.href = window.origin + "/__catalyst/auth/login";
  };

  const signup = () => {
    window.location.href = window.origin + "/__catalyst/auth/signup";
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass-nav h-20 shadow-lg" : "h-24 bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img src="./Fristine-Infotech-Website-Logo.png" alt="logo" className="w-16 h-10 object-contain" />
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              How it Works
            </a>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
              <button
                onClick={login}
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={signup}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-4 pb-8 space-y-4">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
            >
              Features
            </a>
            <a
              href="#workflow"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
            >
              How it Works
            </a>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 px-4">
              <button
                onClick={login}
                className="text-sm font-bold text-slate-700 py-3"
              >
                Login
              </button>
              <button
                onClick={signup}
                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
