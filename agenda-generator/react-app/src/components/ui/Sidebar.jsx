import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const Sidebar = ({ children, userDetails }) => {
  const location = useLocation();
  const visitId = new URLSearchParams(location.search).get('id');
  
  // Show secondary sidebar ONLY if path starts with /agenda
  const isAgendaSection = location.pathname.startsWith('/agenda');

  const handleLogout = () => {
    const redirectURL = window.location.origin + "/__catalyst/auth/login";
    window.catalyst.auth.signOut(redirectURL);
  };
  
  const isInstructor = true; 

  return (
    <div className="flex min-h-screen w-full bg-[#f6f7f8]">
      {/* TIER 1: Primary Navy Sidebar */}
      <aside className="primary-sidebar fixed inset-y-0 left-0">
        <div className="flex flex-col w-full h-full">
          <div className="h-16 flex items-center justify-center mb-2">
            <div className="size-10 bg-primary rounded flex items-center justify-center text-white shadow-lg">
               <span className="material-symbols-outlined text-[24px]">view_quilt</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <NavLink to="/" className={({ isActive }) => `primary-nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon material-symbols-outlined">home</span>
              <span className="label">Home</span>
            </NavLink>

            <NavLink to={`/agenda${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `primary-nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon material-symbols-outlined">calendar_month</span>
              <span className="label">Agenda</span>
            </NavLink>

            <NavLink to="/speakers" className={({ isActive }) => `primary-nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon material-symbols-outlined">groups</span>
              <span className="label">Speakers</span>
            </NavLink>

            <NavLink to="/share/hub" className={({ isActive }) => `primary-nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon material-symbols-outlined">share</span>
              <span className="label">Share</span>
            </NavLink>
          </div>

          <div className="mt-auto mb-6 flex flex-col items-center gap-4">
            <button 
              onClick={handleLogout}
              className="p-3 text-white/30 hover:text-red-400 transition-colors group relative"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
             <div className="size-10 flex items-center justify-center font-bold text-white/40 text-[12px] bg-white/5 rounded-full border border-white/10 uppercase">
                {userDetails?.firstName?.charAt(0)}{userDetails?.lastName?.charAt(0)}
             </div>
          </div>
        </div>
      </aside>

      {/* TIER 2: Secondary White Sidebar - Conditional */}
      <aside 
        className={`fixed inset-y-0 left-20 z-40 secondary-sidebar ${
          isAgendaSection ? 'translate-x-0 opacity-100 shadow-xl' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-6 h-16 flex items-center border-b border-slate-300 shrink-0">
          <span className="font-bold text-slate-800 tracking-tight text-base uppercase">Briefing Engine</span>
        </div>

        <nav className="flex-1 overflow-y-auto pt-6">
          <div className="mb-8">
            <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Core Blueprint</p>
            <div className="flex flex-col">
              <NavLink to={`/agenda/details${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `console-nav-item ${isActive ? 'active' : ''}`}>
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Visit Details</span>
              </NavLink>
              <NavLink to={`/agenda/info${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `console-nav-item ${isActive ? 'active' : ''}`}>
                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                <span>Agenda Information</span>
              </NavLink>
              <NavLink to={`/agenda/speakers${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `console-nav-item ${isActive ? 'active' : ''}`}>
                <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
                <span>Speakers</span>
              </NavLink>
            </div>
          </div>

          {isInstructor && (
            <>
              <div className="mb-8">
                <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Internal Deliverables</p>
                <div className="flex flex-col">
                  <NavLink to={`/agenda/assets${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `console-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="material-symbols-outlined text-[20px]">school</span>
                    <span>Speaker Assets</span>
                    <span className="ml-auto text-[9px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20">SPEAKER</span>
                  </NavLink>
                </div>
              </div>

              <div className="mb-8">
                <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Publish Link</p>
                <div className="flex flex-col">
                  <NavLink to={`/agenda/review${visitId ? `?id=${visitId}` : ''}`} className={({ isActive }) => `console-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                    <span>Verification</span>
                  </NavLink>
                </div>
              </div>
            </>
          )}
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          isAgendaSection ? 'ml-[21rem]' : 'ml-20'
        }`}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
