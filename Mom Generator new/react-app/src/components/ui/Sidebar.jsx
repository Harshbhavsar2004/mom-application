import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Menu,
  X,
  SheetIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  FolderSyncIcon,
  User,
  Home,
  Bell,
  Command,
  FileSpreadsheet,
  Video,
  Table2,
  Shield,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import UserProfile from "./UserProfile";
import { gsap } from "gsap";
import api from "../../services/api";

export const Sidebar = ({ children, userDetails }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    nav: [],
    recordings: [],
    templates: [],
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const menuItemsRef = useRef([]);

  const currentPage = location.pathname.replace("/", "") || "dashboard";

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      id: "createmeeting",
      label: "Create Meeting",
      icon: Video,
      path: "/create-meeting",
    },
    {
      id: "momsheet",
      label: "Minutes Generator",
      icon: SheetIcon,
      path: "/minutes-generator",
    },
    {
      id: "syncpage",
      label: "Synchronization",
      icon: FolderSyncIcon,
      path: "/sync",
    },
    { id: "participants", label: "Participants", icon: User, path: "/teams" },
    {
      id: "google-sheets",
      label: "Google Sheets",
      icon: FileSpreadsheet,
      path: "/google-sheets",
    },
  ];

useEffect(() => {
  // ❗ Don't apply GSAP transform on mobile
  if (window.innerWidth < 768) return;

  gsap.fromTo(
    sidebarRef.current,
    { x: -100, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "transform" // 🔥 Important
    }
  );

  gsap.fromTo(
    menuItemsRef.current,
    { x: -20, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.3,
      clearProps: "transform"
    }
  );
}, []);

  // Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ nav: [], recordings: [], templates: [] });
      return;
    }

    const q = searchQuery.toLowerCase();

    // 1. Filter Navigation
    const navHits = menuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );

    // 2. Fetch/Filter Recordings (Debounced or cached would be better, but simple for now)
    const performSearch = async () => {
      try {
        const localRecs = await api.getStoredRecordings(userDetails?.userId);
        const recHits = localRecs
          .filter((r) => r.topic.toLowerCase().includes(q))
          .slice(0, 5);

        setSearchResults({
          nav: navHits,
          recordings: recHits,
          templates: [],
        });
      } catch (err) {
        console.error("Global Search Error:", err);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, userDetails?.userId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    const redirectURL = window.location.origin + "/__catalyst/auth/login";
    window.catalyst.auth.signOut(redirectURL);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 text-indigo-600 active:scale-90 transition-transform"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={`
          ${isCollapsed ? "w-20" : "w-72"}
          bg-[#1e1b4b] border-r border-white/5 h-screen flex flex-col
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          fixed md:relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.1)]
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-4 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white p-1.5 shadow-xl shadow-indigo-500/20">
              <img
                src="./Fristine-Infotech-Website-Logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap animate-in slide-in-from-left-4 duration-500">
                <span className="text-lg font-black text-white tracking-tight">
                  Fristine
                </span>
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                  Infotech
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto p-2 rounded-xl hover:bg-white/10 text-indigo-300 transition-all active:scale-90 hidden md:flex"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                ref={(el) => (menuItemsRef.current[index] = el)}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "text-indigo-200/60 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`${isActive ? "text-white" : "group-hover:text-indigo-300"} transition-colors`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-bold tracking-wide">
                    {item.label}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
              bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white
              transition-all duration-300 group font-bold text-sm
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Modern Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
          <div className="flex-1 flex items-center max-w-2xl relative ml-12 md:ml-0">
            <div className="relative w-full group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                <Search size={18} />
                <div className="h-4 w-[1px] bg-slate-200 group-focus-within:bg-indigo-200 mx-1 hidden sm:block" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-slate-100/50 border border-transparent rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-10 sm:right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X size={14} />
                </button>
              )}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm pointer-events-none opacity-60">
                <Command size={12} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-500">K</span>
              </div>
            </div>

            {/* Global Search Results Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-2xl border border-white rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-slate-200/50">
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-6">
                  {/* Navigation Hits */}
                  {searchResults.nav.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Platform Tools
                      </h4>
                      <div className="space-y-1">
                        {searchResults.nav.map((nav) => (
                          <button
                            key={nav.id}
                            onClick={() => {
                              handleNavigate(nav.path);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
                          >
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {React.createElement(nav.icon, { size: 18 })}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-slate-800">
                                {nav.label}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Navigate to {nav.id}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recording Hits */}
                  {searchResults.recordings.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Meeting Recordings
                      </h4>
                      <div className="space-y-1">
                        {searchResults.recordings.map((rec) => (
                          <button
                            key={rec.erecordingId}
                            onClick={() => {
                              handleNavigate("/minutes-generator");
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group"
                          >
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              <div className="w-2 h-2 rounded-full bg-current" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-slate-800">
                                {rec.topic}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {rec.sDate} • {rec.durationInMins}m
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {searchResults.nav.length === 0 &&
                    searchResults.recordings.length === 0 && ( // Removed searchResults.templates from condition
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Search size={32} className="mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">
                          No results found for "{searchQuery}"
                        </p>
                      </div>
                    )}
                </div>
                <div className="bg-slate-50/80 p-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 bg-white border border-slate-200 rounded text-[10px] font-black shadow-sm">
                        ESC
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        to close
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    Instant Search Engine
                  </p>
                </div>
              </div>
            )}
            {/* Click outside to close (Alternative to simple state) */}
            {isSearchFocused && (
              <div
                className="fixed inset-0 z-[-1] cursor-default"
                onClick={() => setIsSearchFocused(false)}
              />
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4 sm:ml-8">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative hidden xs:block">
              <Bell size={20} />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            <div
              className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group"
              onClick={() => setShowProfile(true)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                  {userDetails?.firstName || "User"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {userDetails?.lastName || "Member"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                {userDetails?.firstName?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50">
          <div className="p-4 sm:p-8 pb-20">{children}</div>
        </main>
      </div>

      {showProfile && (
        <UserProfile user={userDetails} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Sidebar;
