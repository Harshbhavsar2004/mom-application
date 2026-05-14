import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SpeakerData = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSpeaker = localStorage.getItem(`speaker_session_${id}`);
    if (!savedSpeaker) {
      navigate(`/share/${id}`);
      return;
    }
    const speakerData = JSON.parse(savedSpeaker);
    setSpeaker(speakerData);
    fetchAssets();
  }, [id, navigate]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`/server/agenda_function/speaker/assets?visitId=${id}`);
      const result = await response.json();
      if (result.status === "success") {
        setAssets(result.data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'present_to_all';
    return 'description';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-display text-slate-900 antialiased pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/share/${id}`)}
              className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">Speaker Portal</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visit Assets & Resources</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Authenticated as</p>
              <p className="text-sm font-bold text-slate-900">{speaker?.name}</p>
            </div>
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Your Provisioned <span className="text-primary">Data</span></h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
            Access all technical briefing books, speaker bios, and session resources prepared for your upcoming presentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {assets.length > 0 ? (
              assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white p-6 rounded-3xl border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-start gap-5"
                >
                  <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    asset.type.includes('pdf') ? 'bg-red-50 text-red-500' : 
                    asset.type.includes('image') ? 'bg-blue-50 text-blue-500' : 
                    'bg-slate-50 text-slate-500'
                  }`}>
                    <span className="material-symbols-outlined text-[28px]">{getFileIcon(asset.type)}</span>
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="font-bold text-slate-900 truncate mb-1">{asset.name}</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{asset.type.split('/')[1] || 'Document'}</p>
                  </div>

                  <a 
                    href={asset.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute right-6 top-6 size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all"
                    title="Download Asset"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
                <div className="size-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[40px]">folder_open</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">No Assets Found</h3>
                  <p className="text-slate-500 font-medium">Your coordinator hasn't provisioned any assets for this visit yet.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Notice */}
        <div className="mt-16 p-8 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 size-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[32px] text-primary">security</span>
          </div>
          <div className="relative z-10 flex-1">
            <h4 className="text-xl font-black mb-2">Secure Link Protection</h4>
            <p className="text-white/60 font-medium text-sm leading-relaxed">
              This portal is protected by system-generated credentials unique to your profile. Asset links are signed and expire periodically to ensure maximum security for internal deliverables.
            </p>
          </div>
          <button 
            onClick={() => navigate(`/share/${id}`)}
            className="relative z-10 px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all"
          >
            Back to Experience
          </button>
        </div>
      </main>
    </div>
  );
};

export default SpeakerData;
