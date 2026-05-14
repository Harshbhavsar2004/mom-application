import React from 'react';
import { Sparkles, Twitter, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <span className="text-lg font-bold">MoM Generator</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Transforming meetings into intelligent action.</p>
          <p className="text-slate-500 text-sm">© 2024 MoM Generator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
