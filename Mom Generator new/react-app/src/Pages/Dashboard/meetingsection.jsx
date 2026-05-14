import { useState } from "react";
import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Calendar, Video, ArrowRight, Loader2, RefreshCw } from "lucide-react";

export default function MeetingsSection({ userId, connected, trigger, onComplete }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Awaiting Sequence...");

  useEffect(() => {
    if (trigger && connected && userId) {
      getMeetings();
    }
  }, [trigger, connected, userId]);

  const getMeetings = async () => {
    setLoading(true);
    setStatusMessage("Establishing Zoho Bridge...");

    // Artificial delay for "Intelligence" feel
    await new Promise(r => setTimeout(r, 1000));
    setStatusMessage("Scanning Network Clusters...");
    await new Promise(r => setTimeout(r, 800));
    setStatusMessage("Retrieving Active Sessions...");

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/meetings?user_id=${userId}`
      );

      const data = await res.json();
      setMeetings(data.session || []);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setStatusMessage("Network Interrupt Detected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Live Meetings</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            Real-time Zoho Session Monitor
          </p>
        </div>

        <button
          onClick={getMeetings}
          disabled={!connected || loading}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!connected || loading
            ? "bg-slate-100 text-slate-400 border border-slate-200"
            : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm"
            }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? "Scanning..." : "Refresh"}
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1">
        {!connected ? (
          <div className="h-40 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center">
            <Video className="text-slate-200 mb-3" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Auth Bridge</p>
          </div>
        ) : loading ? (
          <div className="h-40 flex flex-col items-center justify-center">
            <Loader2 className="text-indigo-600 animate-spin mb-3" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">{statusMessage}</p>
          </div>
        ) : meetings.length > 0 ? (
          <div className="space-y-3">
            {meetings.map((m, i) => (
              <div
                key={i}
                className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 rounded-[20px] border border-transparent hover:border-indigo-100 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                    <Video size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 line-clamp-1">{m.topic || "Unititled Session"}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={10} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{m.startTime || "No date set"}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://meeting.zoho.in/join?key=${m.meetingKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 sm:p-2.5 bg-white text-indigo-600 border border-slate-200 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex-shrink-0"
                >
                  <ArrowRight size={16} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center">
            <Calendar className="text-slate-200 mb-3" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Meetings Detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
