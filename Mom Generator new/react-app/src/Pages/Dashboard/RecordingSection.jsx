import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import {
  Cloud,
  Download,
  RefreshCw,
  Loader2,
  FileText,
  Calendar,
  Database,
  CheckCircle2,
  HardDrive
} from "lucide-react";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function RecordingsSection({ userId, connected, trigger }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Waiting for Sequence...");

  useEffect(() => {
    if (trigger && connected && userId) {
      getRecordings();
    }
  }, [trigger, connected, userId]);

  /* --------------------------------------------------
     1. Fetch Stored Recordings from DataStore
  -------------------------------------------------- */
  const fetchStoredRecordings = async () => {
    if (!userId || !connected) return;
    try {
      const res = await fetch(`${BASE_URL}/getStoredRecordings?user_id=${userId}`);
      const data = await res.json();
      if (data.status === "success") {
        setRecordings(data.recordings || []);
      }
    } catch (err) {
      console.error("Stored fetch error:", err);
    }
  };

  /* --------------------------------------------------
     2. Refresh List from Zoho API
  -------------------------------------------------- */
  const getRecordings = async () => {
    if (!userId || !connected) return;
    setLoading(true);
    setStatusMessage("Connecting to Data Lake...");
    await new Promise(r => setTimeout(r, 1200));
    setStatusMessage("Optimizing Local Repository...");
    await new Promise(r => setTimeout(r, 800));
    setStatusMessage("Indexing Intelligence Assets...");

    try {
      const zohoRes = await fetch(`${BASE_URL}/recordings?user_id=${userId}`);
      const zohoData = await zohoRes.json();
      const zohoRecordings = zohoData.recordings || [];

      if (zohoRecordings.length > 0) {
        setRecordings(zohoRecordings);
        await fetch(`${BASE_URL}/saveRecordings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, recordings: zohoRecordings }),
        });
      }
    } catch (err) {
      console.error("Zoho fetch error:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (connected && userId) {
      // Initial fetch of stored data can stay immediate or also wait
      fetchStoredRecordings();
    }
  }, [connected, userId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Cloud Archive</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            Transcripts & Media Persistence
          </p>
        </div>

        <button
          onClick={getRecordings}
          disabled={!connected || loading}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!connected || loading
            ? "bg-slate-100 text-slate-400 border border-slate-200"
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? "Establishing Sync..." : "Synchronize Repository"}
        </button>
      </div>

      <div className="flex-1 overflow-auto pr-2">
        {!connected ? (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-6 text-center">
            <HardDrive className="text-slate-200 mb-4" size={48} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Authorization Blocked<br />
              <span className="text-[10px] opacity-60">Connect Zoho to Access Archive</span>
            </p>
          </div>
        ) : loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="text-indigo-600 animate-spin mb-4" size={48} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">{statusMessage}</p>
          </div>
        ) : recordings.length > 0 ? (
          <div className="space-y-4">
            {recordings.map((r) => (
              <div key={r.erecordingId} className="group bg-white p-5 rounded-[28px] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight">{r.topic || "Untitled Assets"}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.sDate || "Undated"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {r.transcriptionDownloadUrl && (
                      <a
                        href={r.transcriptionDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                      >
                        <Download size={14} />
                        Transcript
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-6 text-center">
            <Database className="text-slate-200 mb-4" size={48} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repository Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
