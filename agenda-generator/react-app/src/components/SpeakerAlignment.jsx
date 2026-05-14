import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from "./ui/button";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import LoadingState from './LoadingState';

const STRATUS_BASE_URL = "https://profile-pictures-development.zohostratus.in";

const SpeakerAlignment = ({ visitData, onUpdate, onBack, onNext }) => {
  const { userDetails } = useOutletContext();
  const speakers = visitData.speakers || [];
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (userDetails?.userId) {
      fetchAvailableSpeakers();
    }
  }, [userDetails]);

  const fetchAvailableSpeakers = async () => {
    try {
      const response = await fetch('/server/agenda_function/speakers', {
        headers: {
          'x-user-id': userDetails.userId
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAvailableSpeakers(result.data);
      }
    } catch (error) {
      console.error("Error fetching available speakers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STRATUS_BASE_URL}/${url}`;
  };

  const handleSelectSpeaker = (speaker) => {
    if (speakers.find(s => s.ROWID === speaker.ROWID)) {
      setShowDropdown(false);
      return;
    }
    const updatedSpeakers = [...speakers, { ...speaker, status: "Contributor" }];
    onUpdate({ ...visitData, speakers: updatedSpeakers });
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleDeleteSpeaker = (id) => {
    const updatedSpeakers = speakers.filter(s => s.ROWID !== id);
    onUpdate({ ...visitData, speakers: updatedSpeakers });
  };

  const handleReorder = (newOrder) => {
    onUpdate({ ...visitData, speakers: newOrder });
  };

  const filteredSpeakers = availableSpeakers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="console-card">
      <div className="p-8 border-b border-slate-300 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Expert Alignment</h3>
          <p className="text-sm text-slate-500 font-medium">Coordinate specialized speakers from the global registry.</p>
        </div>
        <div className="relative">
           <div className="flex gap-4">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input 
                  className="h-10 pl-10 pr-4 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-64 font-medium"
                  placeholder="Find Expert by Name or Role..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>
           </div>
           
           <AnimatePresence>
            {showDropdown && (searchTerm || showDropdown) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Registry</span>
                  <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                {filteredSpeakers.length > 0 ? filteredSpeakers.map(speaker => (
                  <div 
                    key={speaker.ROWID} 
                    className="p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                    onClick={() => handleSelectSpeaker(speaker)}
                  >
                    {speaker.imageUrl ? (
                      <img src={getImageUrl(speaker.imageUrl)} className="size-10 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                        {speaker.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{speaker.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{speaker.role}</p>
                    </div>
                    {speakers.find(s => s.ROWID === speaker.ROWID) && (
                      <span className="ml-auto material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                    )}
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No Experts Found</p>
                  </div>
                )}
              </motion.div>
            )}
           </AnimatePresence>
        </div>
      </div>

      <div className="p-10 min-h-[400px]">
        {loading ? (
          <LoadingState message="Querying Expert Registry..." />
        ) : (
          <>
            <Reorder.Group axis="y" values={speakers} onReorder={handleReorder} className="space-y-4">
              <AnimatePresence>
                {speakers.map((speaker) => (
                  <Reorder.Item 
                    key={speaker.ROWID} 
                    value={speaker}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-5 rounded-2xl border border-slate-200 flex items-center gap-5 bg-white hover:border-primary/30 transition-colors shadow-sm cursor-grab active:cursor-grabbing group relative"
                  >
                     <div className="text-slate-300 group-hover:text-primary/50 transition-colors">
                        <span className="material-symbols-outlined">drag_indicator</span>
                     </div>
                     <div className="size-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                        {speaker.imageUrl ? (
                          <img src={getImageUrl(speaker.imageUrl)} className="size-full object-cover" alt="" />
                        ) : (
                          <div className="size-full bg-slate-50 flex items-center justify-center text-slate-500 font-black text-lg">
                            {speaker.name[0]}
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-black text-slate-800 truncate leading-tight mb-1">{speaker.name}</h4>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider truncate">{speaker.role}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-[0.1em]">{speaker.status}</span>
                          <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-[0.1em]">Session Lead</span>
                        </div>
                     </div>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                       onClick={() => handleDeleteSpeaker(speaker.ROWID)}
                     >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                     </Button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
    
            {speakers.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center text-slate-400 h-[200px] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl"
              >
                <span className="material-symbols-outlined text-5xl mb-3 opacity-20">person_search</span>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Assign Experts to this Briefing</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      <div className="p-8 bg-slate-50/80 border-t border-slate-200 flex justify-between items-center rounded-b-lg">
         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2">Total Experts assigned: {speakers.length}</p>
         <div className="flex gap-3">
           <Button variant="ghost" className="font-black text-slate-500 text-xs h-10 px-8 rounded-lg" onClick={onBack}>Back</Button>
           <Button className="bg-primary hover:bg-primary/90 text-white font-black text-xs h-10 px-10 rounded-lg shadow-lg shadow-primary/20 transition-all font-poppins" onClick={onNext}>
             Provision Assets
           </Button>
         </div>
      </div>
    </div>
  );
};

export default SpeakerAlignment;

