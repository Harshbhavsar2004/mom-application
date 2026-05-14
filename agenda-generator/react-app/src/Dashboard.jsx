import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from "./components/ui/button";
import { useState , useEffect } from 'react';
import LoadingState from './components/LoadingState';
const Dashboard = () => {
  const { userDetails } = useOutletContext();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userDetails?.userId) {
      fetchVisits();
    }
  }, [userDetails]);

  const fetchVisits = async () => {
    try {
      const response = await fetch('/server/agenda_function/visits', {
        headers: {
          'x-user-id': userDetails.userId
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setVisits(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this engagement blueprint?')) return;
    
    try {
      const response = await fetch(`/server/agenda_function/visits/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.status === 'success') {
        setVisits(visits.filter(v => v.ROWID !== id));
      } else {
        alert('Error deleting visit: ' + result.message);
      }
    } catch (err) {
      console.error('Error deleting visit:', err);
      alert('Network error while deleting visit');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Briefing Management</h2>
          <p className="text-sm text-slate-500 font-medium">Coordinate and track all active client engagements.</p>
        </div>
        <Button 
          className="bg-primary text-white font-bold h-10 px-6 rounded shadow-md hover:opacity-90 transition-all font-poppins"
          onClick={() => navigate('/agenda/details')}
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Initialize New Visit
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Synchronizing Briefing Data..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visits.map((visit) => (
            <div 
              key={visit.ROWID} 
              className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col overflow-hidden"
              onClick={() => navigate(`/agenda/details?id=${visit.ROWID}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Card Accent Bar */}
              <div className={`h-1.5 w-full ${visit.mode === 'In-Person' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
              
              <div className="p-7 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    visit.mode === 'In-Person' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {visit.mode}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    onClick={(e) => handleDeleteVisit(e, visit.ROWID)}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </Button>
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {visit.title}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium line-clamp-1 italic">
                    {visit.objective || "No objective defined for this orchestration."}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Schedule</p>
                    <div className="flex items-center text-xs text-slate-600 font-bold">
                      <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">calendar_today</span>
                      {new Date(visit.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Environment</p>
                    <div className="flex items-center text-xs text-slate-600 font-bold truncate">
                      <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">location_on</span>
                      {visit.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {visits.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-6">
               <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-200">
                  <span className="material-symbols-outlined text-4xl">inventory_2</span>
               </div>
               <div className="text-center">
                  <h4 className="text-xl font-black text-slate-800 tracking-tight">Empty Orchestration Hub</h4>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">Your briefing portfolio is currently empty. Initialize a new technical engagement to begin.</p>
               </div>
               <Button 
                className="bg-primary text-white font-black h-11 px-10 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all font-display"
                onClick={() => navigate('/agenda/details')}
              >
                Launch First Briefing
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
