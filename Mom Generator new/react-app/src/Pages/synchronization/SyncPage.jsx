import { useState, useCallback, useEffect } from "react";
import {
  Cloud,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  RefreshCcw,
  Play,
  AlertCircle,
  Database,
  Layout,
  ArrowRight,
  Loader2,
  Search,
  Filter,
  Check,
  Info,
  Cpu,
  Zap,
  History,
  Bell,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import api from "../../services/api";

const SyncPage = () => {
  const { userDetails } = useOutletContext();
  const userId = userDetails?.userId;
  const isConnected = true;

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Discovery Initiated...");

  // Automation State
  const [syncSettings, setSyncSettings] = useState({
    frequency: "off",
    lastSync: 0,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [syncProgress, setSyncProgress] = useState({
    active: false,
    currentStep: "",
    total: 0,
    processed: 0,
    logs: [],
    failed: 0,
    success: 0,
  });

  const [filter, setFilter] = useState("");

  const stats = {
    total: recordings.length,
    synced: recordings.filter((r) => r.stratusFileName).length,
    pending: recordings.filter((r) => !r.stratusFileName).length,
  };

  const fetchLocalMetadata = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getStoredRecordings(userId);
      setRecordings(data);
    } catch (err) {
      console.error("Local fetch error:", err);
    }
  }, [userId]);

  const fetchSyncSettings = useCallback(async () => {
    if (!userId) return;
    try {
      const settings = await api.getSyncSettings(userId);
      setSyncSettings(settings);
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  }, [userId]);

  useEffect(() => {
    const bootSequence = async () => {
      setPageLoading(true);
      setStatusMessage("Calibrating Cloud Bridge...");

      await Promise.all([fetchLocalMetadata(), fetchSyncSettings()]);

      setStatusMessage("Indexing Stratus Vault...");
      await new Promise((r) => setTimeout(r, 600));
      setPageLoading(false);
    };

    bootSequence();
  }, [fetchLocalMetadata, fetchSyncSettings, userId]);

  const handleFrequencyChange = async (newFreq) => {
    setSavingSettings(true);
    try {
      await api.updateSyncSettings(userId, newFreq);
      setSyncSettings((prev) => ({ ...prev, frequency: newFreq }));
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const runFullSync = async () => {
    if (!userId) return;
    setLoading(true);

    setSyncProgress({
      active: true,
      currentStep: "Initializing Master Sync Protocol...",
      total: 0,
      processed: 0,
      logs: [
        "[SYS] Initializing Master Sync Protocol...",
        "[AUTH] Verifying Zoho Credentials...",
      ],
      failed: 0,
      success: 0,
    });

    try {
      await new Promise((r) => setTimeout(r, 500));
      const syncResult = await api.downloadAllTranscripts(userId);

      setSyncProgress((prev) => ({
        ...prev,
        processed: 100,
        total: 100,
        success: syncResult.syncedCount || 0,
        currentStep: "Protocols Finalized",
        logs: [
          ...prev.logs,
          `[VAULT] ✓ Successfully synced ${syncResult.syncedCount} new intelligence assets to Stratus.`,
          "[SYS] Synchronization protocols finalized. Bridge standby.",
        ],
      }));

      fetchLocalMetadata();

      // Auto-close terminal after 3 seconds of success
      setTimeout(() => {
        setSyncProgress((prev) =>
          prev.active ? { ...prev, active: false } : prev,
        );
      }, 3000);
    } catch (err) {
      console.error("Sync Error:", err);
      setSyncProgress((prev) => ({
        ...prev,
        currentStep: "Protocol Terminated",
        logs: [...prev.logs, `[ERROR] Intelligence Override: ${err.message}`],
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (ts) => {
    if (!ts || ts === 0) return "Never";
    return new Date(parseInt(ts)).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filteredRecordings = recordings.filter((r) =>
    r.topic.toLowerCase().includes(filter.toLowerCase()),
  );

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans antialiased text-gray-900">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-8" />
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Syncing your workspace
        </h2>
        <p className="text-sm text-gray-500 font-medium">{statusMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans antialiased text-gray-900 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 font-bold text-xs tracking-[0.2em] uppercase mb-4">
              <RefreshCcw className="w-4 h-4" />
              <span>Bridge Management v2</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Cloud Synchronization
            </h1>
            <p className="mt-4 text-slate-500 max-w-2xl text-base sm:text-lg leading-relaxed font-medium">
              Autonomous data pipeline for Zoho records. Enable background sync
              to keep your Stratus vault updated 24/7.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={runFullSync}
              disabled={loading}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              Trigger Manual Sync
            </button>
          </div>
        </header>

        {/* --- Top Row: Stats & Automation --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Automation Card */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
              <Cpu size={140} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Automation Intelligence
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Scheduler Status:{" "}
                      <span
                        className={
                          syncSettings.frequency !== "off"
                            ? "text-emerald-500"
                            : "text-slate-400"
                        }
                      >
                        {syncSettings.frequency !== "off"
                          ? "Active"
                          : "Standby"}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed">
                  Configure how often Stratus Bridge should poll Zoho for new
                  intelligence assets.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 min-w-[240px]">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Polling Frequency
                </label>
                <div className="flex flex-col gap-2">
                  {["off", "hourly", "daily"].map((freq) => (
                    <button
                      key={freq}
                      disabled={savingSettings}
                      onClick={() => handleFrequencyChange(freq)}
                      className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${
                        syncSettings.frequency === freq
                          ? "bg-white text-indigo-600 border-indigo-100 shadow-sm"
                          : "bg-transparent text-slate-400 border-transparent hover:bg-slate-100"
                      }`}
                    >
                      {freq}
                      {syncSettings.frequency === freq && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap items-center gap-10">
              <div className="flex items-center gap-3">
                <History className="text-slate-300" size={18} />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Last Automated Sync
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {formatLastSync(syncSettings.lastSync)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="text-slate-300" size={18} />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Sync Alerts
                  </p>
                  <p className="text-sm font-black text-slate-800">Enabled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {[
              {
                label: "Cloud Synced",
                value: stats.synced,
                icon: Database,
                color: "emerald",
              },
              {
                label: "Discovery Pending",
                value: stats.pending,
                icon: Clock,
                color: "amber",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden relative"
              >
                <div
                  className={`absolute left-0 top-0 w-1 h-full bg-${stat.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}
                >
                  <stat.icon size={22} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Records Table */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden mb-12">
          {/* Table Toolbar */}
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Layout size={20} className="text-indigo-600" />
              Indexed Repositories
            </h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search recordings..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-[20px] text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/30">
                  <th className="px-10 py-5">Topic</th>
                  <th className="px-10 py-5">Date</th>
                  <th className="px-10 py-5">Duration</th>
                  <th className="px-10 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecordings.map((rec) => (
                  <tr
                    key={rec.erecordingId}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${rec.stratusFileName ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]" : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]"}`}
                        />
                        <span className="font-black text-slate-900 tracking-tight text-sm">
                          {rec.topic}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-slate-400 font-bold text-xs uppercase tracking-tight">
                      {rec.sDate}
                    </td>
                    <td className="px-10 py-7 text-slate-900 font-black text-xs">
                      {rec.durationInMins}m
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex justify-center">
                        {rec.stratusFileName ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            <Cloud className="w-3.5 h-3.5" /> Secure Storage
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                            <RefreshCcw className="w-3.5 h-3.5" /> Standby
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sync Progress Modal */}
      {syncProgress.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Background */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Terminal Window */}
          <div className="relative w-full max-w-2xl bg-[#0d1117] border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                mom-sync-terminal
              </span>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-mono text-sm text-green-400 space-y-2 h-[300px] overflow-y-auto">
              <p className="text-slate-400">
                $ initializing synchronization engine...
              </p>

              <p className="text-green-400">{syncProgress.currentStep}</p>

              {syncProgress.logs.map((log, i) => (
                <p key={i} className="text-green-400">
                  {`> ${log}`}
                </p>
              ))}

              {/* Blinking Cursor */}
              <span className="animate-pulse text-green-500">█</span>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">
                syncing assets...
              </span>

              <button
                onClick={() =>
                  setSyncProgress((prev) => ({ ...prev, active: false }))
                }
                className="text-xs text-red-400 font-mono hover:text-red-300"
              >
                terminate
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncPage;
