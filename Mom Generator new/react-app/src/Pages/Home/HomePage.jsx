import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, CloudSync, BrainCircuit, FileSpreadsheet, ArrowRight, Play } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.catalyst.auth
      .isUserAuthenticated()
      .then(() => navigate("/dashboard"))
      .catch(() => console.log("User not authenticated"));
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = window.origin + "/__catalyst/auth/login";
  };

  const handleSignup = () => {
    window.location.href = window.origin + "/__catalyst/auth/signup";
  };

  return (
    <div className="bg-slate-50 text-slate-900 antialiased font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="./Fristine-Infotech-Website-Logo.png" alt="logo" className="w-52 h-8 object-fill" />
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center space-x-8 mr-4">
                <a className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors" href="#workflow">Workflow</a>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleLogin} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600">
                  Log in
                </button>
                <button onClick={handleSignup} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-40">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-indigo-100/40 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
                Your Meetings, <br />
                <span className="text-indigo-600">Documented</span> by AI.
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Stop manual note-taking. Sync your Zoho Meetings and let our AI generate professional Minutes of Meeting directly to Google Sheets.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button onClick={handleLogin} className="group px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2">
                  Start Generating
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="relative z-10 p-2 bg-white/50 backdrop-blur-sm rounded-3xl border border-white shadow-2xl">
                <img
                  alt="App Dashboard Preview"
                  className="rounded-2xl shadow-sm w-full"
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-4 animate-bounce-slow">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileSpreadsheet className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Sheet Generated</p>
                  <p className="text-sm font-bold text-slate-800">Weekly Sync MoM.xlsx</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 relative overflow-hidden" id="workflow">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-bold tracking-wider text-sm uppercase mb-4">The Process</h2>
            <h3 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">Seamless Automation in 4 Steps</h3>
            <p className="text-slate-500 text-lg">Our pipeline handles the heavy lifting so you can focus on the conversation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Horizontal Line for Desktop */}
            <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 -z-0"></div>
            
            <WorkflowCard
              step="1"
              title="Secure OAuth"
              desc="Connect Zoho and Google Workspace with enterprise-grade security."
              icon={<ShieldCheck className="w-6 h-6" />}
            />
            <WorkflowCard
              step="2"
              title="Sync Audio"
              desc="Automatic fetching of meeting recordings and transcripts."
              icon={<CloudSync className="w-6 h-6" />}
            />
            <WorkflowCard
              step="3"
              title="Gemini Analysis"
              desc="AI extracts tasks, decisions, and summaries in seconds."
              icon={<BrainCircuit className="w-6 h-6" />}
            />
            <WorkflowCard
              step="4"
              title="Smart Export"
              desc="Populates formatted Google Sheets for your entire team."
              icon={<FileSpreadsheet className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-6">
                <img src="./Fristine-Infotech-Website-Logo.png" alt="logo" className="w-40 h-8 object-fill" />
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                Empowering modern teams with AI-driven documentation and seamless workflow integration.
              </p>
              <div className="flex gap-4">
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-indigo-600">Privacy Policy</Link>
                <Link to="/terms" className="text-sm text-slate-400 hover:text-indigo-600">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">© 2026 MOM application by Fristine Infotech.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WorkflowCard = ({ step, title, desc, icon }) => {
  return (
    <div className="relative flex flex-col items-center lg:items-start group z-10">
      <div className="mb-6 flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-indigo-100 transition-all duration-300">
        {icon}
      </div>
      <div className="text-center lg:text-left bg-white lg:bg-transparent p-6 lg:p-0 rounded-2xl shadow-xl shadow-slate-200/50 lg:shadow-none border border-slate-100 lg:border-none">
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">Step {step}</span>
        <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
};

export default HomePage;