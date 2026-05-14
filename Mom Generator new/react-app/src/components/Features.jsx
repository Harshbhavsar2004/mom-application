import React from 'react';
import { 
  Zap, 
  Clock, 
  FileText, 
  RefreshCcw, 
  MessageSquare, 
  Layout,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Record Meeting",
    description: "Connect your meeting or upload a recording. We support all major platforms.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  {
    number: "02",
    title: "Gemini AI Analysis",
    description: "Advanced AI models analyze your meeting to identify key speakers and topics.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  {
    number: "03",
    title: "Review & Edit",
    description: "Verify action items and summary with our intuitive editing interface.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  {
    number: "04",
    title: "Export to Sheets",
    description: "One click to generate a beautiful Google Sheet with all meeting data.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  }
];

const Features = () => {
  return (
    <section id="workflow" className="py-24 bg-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom duration-1000">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Simple 4-Step Workflow</h2>
          <p className="text-slate-600 font-medium">From chaos to clarity in minutes.</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group transition-all duration-300 hover:-translate-y-2">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-indigo-600 transition-colors h-full">
                <div className="text-indigo-600 font-bold mb-6 flex justify-between items-center leading-none">
                  <span className="text-sm uppercase tracking-widest text-slate-400">Step {step.number}</span>
                  <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 translate-y-[-50%] z-20">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
