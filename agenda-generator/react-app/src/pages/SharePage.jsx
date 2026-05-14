import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "../components/ui/button";
import { differenceInMinutes, parseISO, format } from "date-fns";

const SharePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isStarted, setIsStarted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [speaker, setSpeaker] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const savedSpeaker = localStorage.getItem(`speaker_session_${id}`);
    if (savedSpeaker) {
      setSpeaker(JSON.parse(savedSpeaker));
    }
  }, [id]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await fetch("/server/agenda_function/speaker/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });
      const result = await response.json();
      if (result.status === "success") {
        setSpeaker(result.data);
        localStorage.setItem(`speaker_session_${id}`, JSON.stringify(result.data));
        setShowLoginModal(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setSpeaker(null);
    localStorage.removeItem(`speaker_session_${id}`);
  };

  useEffect(() => {
    const tourCompleted = localStorage.getItem(`driver_tour_completed_${id}`);
    if (!tourCompleted && visit && !loading) {
      const driverObj = driver({
        showProgress: true,
        steps: [
          { 
            element: '#tour-hero', 
            popover: { 
              title: 'Welcome to Your Session!', 
              description: `This is your personalized briefing for "${visit.title}". Everything you need is organized right here.`,
              side: "bottom", 
              align: 'start' 
            } 
          },
          { 
            element: '#tour-agenda-card', 
            popover: { 
              title: 'Interactive Agenda', 
              description: 'This is your schedule. CLICK "Next" or the card itself to open the sidebar and see what\'s inside!',
              side: "top", 
              align: 'start',
              onNextClick: () => {
                document.getElementById('tour-agenda-card')?.click();
                setTimeout(() => {
                  driverObj.moveNext();
                }, 400);
              }
            } 
          },
          { 
            element: '#tour-sidebar-description', 
            popover: { 
              title: 'Session Details', 
              description: 'The sidebar reveals deep-dive information about each session, including goals and formatted instructions.',
              side: "left", 
              align: 'start',
              onNextClick: () => {
                setSelectedAgendaItem(null);
                setTimeout(() => {
                  driverObj.moveNext();
                }, 400); // Wait for sidebar close animation
              }
            } 
          },
          { 
            element: '#hosts', 
            popover: { 
              title: 'Your Experts', 
              description: 'These are the speakers who will be guiding your experience throughout the visit.',
              side: "top", 
              align: 'center',
              onBackClick: () => {
                document.getElementById('tour-agenda-card')?.click();
                setTimeout(() => {
                  driverObj.movePrevious();
                }, 400); // Wait for sidebar open animation
              }
            } 
          },
        ],
        onDestroyStarted: () => {
          localStorage.setItem(`driver_tour_completed_${id}`, 'true');
          driverObj.destroy();
        }
      });

      const timer = setTimeout(() => driverObj.drive(), 1500);
      return () => clearTimeout(timer);
    }
  }, [id, visit, loading]);

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const response = await fetch(`/server/agenda_function/visits/${id}`);
        const result = await response.json();
        if (result.status === "success") {
          const data = result.data;
          // Ensure agenda is parsed if it's a string
          if (typeof data.agenda === 'string') {
            data.agenda = JSON.parse(data.agenda);
          }
          if (typeof data.speakers === 'string') {
            data.speakers = JSON.parse(data.speakers);
          }
          setVisit(data);
          if (data.agenda) {
            const days = Object.keys(data.agenda).sort();
            if (days.length > 0) setActiveDay(days[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching shared visit:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisit();
  }, [id]);

  useEffect(() => {
    if (!visit?.startDate) return;

    const updateCountdown = () => {
      const start = new Date(visit.startDate).getTime();
      const now = new Date().getTime();
      const distance = start - now;

      if (distance <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsStarted(true);
        return;
      } else {
        setIsStarted(false);
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(interval);
  }, [visit?.startDate]);

  const daysList = useMemo(() => {
    return visit?.agenda ? Object.keys(visit.agenda).sort() : [];
  }, [visit?.agenda]);

  const formatDisplayAddress = (location) => {
    if (!location) return "";
    const parts = location.split(",").map(p => p.trim());
    if (parts.length < 3) return location;
    return parts.slice(-3).join(", ");
  };

  const currentAgendaList = useMemo(() => {
    return activeDay && visit?.agenda ? visit.agenda[activeDay] : [];
  }, [activeDay, visit?.agenda]);

  const navigateAgenda = (direction) => {
    if (!selectedAgendaItem || !currentAgendaList.length) return;
    const currentIndex = currentAgendaList.findIndex(item => item.id === selectedAgendaItem.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = currentAgendaList.length - 1;
    if (nextIndex >= currentAgendaList.length) nextIndex = 0;

    setSelectedAgendaItem(currentAgendaList[nextIndex]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f7f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 animate-spin rounded-full border-4 border-[#137fec] border-t-transparent"></div>
          <p className="font-bold text-slate-500 animate-pulse tracking-widest text-xs uppercase font-display">Initializing Experience...</p>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f7f8]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-sm">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">error</span>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Experience Not Found</h2>
          <p className="text-slate-500 font-medium mb-6">The briefing you're looking for might have expired or doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="w-full py-6 rounded-2xl">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-display text-slate-900 antialiased">
      <style>{`
        html {
            scroll-behavior: smooth;
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .description-content ul { list-style-type: disc; margin-left: 1.5rem; }
        .description-content ol { list-style-type: decimal; margin-left: 1.5rem; }
        .description-content h1 { font-size: 2rem; font-weight: bold; word-break: break-word; }
        .description-content h2 { font-size: 1.5rem; font-weight: bold; word-break: break-word; }
        .description-content p { margin-bottom: 0.5rem; word-break: break-word; }
        .description-content { word-break: break-word; overflow-wrap: break-word; }
      `}</style>

      {/* Sticky Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-[#137fec]/10 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="./Fristine-Infotech-Website-Logo.png" alt="Fristine Logo" className="h-10" />
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                Agenda
              </button>
              <button 
                onClick={() => document.getElementById('hosts')?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                Speakers
              </button>
              <button 
                onClick={() => document.getElementById('location')?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                Venue
              </button>
              {speaker && (
                <button 
                  onClick={() => navigate(`/speaker-data/${id}`)}
                  className="text-sm font-bold text-primary px-4 py-1.5 bg-primary/5 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-all"
                >
                  My Data
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              {speaker ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Speaker</p>
                    <p className="text-xs font-bold text-slate-900">{speaker.name}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                    title="Logout"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 py-12 md:py-20 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-xl min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-slate-900">
            <div 
              className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            
            <div className="relative z-10 flex flex-col items-center max-w-3xl">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-4 py-1.5 bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/30 rounded-full text-xs font-bold tracking-widest uppercase"
              >
                {isStarted ? "Visit In Progress" : "Upcoming Visit"}
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                id="tour-hero"
                className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight"
              >
                {visit.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-300 text-lg md:text-xl font-medium mb-12"
              >
                {visit.mode} Experience — {formatDisplayAddress(visit.location)}
              </motion.p>

              {/* Countdown Timer */}
              <div className="flex gap-3 md:gap-6">
                {[
                  { label: "Days", value: countdown.days },
                  { label: "Hours", value: countdown.hours },
                  { label: "Mins", value: countdown.minutes },
                  { label: "Secs", value: countdown.seconds }
                ].map((item, idx) => (
                  <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="glass-card w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-xl">
                      <span className="text-2xl md:text-3xl font-bold text-white">
                        {String(item.value).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Agenda Section */}
        <section className="px-6 py-12 max-w-7xl mx-auto" id="agenda">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div id="tour-agenda-header">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Visit Agenda</h2>
              <p className="text-slate-500 mt-2">Personalized schedule for your upcoming visit.</p>
            </div>
            
            <div className="flex bg-slate-200/50 p-1.5 rounded-full overflow-hidden">
              {daysList.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    activeDay === day 
                      ? "bg-white shadow-sm text-[#137fec]" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Day {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {activeDay && visit.agenda[activeDay]?.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedAgendaItem(item)}
                  id={idx === 0 ? "tour-agenda-card" : undefined}
                  className="group relative bg-white p-6 rounded-xl border border-slate-200 hover:border-[#137fec]/40 transition-all flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-slate-100 pr-6">
                    <span className="text-2xl font-black text-slate-900">{item.time?.split(" ")[0] || "--:--"}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.time?.split(" ")[1] || "AM"}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    </div>
                    <div 
                      className="text-slate-500 text-sm max-w-2xl line-clamp-2 description-content"
                      dangerouslySetInnerHTML={{ __html: item.description || "No description provided." }}
                    />
                  </div>
                  <div className="text-slate-300 group-hover:text-[#137fec] transition-colors">
                    <span className="material-symbols-outlined text-3xl">chevron_right</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Speakers Section */}
        <section className="px-6 py-20 bg-slate-100/50" id="hosts">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16" id="tour-hosts-header">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Your Hosts</h2>
              <p className="text-slate-500 mt-2">Meet the leadership team guiding your session.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(Array.isArray(visit.speakers) ? visit.speakers : []).map((speaker, idx) => (
                <motion.div 
                  key={speaker.ROWID || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  id={idx === 0 ? "tour-main-speaker" : undefined}
                  className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-xl transition-all"
                >
                  <div className="size-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#137fec]/10">
                    <img 
                      src={speaker.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=137fec&color=fff`} 
                      alt={speaker.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{speaker.name}</h4>
                  <p className="text-[#137fec] font-bold text-sm mb-1 uppercase tracking-wide">{speaker.role}</p>
                  <p className="text-slate-400 text-xs font-medium">{speaker.company || "Fristine Infotech"}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="px-6 py-20 max-w-7xl mx-auto" id="location">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4">The Venue</h2>
                <div className="bg-[#137fec]/5 p-6 rounded-xl border-l-4 border-[#137fec]">
                  <h3 className="text-xl font-bold text-slate-900">
                    {visit.location?.split("-")[0]?.split(",")[0] || "Executive Suites"}
                  </h3>
                  <p className="text-slate-500 mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#137fec] text-sm">location_on</span>
                    {visit.location}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.location)}`)}
                  className="flex items-center gap-2 px-8 py-3 bg-[#137fec] text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined">directions</span>
                  Get Directions
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="aspect-square bg-[#137fec]/5 rounded-xl overflow-hidden  group-hover:grayscale-0 transition-all duration-700">
                <iframe
                  title="Venue Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(visit.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium">Proprietary Secure Interface • © Fristine Infotech</p>
          <div className="flex items-center gap-6">
            <a className="text-xs font-bold text-slate-400 hover:text-[#137fec] uppercase tracking-widest" href="#">Privacy Policy</a>
            <a className="text-xs font-bold text-slate-400 hover:text-[#137fec] uppercase tracking-widest" href="#">Support</a>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[#137fec]">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-black uppercase">256-bit Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal for detail view */}
      <AnimatePresence>
        {selectedAgendaItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgendaItem(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative h-full w-full max-w-xl bg-white shadow-2xl ml-auto overflow-y-auto overflow-x-hidden flex flex-col"
            >
              {/* Branded Header */}
              <div className="bg-[#137FEC] px-6 py-5 sticky top-0 z-20 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => navigateAgenda(-1)}
                      className="size-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <button 
                      onClick={() => navigateAgenda(1)}
                      className="size-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                  <span className="text-sm font-bold tracking-[0.2em] uppercase opacity-90">Session Detail</span>
                </div>
                <button
                  onClick={() => setSelectedAgendaItem(null)}
                  className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#d22d6b] font-bold">close</span>
                </button>
              </div>
              
              <div className="p-8 md:p-10 flex-1 bg-white">
                {/* Title and Tags */}
                <div className="mb-8 min-w-0">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4 break-words">
                    {selectedAgendaItem.title}
                  </h2>
                </div>

                {/* Enhanced Metadata */}
                <div className="space-y-4 mb-10 border-b border-slate-100 pb-10">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                    <span className="text-sm font-medium">
                      {(() => {
                        if (!activeDay) return "";
                        try {
                          // Try to format if it's a real date
                          return format(parseISO(activeDay), 'EEE, MMM dd, yyyy');
                        } catch (e) {
                          // Otherwise capitalize and clean (e.g., day-1 -> Day 1)
                          return activeDay.charAt(0).toUpperCase() + activeDay.slice(1).replace("-", " ");
                        }
                      })()}, {selectedAgendaItem.time} (IST)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600">
                    <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0 mt-0.5">location_on</span>
                    <span className="text-sm font-medium break-words leading-relaxed">{visit.location || "Executive Suite"}</span>
                  </div>
                </div>

                {/* Speakers Section inside Sidebar */}
                <div className="mb-12">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    Speakers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(Array.isArray(visit.speakers) ? visit.speakers : []).slice(0, 4).map((speaker, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="size-12 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                          <img 
                            src={speaker.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=137fec&color=fff`} 
                            alt={speaker.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{speaker.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{speaker.role}</p>
                          <p className="text-xs text-slate-400 truncate">{speaker.company || "Fristine Infotech"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Content */}
                <div className="space-y-4 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    Description
                  </h3>
                  <section className="min-w-0" id="tour-sidebar-description">
                    <div 
                      className="description-content text-base leading-relaxed text-slate-700 font-medium break-words overflow-wrap-anywhere"
                      dangerouslySetInnerHTML={{ __html: selectedAgendaItem.description || "No description provided for this module." }}
                    />
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-primary text-white">
                <h3 className="text-2xl font-black mb-2">Speaker Portal</h3>
                <p className="text-white/80 text-sm font-medium">Please enter the credentials sent to your email to access your visit data.</p>
              </div>
              
              <form onSubmit={handleLogin} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">person</span>
                    <input 
                      type="text"
                      required
                      placeholder="Enter username"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">lock</span>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                  >
                    {loginLoading ? (
                      <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined">login</span>
                        Access Portal
                      </>
                    )}
                  </button>
                </div>
              </form>

              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharePage;
