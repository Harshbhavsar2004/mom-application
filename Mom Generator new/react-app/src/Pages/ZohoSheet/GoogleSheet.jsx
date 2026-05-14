import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Table2,
  X,
  Sparkles,
  Search,
  Trash2,
  CloudDownload,
  ArrowRight,
} from "lucide-react";

export default function GoogleSheet() {
  const { userDetails } = useOutletContext();
  const userId = userDetails?.userId;

  const [activeSheets, setActiveSheets] = useState([]);
  const [driveSheets, setDriveSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "discovery"

  // Create workbook state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");
  const [creating, setCreating] = useState(false);

  // Search state for discovery
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userId) return;
    init();
  }, [userId]);

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check connection first
      const statusRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/check-google-connection?user_id=${userId}`);
      const statusData = await statusRes.json();
      setConnected(statusData.connected);
      
      if (statusData.connected) {
        await loadManagedSheets();
      }
    } catch (err) {
      setError("Connection check failed");
    } finally {
      setLoading(false);
    }
  };

  const loadManagedSheets = async () => {
    try {
      const data = await api.listGoogleSheets(userId);
      setActiveSheets(data.workbooks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDriveSheets = async () => {
    setDiscoveryLoading(true);
    try {
      const data = await api.listGoogleDriveSheets(userId);
      setDriveSheets(data.files || []);
      setActiveTab("discovery");
      toast.success("Drive assets indexed successfully");
    } catch (err) {
      toast.error("Failed to load Drive sheets: " + err.message);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleImport = async (sheet) => {
    try {
      await api.manageGoogleSheet(userId, sheet.id, sheet.name, "add");
      await loadManagedSheets();
      setActiveTab("active");
      toast.success(`Successfully imported "${sheet.name}"`);
    } catch (err) {
      toast.error("Import failed: " + err.message);
    }
  };

  const handleRemove = async (sheetId) => {
    if (!window.confirm("Are you sure you want to remove this sheet from the application? (It won't be deleted from your Drive)")) return;
    try {
      await api.manageGoogleSheet(userId, sheetId, null, "remove");
      setActiveSheets(prev => prev.filter(s => s.id !== sheetId));
      toast.success("Sheet removed from workspace");
    } catch (err) {
      toast.error("Remove failed: " + err.message);
    }
  };

  const handleCreate = async () => {
    if (!newWorkbookName.trim()) return;
    setCreating(true);
    try {
      const result = await api.createGoogleWorkbook(userId, newWorkbookName.trim());
      setActiveSheets(prev => [{
        id: result.resourceId,
        name: result.name,
        url: result.workbookUrl
      }, ...prev]);
      setShowCreateModal(false);
      setNewWorkbookName("");
      setActiveTab("active");
      toast.success(`Created "${result.name}" successfully`);
    } catch (err) {
      toast.error("Creation failed: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredDiscovery = driveSheets.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !activeSheets.some(active => active.id === s.id)
  );

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-900 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-600 text-white rounded-[24px] shadow-xl shadow-emerald-100/50">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Managed Sheets
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-2">
                Unified Google Sheets Management
                {connected && <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 inline-flex"><CheckCircle2 size={10} /> Active</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={init}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={18} className={loading || discoveryLoading ? "animate-spin text-emerald-600" : "text-slate-400"} />
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={!connected}
              className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
            >
              <Plus size={16} /> New Workbook
            </button>
          </div>
        </div>

        {/* Not Connected State */}
        {!connected && !loading && (
          <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-rose-500">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Disconnected from Google</h2>
            <p className="text-slate-500 max-w-md mx-auto mt-3 font-medium">Please connect your Google account from the dashboard to start managing your spreadsheets.</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-5">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Drive...</p>
          </div>
        )}

        {/* Main Content Areas */}
        {connected && !loading && (
          <div className="space-y-8">
            
            {/* Tabs / Switches */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[28px] border border-slate-100 w-fit shadow-sm">
              <button 
                onClick={() => setActiveTab("active")}
                className={`px-8 py-3 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Active Sheets ({activeSheets.length})
              </button>
              <button 
                onClick={loadDriveSheets}
                className={`flex items-center gap-2 px-8 py-3 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'discovery' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {discoveryLoading ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                Import from Drive
              </button>
            </div>

            {/* Managed Sheets List */}
            {activeTab === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSheets.length === 0 ? (
                  <div className="col-span-full bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center">
                    <Table2 size={50} className="mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-400 font-bold max-w-xs mx-auto">You haven't added any sheets yet. Use the "Import" tab to find existing sheets in your Drive.</p>
                  </div>
                ) : (
                  activeSheets.map(sheet => (
                    <div key={sheet.id} className="group bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col justify-between gap-8 hover:shadow-2xl hover:border-emerald-100 transition-all duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <FileSpreadsheet size={20} />
                          </div>
                          <button 
                            onClick={() => handleRemove(sheet.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h3 className="text-base font-black text-slate-800 line-clamp-2 leading-snug">{sheet.name}</h3>
                      </div>
                      
                      <a 
                        href={`https://docs.google.com/spreadsheets/d/${sheet.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all"
                      >
                        <ExternalLink size={14} /> View Document
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Discovery Section */}
            {activeTab === 'discovery' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                <div className="relative group max-w-2xl">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search your Google Drive spreadsheets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDiscovery.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm">
                      {searchQuery ? "No matching spreadsheets found." : "No new spreadsheets found in Drive."}
                    </div>
                  ) : (
                    filteredDiscovery.map(sheet => (
                      <div key={sheet.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between gap-4 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-emerald-500">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                            <FileSpreadsheet size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-700 truncate">{sheet.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ID: {sheet.id.substring(0, 10)}...</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleImport(sheet)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all whitespace-nowrap"
                        >
                          Import <ArrowRight size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ── Create Workbook Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => !creating && setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 space-y-8 animate-in zoom-in-95 fade-in duration-300">
            <button
              onClick={() => !creating && setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto shadow-inner">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Create New Sheet</h2>
              <p className="text-slate-400 text-sm font-medium">It will be automatically categorized as an active sheet.</p>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Workbook Title</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Sales Q1 MoMs"
                value={newWorkbookName}
                onChange={(e) => setNewWorkbookName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={creating}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-base font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleCreate}
                disabled={creating || !newWorkbookName.trim()}
                className="flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
              >
                {creating ? <><Loader2 size={18} className="animate-spin" /> Provisioning</> : <><Plus size={18} /> Generate Workbook</>}
              </button>
              <button
                onClick={() => !creating && setShowCreateModal(false)}
                disabled={creating}
                className="py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
