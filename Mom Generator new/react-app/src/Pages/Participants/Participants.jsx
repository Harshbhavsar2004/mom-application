import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Trash2, Edit2, Plus, Save, X,
    ChevronDown, ChevronUp, Mail, User, Shield,
    Search, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useOutletContext } from "react-router-dom";
import api from "../../services/api";

const Participants = () => {
    const { userDetails } = useOutletContext();
    const userId = userDetails?.userId;

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form states
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [newTeam, setNewTeam] = useState({
        teamName: '',
        participants: [{ name: '', email: '' }]
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState("Directory Standby");

    const fetchTeams = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setStatusMessage("Accessing Secure Directory...");
        await new Promise(r => setTimeout(r, 800));

        setStatusMessage("Verifying Team Personas...");
        try {
            const data = await api.getTeams(userId);

            await new Promise(r => setTimeout(r, 600));
            setStatusMessage("Optimizing Member Lists...");
            setTeams(data.teams || []);
            setError(null);

            await new Promise(r => setTimeout(r, 500));
            setStatusMessage("Vault Synchronized");
        } catch (err) {
            setError("Failed to load teams. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleAddParticipantRow = () => {
        setNewTeam({
            ...newTeam,
            participants: [...newTeam.participants, { name: '', email: '' }]
        });
    };

    const handleRemoveParticipantRow = (index) => {
        const updated = [...newTeam.participants];
        updated.splice(index, 1);
        setNewTeam({ ...newTeam, participants: updated });
    };

    const handleParticipantChange = (index, field, value) => {
        const updated = [...newTeam.participants];
        updated[index][field] = value;
        setNewTeam({ ...newTeam, participants: updated });
    };

    const resetForm = () => {
        setNewTeam({ teamName: '', participants: [{ name: '', email: '' }] });
        setIsAddingTeam(false);
        setEditingTeamId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;

        setSubmitting(true);
        setError(null);

        try {
            if (editingTeamId) {
                await api.updateTeam({
                    userId,
                    teamId: editingTeamId,
                    teamName: newTeam.teamName,
                    participants: newTeam.participants.filter(p => p.name && p.email)
                });
                setSuccess("Team updated successfully!");
            } else {
                await api.createTeam({
                    userId,
                    teamName: newTeam.teamName,
                    participants: newTeam.participants.filter(p => p.name && p.email)
                });
                setSuccess("Team created successfully!");
            }

            resetForm();
            fetchTeams();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to save team. " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (team) => {
        setNewTeam({
            teamName: team.teamName,
            participants: team.participants.length > 0
                ? team.participants.map(p => ({ name: p.name, email: p.email }))
                : [{ name: '', email: '' }]
        });
        setEditingTeamId(team.ROWID);
        setIsAddingTeam(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (teamId) => {
        if (!window.confirm("Are you sure you want to delete this team?")) return;

        try {
            await api.deleteTeam(teamId, userId);
            setSuccess("Team deleted successfully!");
            fetchTeams();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to delete team.");
        }
    };

    const filteredTeams = teams.filter(t =>
        t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10 text-center sm:text-left">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Team Management</h1>
                        <p className="text-slate-500 text-sm sm:text-base font-medium mt-1">Configure your collectives and intelligence personas.</p>
                    </div>

                    <button
                        onClick={() => { setIsAddingTeam(!isAddingTeam); if (isAddingTeam) resetForm(); }}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${isAddingTeam
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                    >
                        {isAddingTeam ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isAddingTeam ? 'Stall Operation' : 'Initialize New Team'}
                    </button>
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

                {/* Create/Edit Form */}
                {isAddingTeam && (
                    <div className="bg-white rounded-[40px] p-6 sm:p-10 border border-slate-200 shadow-2xl mb-12 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                               <Users className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {editingTeamId ? 'Update Intelligence' : 'Design Identity'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Team Identity</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Marketing Force, Project Alpha..."
                                    required
                                    value={newTeam.teamName}
                                    onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                                    className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-bold placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Participants</label>
                                    <button
                                        type="button"
                                        onClick={handleAddParticipantRow}
                                        className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Member
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {newTeam.participants.map((p, idx) => (
                                        <div key={idx} className="flex flex-col xl:flex-row gap-4 p-5 bg-slate-50 rounded-[28px] border border-transparent hover:border-indigo-100 transition-all group/row animate-in fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex-1 space-y-2">
                                                <div className="relative">
                                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                  <input
                                                      type="text"
                                                      placeholder="Identity Name"
                                                      required
                                                      value={p.name}
                                                      onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                                                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                                                  />
                                                </div>
                                            </div>
                                            <div className="flex-[1.5] flex gap-3">
                                                <div className="relative flex-1">
                                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                  <input
                                                      type="email"
                                                      placeholder="Secure Email"
                                                      required
                                                      value={p.email}
                                                      onChange={(e) => handleParticipantChange(idx, 'email', e.target.value)}
                                                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                                                  />
                                                </div>
                                                {newTeam.participants.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveParticipantRow(idx)}
                                                        className="p-3 text-slate-300 hover:text-rose-500 bg-white border border-slate-100 rounded-2xl transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Stall
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingTeamId ? 'Commit Update' : 'Establish Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Active Directories</h3>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Scan resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm shadow-slate-200/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 md:gap-8">
                        {loading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-12 h-12 animate-spin mb-6 text-indigo-600/20" />
                                <p className="font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">{statusMessage}</p>
                            </div>
                        ) : filteredTeams.length === 0 ? (
                            <div className="col-span-full py-24 bg-white border border-slate-100 rounded-[48px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 opacity-20" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Zero Personas Established</h4>
                                <p className="max-w-xs text-center mt-2 text-sm font-medium text-slate-400">Initialize a new collective to manage intelligence mapping.</p>
                            </div>
                        ) : (
                            filteredTeams.map((team) => (
                                <div key={team.ROWID} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden group">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    {team.teamName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{team.teamName}</h4>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 mt-1.5 border border-indigo-100/50">
                                                        <Shield className="w-3 h-3" /> Secure Node
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(team)}
                                                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(team.ROWID)}
                                                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-slate-50">
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                <span>Active Members</span>
                                                <span className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{team.participants.length}</span>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                                {team.participants.map((p, pIdx) => (
                                                    <div key={pIdx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl group/item hover:bg-white hover:shadow-md hover:shadow-indigo-500/5 border border-transparent hover:border-indigo-100 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover/item:text-indigo-600 transition-colors">
                                                                {p.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-800 tracking-tight">{p.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 lowercase">{p.email}</span>
                                                            </div>
                                                        </div>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-in {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default Participants;
