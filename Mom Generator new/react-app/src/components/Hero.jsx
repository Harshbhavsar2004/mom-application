import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out"
      });
      
      gsap.from(".hero-desc", {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out"
      });

      gsap.from(".hero-btns", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out"
      });
      
      gsap.from(".hero-mockup", {
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        delay: 0.5,
        ease: "elastic.out(1, 0.75)"
      });
    }, heroRef);
    
    return () => ctx.revert();
  }, []);

  const signup = () => {
    window.location.href = window.origin + "/__catalyst/auth/signup" ;
  };

  const login = () => {
    window.location.href = window.origin + "/__catalyst/auth/login";
  };

  return (
    <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-indigo-50/50 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Powered by Gemini AI</span>
            </div>
            
            <h1 className="hero-title text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Transform Meetings into <span className="gradient-text bg-gradient-to-r from-indigo-600 to-slate-900 bg-clip-text text-transparent">Intelligent Action.</span>
            </h1>
            
            <p className="hero-desc text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              The professional tool for generating Minutes of Meeting. Automate your workflow from recording to beautiful Google Sheets.
            </p>
            
            <div className="hero-btns flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={signup}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
              >
                Start Generating
              </button>
              <button 
                onClick={login}
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
              >
                Existing User? Login
              </button>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="flex-1 relative w-full max-w-xl hero-mockup">
            <div className="relative z-10 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-float bg-white">
              {/* Google Sheets Mockup / Professional Meeting Image */}
              <img 
                alt="Professional meeting collaboration for MoM generation" 
                className="w-full h-auto" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdekqd7pUGzEfo26sSwmeJiowXOkW_aGyXv5flF2q4qIf_ZYrcQa5JZlrtJyFh661xJEgaGwaCx5a_mCooFX65GzbAMrq2AZ-R3RGWMNDSJi54o1Vi57uvjqvy2WTl0cRFJ4rHu-_9yvfnaCj1JMdSlv9u5DF400KLI7FFcfx-DkkUC9oW3wEPIUTWsvl6WYklrJ3NPcyG8lpsnfJt0Kwdk2-plpa2Wz8rSsejEkPnpbIQ17smwOqNKT2IbvArxnpQaw-E-GV9_RyM"
              />
            </div>
            {/* Decorative UI Elements */}
            <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Analysis Complete</p>
                  <p className="text-[10px] text-slate-400">4 Action Items Identified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
