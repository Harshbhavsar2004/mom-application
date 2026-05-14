import { useOutletContext } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ConnectionSection from "./ConnectionSection.jsx";
import MeetingsSection from "./meetingsection";
import RecordingsSection from "./RecordingSection";
import { gsap } from "gsap";
import { 
  CheckCircle2, 
  XCircle, 
  LayoutDashboard, 
  Settings2, 
  X, 
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const { userDetails } = useOutletContext();
  const userId = userDetails?.userId;

  const [zohoConnected, setZohoConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [zohoExpiresAt, setZohoExpiresAt] = useState(null);
  const [googleExpiresAt, setGoogleExpiresAt] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [triggerMeetings, setTriggerMeetings] = useState(false);
  const [triggerRecordings, setTriggerRecordings] = useState(false);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const containerRef = useRef(null);
  const sidebarRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const checkConnections = async () => {
      setCheckingConnection(true);
      try {
        const [zohoRes, googleRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_BASE_URL}/checkConnection?user_id=${userId}`),
          fetch(`${process.env.REACT_APP_API_BASE_URL}/check-google-connection?user_id=${userId}`)
        ]);

        const zohoData = await zohoRes.json();
        const googleData = await googleRes.json();

        setZohoConnected(zohoData.connected);
        setZohoExpiresAt(zohoData.expires_at || null);
        setGoogleConnected(googleData.connected);
        setGoogleExpiresAt(googleData.expiry_date || null);

        if (zohoData.connected) {
          setTimeout(() => setTriggerMeetings(true), 600);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnections();
  }, [userId]);

  // Initial Content Stagger
  useEffect(() => {
    if (!checkingConnection) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [checkingConnection]);

  // Sidebar Animation
  useEffect(() => {
    if (isSidebarOpen) {
      gsap.to(backdropRef.current, { opacity: 1, display: "block", duration: 0.3 });
      gsap.to(sidebarRef.current, { x: 0, duration: 0.5, ease: "power4.out" });
    } else {
      gsap.to(backdropRef.current, { opacity: 0, display: "none", duration: 0.3 });
      gsap.to(sidebarRef.current, { x: "100%", duration: 0.4, ease: "power4.in" });
    }
  }, [isSidebarOpen]);

  const formatExpiration = (ts) => {
    if (!ts) return "";
    const date = new Date(parseInt(ts));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = () => {
    if (zohoConnected && googleConnected) return "bg-emerald-500 text-white shadow-emerald-100";
    if (zohoConnected || googleConnected) return "bg-indigo-600 text-white shadow-indigo-100";
    return "bg-slate-100 text-slate-400 border-slate-200";
  };

  if (checkingConnection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-slate-50/50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Checking Bridges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 py-6">
        {/* 1. Welcome Section & Connections Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, {userDetails?.firstName || 'Harshal'}
              </h1>
              <p className="text-slate-500 text-sm sm:text-base font-medium">Manage your meetings and cloud recordings effortlessly.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl border border-transparent ${getStatusColor()}`}
          >
            <Settings2 size={16} />
            {zohoConnected && googleConnected ? "Fully Connected" : zohoConnected || googleConnected ? "Partial Bridge Active" : "Connect Services"}
            <ChevronRight size={14} className="ml-1 opacity-50" />
          </button>
        </div>

        {/* 2. Divider / Stats (Optional, keeps layout balanced) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 md:px-0">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Zap size={20}/></div>
                <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Zoho Status</h3>
                    <p className={`text-sm font-black ${zohoConnected ? 'text-emerald-600' : 'text-slate-400'}`}>{zohoConnected ? 'Active' : 'Offline'}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={20}/></div>
                <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Google Status</h3>
                    <p className={`text-sm font-black ${googleConnected ? 'text-emerald-600' : 'text-slate-400'}`}>{googleConnected ? 'Active' : 'Offline'}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><LayoutDashboard size={20}/></div>
                <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Workspace</h3>
                    <p className="text-sm font-black text-slate-900">Standard</p>
                </div>
            </div>
        </div>

        {/* 3. Meetings & Recordings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-4 md:px-0 pb-12">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm">
            <MeetingsSection
              userId={userId}
              connected={zohoConnected}
              trigger={triggerMeetings}
              onComplete={() => setTimeout(() => setTriggerRecordings(true), 800)}
            />
          </div>

          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm">
            <RecordingsSection
              userId={userId}
              connected={zohoConnected}
              trigger={triggerRecordings}
            />
          </div>
        </div>
      </div>

      {/* --- SIDEBAR (DRAWER) --- */}
      <div 
        ref={backdropRef}
        onClick={() => setIsSidebarOpen(false)}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 hidden opacity-0"
      />
      
      <div 
        ref={sidebarRef}
        style={{ transform: "translateX(100%)" }}
        className="fixed top-0 right-0 w-full max-w-[400px] h-full bg-white z-50 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Settings2 size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Connections</h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integration Hub</p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Bridge your favorite apps to unlock advanced transcription and storage capabilities.
                </p>
            </div>

            <div className="p-1 bg-slate-50/50 rounded-[32px] border border-slate-100">
                <ConnectionSection
                    userId={userId}
                    zohoConnected={zohoConnected}
                    googleConnected={googleConnected}
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Session Integrity</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl border ${zohoConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {zohoConnected ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900">Zoho Sessions</p>
                                {zohoConnected && zohoExpiresAt && (
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Renews at: <span className="text-indigo-600">{formatExpiration(zohoExpiresAt)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl border ${googleConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {googleConnected ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900">Google Drive</p>
                                {googleConnected && googleExpiresAt && (
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Validated until: <span className="text-emerald-600">{formatExpiration(googleExpiresAt)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
}
