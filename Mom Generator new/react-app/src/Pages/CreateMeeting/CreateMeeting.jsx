import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, Users, Trash2, Plus, 
    Video, Info, Loader2, CheckCircle2, AlertCircle,
    ChevronRight, MapPin
} from 'lucide-react';
import { useOutletContext, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../services/api";

const CreateMeeting = () => {
    const { userDetails } = useOutletContext();
    const userId = userDetails?.userId;
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        topic: '',
        agenda: '',
        scheduledDate: new Date(),
        duration: '60',
        timezone: 'Asia/Calcutta'
    });

    const [teams, setTeams] = useState([]);
    const [participants, setParticipants] = useState([]); // [{name, email}]
    const [newParticipant, setNewParticipant] = useState({ name: '', email: '' });

    // Fetch teams for selection
    const fetchTeams = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await api.getTeams(userId);
            setTeams(data.teams || []);
        } catch (err) {
            console.error("Failed to fetch teams:", err);
        }
    }, [userId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleTeamChange = (teamId) => {
        if (!teamId) return;

        const team = teams.find(t => String(t.ROWID) === String(teamId));
        if (team) {
            // Add participants from team if they aren't already there
            const teamParticipants = team.participants.map(p => ({ name: p.name, email: p.email }));
            const currentEmails = new Set(participants.map(p => p.email));
            const uniqueNew = teamParticipants.filter(p => !currentEmails.has(p.email));
            
            setParticipants([...participants, ...uniqueNew]);
        }
    };

    const addParticipant = () => {
        if (!newParticipant.name || !newParticipant.email) return;
        if (participants.some(p => p.email === newParticipant.email)) {
            setError("Participant already added");
            return;
        }
        setParticipants([...participants, newParticipant]);
        setNewParticipant({ name: '', email: '' });
        setError(null);
    };

    const removeParticipant = (email) => {
        setParticipants(participants.filter(p => p.email !== email));
    };

    const formatDateForZoho = (date) => {
        // Zoho expects "Jun 19, 2020 07:00 PM"
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = hours.toString().padStart(2, '0') + ':' + minutes + ' ' + ampm;

        return `${month} ${day}, ${year} ${strTime}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setSubmitting(true);
        setError(null);

        try {
            const zohoStartTime = formatDateForZoho(formData.scheduledDate);
            
            const payload = {
                userId,
                topic: formData.topic,
                agenda: formData.agenda,
                startTime: zohoStartTime,
                duration: formData.duration,
                timezone: formData.timezone,
                participants: participants
            };

            const response = await api.createMeeting(payload);

            if (response.status === 'success') {
                setSuccess("Meeting scheduled successfully! Redirecting...");
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(response.message || "Failed to create meeting");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-600 rounded-[22px] text-white shadow-xl shadow-indigo-100">
                            <Video className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">Sync Initiation</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-sm sm:text-lg">Establish a new Zoho session and map intelligence participants.</p>
                </div>

                {/* Status Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    {/* Primary Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[40px] p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                            <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                                <Info className="w-6 h-6 text-indigo-600" />
                                Meeting Essentials
                            </h2>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Session Identity</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Project Alpha Strategic Sync"
                                        required
                                        value={formData.topic}
                                        onChange={(e) => setFormData({...formData, topic: e.target.value})}
                                        className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-bold placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Discussion Map (Agenda)</label>
                                    <textarea
                                        placeholder="Outline key milestones..."
                                        rows="3"
                                        value={formData.agenda}
                                        onChange={(e) => setFormData({...formData, agenda: e.target.value})}
                                        className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none resize-none font-bold placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Scheduled Date</label>
                                        <div className="relative premium-datepicker">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10" />
                                            <DatePicker
                                                selected={formData.scheduledDate}
                                                onChange={(date) => setFormData({...formData, scheduledDate: date})}
                                                dateFormat="MMMM d, yyyy"
                                                minDate={new Date()}
                                                className="w-full pl-12 pr-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Start Time</label>
                                        <div className="relative premium-datepicker">
                                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10" />
                                            <DatePicker
                                                selected={formData.scheduledDate}
                                                onChange={(date) => setFormData({...formData, scheduledDate: date})}
                                                showTimeSelect
                                                showTimeSelectOnly
                                                timeIntervals={15}
                                                timeCaption="Time"
                                                dateFormat="h:mm aa"
                                                className="w-full pl-12 pr-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Duration</label>
                                        <select
                                            value={formData.duration}
                                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                            className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold cursor-pointer"
                                        >
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="45">45 Minutes</option>
                                            <option value="60">1 Hour</option>
                                            <option value="90">1.5 Hours</option>
                                            <option value="120">2 Hours</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Global Timezone</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                disabled
                                                value={formData.timezone}
                                                className="w-full pl-12 pr-6 py-4 rounded-[24px] border border-slate-100 bg-slate-100 text-slate-400 outline-none cursor-not-allowed font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Participant Management */}
                        <div className="bg-white rounded-[40px] p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                    Guest List
                                </h2>
                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-100/50 inline-block w-fit">
                                    {participants.length} Personas Selected
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Identity Name"
                                            value={newParticipant.name}
                                            onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
                                            className="w-full px-5 py-3.5 rounded-[20px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="flex-[1.5]">
                                        <input
                                            type="email"
                                            placeholder="Secure Email"
                                            value={newParticipant.email}
                                            onChange={(e) => setNewParticipant({...newParticipant, email: e.target.value})}
                                            className="w-full px-5 py-3.5 rounded-[20px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addParticipant}
                                        className="p-3.5 bg-indigo-600 text-white rounded-[20px] hover:bg-black transition-all shadow-lg shadow-indigo-100 flex items-center justify-center sm:shrink-0"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    {participants.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-[28px] group/item hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-[16px] flex items-center justify-center font-black text-slate-300 border border-slate-100 group-hover/item:text-indigo-600 group-hover/item:border-indigo-100 transition-all">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{p.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 lowercase truncate max-w-[120px]">{p.email}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeParticipant(p.email)}
                                                className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {participants.length === 0 && (
                                        <div className="col-span-full py-16 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                                                <Users className="w-8 h-8 opacity-10" />
                                            </div>
                                            <p className="text-[10px] uppercase font-black tracking-[0.3em]">Awaiting mapping</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar / Team Selection */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[40px] p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-10">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 px-1">Quick Invite Collectives</h2>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {teams.length > 0 ? teams.map((team) => (
                                    <button
                                        key={team.ROWID}
                                        type="button"
                                        onClick={() => handleTeamChange(team.ROWID)}
                                        className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 border border-transparent hover:border-indigo-100 rounded-[28px] transition-all duration-300 group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-[18px] shadow-sm flex items-center justify-center font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-100">
                                                {team.teamName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{team.teamName}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{team.participants.length} Personas</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </button>
                                )) : (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">No collectives established</p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-10 flex items-center justify-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 shadow-2xl shadow-indigo-200 transition-all active:scale-95 group disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Video className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                                Launch Session
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            <style>{`
                @keyframes slide-in {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-in {
                    animation: slide-in 0.3s ease-out;
                }
                .premium-datepicker .react-datepicker-wrapper {
                    width: 100%;
                }
                .premium-datepicker .react-datepicker {
                    border-radius: 24px !important;
                    border: 1px solid #f1f5f9 !important;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                    padding: 12px !important;
                    font-family: inherit !important;
                }
                .premium-datepicker .react-datepicker__header {
                    background-color: white !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    border-top-left-radius: 24px !important;
                    border-top-right-radius: 24px !important;
                    padding-top: 16px !important;
                }
                .premium-datepicker .react-datepicker__day--selected {
                    background-color: #4f46e5 !important;
                    border-radius: 12px !important;
                }
                .premium-datepicker .react-datepicker__day:hover {
                    border-radius: 12px !important;
                }
                .premium-datepicker .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                    background-color: #4f46e5 !important;
                }
                .premium-datepicker .react-datepicker__day--keyboard-selected {
                     background-color: #e0e7ff !important;
                     color: #4f46e5 !important;
                     border-radius: 12px !important;
                }
            `}</style>
        </div>
    );
};

export default CreateMeeting;
