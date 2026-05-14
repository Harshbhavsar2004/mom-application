import { useState, useRef, useEffect } from "react";
import {
    Grid, Save, ArrowLeft, Plus, Trash2,
    Type, Hash, Calendar, Users, List,
    CheckCircle2, Info, ChevronRight, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { gsap } from "gsap";
import { toast } from "react-hot-toast";

const PLACEHOLDERS = [
    { label: "Meeting Topic", value: "{{topic}}", icon: <Type size={14} />, color: "bg-blue-50 text-blue-600" },
    { label: "Meeting Date", value: "{{date}}", icon: <Calendar size={14} />, color: "bg-purple-50 text-purple-600" },
    { label: "Executive Summary", value: "{{summary}}", icon: <Info size={14} />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Attendees", value: "{{attendees}}", icon: <Users size={14} />, color: "bg-amber-50 text-amber-600" },
    { label: "Agenda Items", value: "{{agenda}}", icon: <List size={14} />, color: "bg-rose-50 text-rose-600" },
    { label: "Decisions", value: "{{decisions}}", icon: <CheckCircle2 size={14} />, color: "bg-indigo-50 text-indigo-600" },
    { label: "Action Items", value: "{{action_items}}", icon: <Hash size={14} />, color: "bg-slate-50 text-slate-600" },
];

export default function TemplateBuilder() {
    const navigate = useNavigate();
    const [templateName, setTemplateName] = useState("");
    const [rows, setRows] = useState(15);
    const [cols, setCols] = useState(10);
    const [grid, setGrid] = useState(
        Array(15).fill().map(() => Array(10).fill(""))
    );
    const [activeCell, setActiveCell] = useState({ r: 0, c: 0 });
    const [saving, setSaving] = useState(false);

    const builderRef = useRef(null);

    useEffect(() => {
        // Set initial state
        gsap.set(builderRef.current, { opacity: 0, y: 10 });

        // Animate to visible
        gsap.to(builderRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "all" // Ensure it doesn't stick with inline styles
        });
    }, []);

    const handleCellChange = (r, c, val) => {
        const newGrid = [...grid];
        newGrid[r][c] = val;
        setGrid(newGrid);
    };

    const insertPlaceholder = (ph) => {
        const { r, c } = activeCell;
        const currentVal = grid[r][c];
        handleCellChange(r, c, currentVal + ph);
    };

    const handleSave = async () => {
        if (!templateName) {
            toast.error("Please enter a template name");
            return;
        }
        setSaving(true);
        try {
            await api.saveTemplate({
                name: templateName,
                grid: grid
            });
            toast.success("Template saved successfully!");
            navigate("/templates");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div ref={builderRef} className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
            <div className="max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10 sm:mb-12">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/templates")}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                                <Grid size={28} className="text-indigo-600 hidden sm:block" />
                                Architect
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium">Design your unique Excel framework.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Template Name..."
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full sm:w-64 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-black transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            {saving ? "Building..." : "Finalize & Save"}
                        </button>
                    </div>
                </div>
原则
                <div className="grid grid-cols-1 xl:grid-cols-[1fr,350px] gap-8">

                    {/* Grid Area */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col order-2 xl:order-1">
                        <div className="p-1 bg-slate-50 border-b border-slate-100 flex items-center min-w-[800px] xl:min-w-full">
                            <div className="w-10" /> {/* Spacer for row headers */}
                            {Array(cols).fill().map((_, i) => (
                                <div key={i} className="flex-1 py-1 text-[10px] font-black text-slate-400 text-center uppercase border-l border-slate-100 first:border-l-0">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="overflow-auto max-h-[70vh]">
                            <div className="min-w-[800px] xl:min-w-full">
                                {grid.map((row, r) => (
                                    <div key={r} className="flex border-b border-slate-50 last:border-b-0 group">
                                        <div className="w-10 bg-slate-50 text-[10px] font-black text-slate-400 flex items-center justify-center border-r border-slate-100 group-hover:text-indigo-600 shrink-0">
                                            {r + 1}
                                        </div>
                                        {row.map((cell, c) => (
                                            <div
                                                key={c}
                                                className={`flex-1 border-r border-slate-50 last:border-r-0 transition-all ${activeCell.r === r && activeCell.c === c ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/10' : ''
                                                    }`}
                                            >
                                                <input
                                                    type="text"
                                                    value={cell}
                                                    onFocus={() => setActiveCell({ r, c })}
                                                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                                                    className="w-full h-full px-3 py-4 bg-transparent outline-none text-sm font-medium focus:bg-white transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
原则
                    {/* Sidebar / Tools */}
                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Plus size={14} className="text-indigo-600" />
                                Smart Placeholders
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                                {PLACEHOLDERS.map((ph, i) => (
                                    <button
                                        key={i}
                                        onClick={() => insertPlaceholder(ph.value)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 rounded-[20px] border border-transparent hover:border-indigo-100 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 ${ph.color} rounded-lg flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white shrink-0`}>
                                                {ph.icon}
                                            </div>
                                            <span className="text-xs font-black text-slate-600 text-left">{ph.label}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-slate-50 rounded-[20px] border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Info size={12} className="text-indigo-600" />
                                    Architect Guide
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                    Select any cell and click a placeholder to map intelligence.
                                </p>
                            </div>
                        </div>

                        {/* Layout Controls */}
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-6 relative z-10">Grid Dimensions</h3>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-tighter text-indigo-300/40 block mb-2">Rows</label>
                                    <input
                                        type="number"
                                        value={rows}
                                        onChange={(e) => setRows(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-bold text-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-tighter text-indigo-300/40 block mb-2">Columns</label>
                                    <input
                                        type="number"
                                        value={cols}
                                        onChange={(e) => setCols(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
