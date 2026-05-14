import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { useState , useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingState from '../components/LoadingState';

const ShareHub = () => {
  const { userDetails } = useOutletContext();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (userDetails?.userId) {
      fetchVisits();
    }
  }, [userDetails]);

  const fetchVisits = async () => {
    try {
      const response = await fetch("/server/agenda_function/visits", {
        headers: {
          'x-user-id': userDetails.userId
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        setVisits(result.data);
      }
    } catch (error) {
      console.error("Error fetching visits for Share Hub:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/server/agenda_function/visits/${id}`, {
        method: "DELETE",
        headers: {
          'x-user-id': userDetails.userId
        }
      });
      const result = await response.json();
      if (result.status === "success") {
        setVisits((prev) => prev.filter((v) => v.ROWID !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting visit:", error);
    }
  };

  const copyToClipboard = (id) => {
    const url = `${window.location.origin}/#/share/${id}`;
    navigator.clipboard.writeText(url);
    // Simple alert for now, can be replaced with a toast later
    alert("Shareable link copied to clipboard!");
  };

  const shareViaEmail = (visit) => {
    const shareUrl = `${window.location.origin}/#/share/${visit.ROWID}`;
    const subject = encodeURIComponent(`Engagement Blueprint: ${visit.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the engagement blueprint for our upcoming visit: ${visit.title}.\n\nYou can access it here: ${shareUrl}\n\nBest regards,`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${subject}&body=${body}`, "_blank");
  };

  const filteredVisits = visits.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-display">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Share Hub</h1>
          <p className="text-slate-500 font-medium">Manage and distribute your live engagement blueprints.</p>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text"
            placeholder="Search by title or location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Fetching Active Briefing Links..." />
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">share_off</span>
          <h3 className="text-xl font-bold text-slate-400">No active links found</h3>
          <p className="text-slate-400 text-sm">Deploy an engagement blueprint to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredVisits.map((visit) => (
              <motion.div
                key={visit.ROWID}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Mode Accent Bar */}
                <div className={`h-1.5 w-full ${visit.mode === 'In-Person' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>

                <div className="p-7 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      visit.mode === 'In-Person' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {visit.mode || 'In-Person'}
                    </div>
                    <button 
                      onClick={() => setDeleteConfirm(visit.ROWID)}
                      className="size-9 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-8 flex-1">
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{visit.title}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px] text-primary/60">location_on</span>
                      <span className="truncate">{visit.location}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                    <Button 
                      className="bg-primary text-white font-black h-10 rounded-xl text-[11px] shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all font-display"
                      onClick={() => copyToClipboard(visit.ROWID)}
                    >
                      <span className="material-symbols-outlined text-sm mr-2">content_copy</span>
                      Copy Link
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-slate-200 text-slate-600 font-black h-10 rounded-xl text-[11px] hover:bg-slate-50 font-display"
                      onClick={() => shareViaEmail(visit)}
                    >
                      <span className="material-symbols-outlined text-sm mr-2">mail</span>
                      Email
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="mt-3 w-full text-slate-400 font-bold hover:text-primary hover:bg-blue-50/50 transition-all h-10 rounded-xl text-[11px] font-display"
                    onClick={() => window.open(`/#/share/${visit.ROWID}`, "_blank")}
                  >
                    <span className="material-symbols-outlined text-sm mr-2">visibility</span>
                    Preview Orchestration
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Deactivate Link?</h3>
              <p className="text-slate-500 font-medium text-sm mb-8">This will permanently remove the engagement blueprint and the live link will stop working.</p>
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-red-500 text-white font-bold h-12 rounded-xl"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Confirm Delete
                </Button>
                <Button 
                  variant="ghost"
                  className="flex-1 text-slate-500 font-bold h-12 rounded-xl bg-slate-50"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareHub;
