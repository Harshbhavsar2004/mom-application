import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext, useSearchParams } from 'react-router-dom';
import { Button } from "../components/ui/button";

import VisitCoreParameters from '../components/VisitCoreParameters';
import AgendaArchitecture from '../components/AgendaArchitecture';

import SpeakerAlignment from '../components/SpeakerAlignment';
import AssetProvisioning from '../components/AssetProvisioning';

import LoadingState from '../components/LoadingState';

const CreateClientVisit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { userDetails } = useOutletContext();
  
  const visitIdParam = searchParams.get('id');
  const visitId = (visitIdParam === 'null' || visitIdParam === 'undefined') ? null : visitIdParam;

  const [visitData, setVisitData] = useState({
    title: "",
    mode: "In-Person",
    startDate: new Date(),
    endDate: new Date(),
    location: "",
    objective: "",
    agenda: {},
    speakers: [],
    assets: []
  });

  const [isLoading, setIsLoading] = useState(!!visitId);

  useEffect(() => {
    if (visitId) {
      setIsLoading(true);
      fetchVisit();
    }
  }, [visitId]);

  const fetchVisit = async () => {
    try {
      const response = await fetch(`/server/agenda_function/visits/${visitId}`, {
        headers: {
          'x-user-id': userDetails?.userId
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const data = result.data;
        setVisitData({
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          agenda: JSON.parse(data.agenda || '{}'),
          speakers: JSON.parse(data.speakers || '[]'),
          assets: JSON.parse(data.assets || '[]')
        });
      }
    } catch (err) {
      console.error('Error fetching visit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tab value mapping
  const tabMap = {
    "/agenda/details": "details",
    "/agenda/info": "agenda",
    "/agenda/speakers": "speakers",
    "/agenda/assets": "assets",
    "/agenda/review": "review"
  };

  const currentTab = tabMap[location.pathname] || "details";
  const isInstructor = true; // Demostration role check

  const handleUpdateVisitData = async (newData) => {
    setVisitData(newData);
    // Incremental save if we have an ID
    if (visitId) {
      try {
        await fetch(`/server/agenda_function/visits/${visitId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userDetails?.userId
          },
          body: JSON.stringify(newData)
        });
      } catch (err) {
        console.error('Error auto-saving:', err);
      }
    }
  };

  const handleCoreParametersComplete = (formData) => {
    const updatedData = { ...visitData, ...formData };
    
    // If it's a new visit, we'll save it on the first "Continue" to get an ID
    if (!visitId) {
      saveNewVisit(updatedData);
    } else {
      handleUpdateVisitData(updatedData);
      navigate(`/agenda/info?id=${visitId}`);
    }
  };

  const saveNewVisit = async (data) => {
    try {
      const response = await fetch('/server/agenda_function/visits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userDetails?.userId
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.status === 'success') {
        const newId = result.data.ROWID;
        navigate(`/agenda/info?id=${newId}`);
      }
    } catch (err) {
      console.error('Error saving new visit:', err);
      alert('Failed to initialize visit architecture.');
    }
  };

  const handleFinalDeployment = async () => {
    try {
      // If we already have a visitId, we use PUT to finalize updates. 
      // If not, we use POST (though in the current flow, it's usually created earlier).
      const url = visitId ? `/server/agenda_function/visits/${visitId}` : '/server/agenda_function/visits';
      const method = visitId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userDetails?.userId
        },
        body: JSON.stringify(visitData)
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert(visitId ? 'Visit updates finalized successfully!' : 'Visit initialized and saved successfully!');
        navigate('/');
      } else {
        alert('Error saving visit: ' + result.message);
      }
    } catch (err) {
      console.error('Deployment error:', err);
      alert('Network error or server error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Retrieving Visit Architecture..." />;
  }

  return (
    <div className="space-y-0 min-h-screen bg-[#f6f7f8]">
      <div className="px-8 py-8">
        {currentTab === "details" && (
          <VisitCoreParameters 
            initialData={visitData}
            onContinue={handleCoreParametersComplete} 
            onDiscard={() => navigate("/")} 
          />
        )}

        {currentTab === "agenda" && (
          <AgendaArchitecture 
            visitData={visitData}
            onUpdate={handleUpdateVisitData}
            onBack={() => navigate(`/agenda/details?id=${visitId}`)}
            onNext={() => navigate(`/agenda/speakers?id=${visitId}`)}
          />
        )}

        {currentTab === "speakers" && (
          <SpeakerAlignment 
            visitData={visitData}
            onUpdate={handleUpdateVisitData}
            onBack={() => navigate(`/agenda/info?id=${visitId}`)}
            onNext={() => navigate(isInstructor ? `/agenda/assets?id=${visitId}` : `/agenda/review?id=${visitId}`)}
          />
        )}

        {currentTab === "assets" && (
          <AssetProvisioning 
            visitData={visitData}
            onUpdate={handleUpdateVisitData}
            onBack={() => navigate(`/agenda/speakers?id=${visitId}`)}
            onNext={() => navigate(`/agenda/review?id=${visitId}`)}
          />
        )}

        {currentTab === "review" && (
          <div className="console-card">
             <div className="p-16 text-center space-y-8">
               <div className="size-20 bg-blue-50 tracking-tighter text-blue-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-50">
                 <span className="material-symbols-outlined text-[40px] font-bold">rocket_launch</span>
               </div>
               <div className="space-y-3">
                 <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Experience Ready for Launch</h3>
                 <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed text-sm">Your digital briefing environment is fully configured for <span className="text-primary font-bold italic">{userDetails?.firstName}'s</span> client engagement.</p>
               </div>
               
                {visitId ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-4 max-w-md mx-auto">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shareable Deployment URL</div>
                      <code className="text-xs bg-white px-4 py-2 rounded-lg border border-slate-100 text-primary font-bold break-all w-full">
                        {`${window.location.origin}/#/share/${visitId}`}
                      </code>
                      <div className="flex gap-3 w-full">
                        <Button 
                          variant="outline"
                          className="flex-1 h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-600"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/#/share/${visitId}`);
                            alert('Deployment link copied to clipboard!');
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px] mr-2">content_copy</span>
                          Copy Link
                        </Button>
                        <Button 
                          className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs"
                          onClick={() => window.open(`#/share/${visitId}`, '_blank')}
                        >
                          <span className="material-symbols-outlined text-[16px] mr-2">open_in_new</span>
                          View Page
                        </Button>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-slate-400 font-bold text-xs" onClick={() => navigate('/')}>
                      Return to Command Center
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center mt-12">
                    <Button size="lg" className="h-12 px-12 rounded bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all" onClick={handleFinalDeployment}>
                      Initialize Final Deployment
                    </Button>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateClientVisit;
