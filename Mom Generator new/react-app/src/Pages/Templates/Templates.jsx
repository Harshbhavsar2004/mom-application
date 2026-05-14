import { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, Search, FileText, Layout as LayoutIcon, Download, MoreVertical, Trash2 } from "lucide-react";
import api from "../../services/api";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

export default function Templates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await api.getTemplates();
                setTemplates(data.templates || []);
            } catch (err) {
                console.error("Fetch Templates Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        gsap.from(".template-card", {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power3.out"
        });
    }, [templates]);

    const filteredTemplates = templates.filter(t =>
        t.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12 text-center sm:text-left">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">Master Templates</h1>
                        <p className="text-slate-500 text-sm sm:text-base font-medium">Manage your professional Excel frameworks for synthesis.</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Find a template..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Scanning Repository...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* System Default Placeholder (Not a real file) */}
                        <div className="template-card group bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                                <FileSpreadsheet size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                    <LayoutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">System Standard</h3>
                                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed line-clamp-2">
                                    The default built-in structure for clean, comprehensive meeting minutes mapping.
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <span className="text-[10px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">Core Template</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 cursor-not-allowed">
                                            <MoreVertical size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Dynamic File Templates */}
                        {filteredTemplates.map((template, idx) => (
                            <div key={idx} className="template-card group bg-white p-6 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                                    <FileText size={120} />
                                </div>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                        <FileSpreadsheet sclassName="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2 truncate tracking-tight">{template.displayName}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed line-clamp-2">
                                        Custom framework mapping logic for specialized meeting requirements.
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full">Custom Sheet</span>
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Empty State */}
                        {filteredTemplates.length === 0 && (
                            <div className="lg:col-span-3 py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-xs">No additional templates found</p>
                                <p className="text-sm mt-2 opacity-60">Add .xlsx files to functions/templates to see them here.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Banner */}
                <div className="mt-12 p-8 sm:p-10 bg-indigo-600 rounded-[40px] shadow-2xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl shrink-0" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-inner shrink-0">
                            <Plus size={32} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl sm:text-2xl font-black tracking-tight">Create Custom Frameworks</h4>
                            <p className="text-indigo-100 font-medium opacity-80 text-sm sm:text-base">Design your own Excel structures directly in our visual architect.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/templates/create")}
                        className="relative z-10 w-full sm:w-auto px-10 py-4 bg-white text-indigo-600 rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl"
                    >
                        Start UI Builder
                    </button>
                </div>
            </div>
        </div>
    );
}
