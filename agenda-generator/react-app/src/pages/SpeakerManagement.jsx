import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { useState , useEffect } from 'react';
import LoadingState from '../components/LoadingState';

const SpeakerManagement = () => {
    const { userDetails } = useOutletContext();
    const [speakers, setSpeakers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSpeaker, setEditingSpeaker] = useState(null);
    const [newSpeaker, setNewSpeaker] = useState({ name: "", role: "", email: "", company: "", image: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (userDetails?.userId) {
            fetchSpeakers();
        }
    }, [userDetails]);

    const fetchSpeakers = async () => {
        try {
            const response = await fetch('/server/agenda_function/speakers', {
                headers: {
                    'x-user-id': userDetails.userId
                }
            });
            const result = await response.json();
            if (result.status === 'success') {
                setSpeakers(result.data);
            }
        } catch (error) {
            console.error("Error fetching speakers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewSpeaker({ ...newSpeaker, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData();
            formData.append('name', newSpeaker.name || '');
            formData.append('role', newSpeaker.role || '');
            formData.append('email', newSpeaker.email || '');
            formData.append('company', newSpeaker.company || '');
            
            if (newSpeaker.image) {
                formData.append('image', newSpeaker.image);
            }

            const url = editingSpeaker 
                ? `/server/agenda_function/speakers/${editingSpeaker.ROWID}`
                : `/server/agenda_function/speakers`;
            
            const method = editingSpeaker ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                body: method === 'POST' ? formData : JSON.stringify({ 
                    name: newSpeaker.name, 
                    role: newSpeaker.role,
                    email: newSpeaker.email,
                    company: newSpeaker.company
                }),
                headers: {
                    'x-user-id': userDetails.userId,
                    ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {})
                }
            });

            const result = await response.json();
            if (result.status === 'success') {
                fetchSpeakers();
                resetForm();
            }
        } catch (error) {
            console.error("Error saving speaker:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this speaker?")) return;
        try {
            await fetch(`/server/agenda_function/speakers/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': userDetails.userId
                }
            });
            fetchSpeakers();
        } catch (error) {
            console.error("Error deleting speaker:", error);
        }
    };

    const resetForm = () => {
        setNewSpeaker({ name: "", role: "", email: "", company: "", image: null });
        setPreviewUrl(null);
        setEditingSpeaker(null);
        setShowForm(false);
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        return url; // Backend now provides full download URLs
    };

    const startEdit = (speaker) => {
        setEditingSpeaker(speaker);
        setNewSpeaker({ 
            name: speaker.name, 
            role: speaker.role, 
            email: speaker.email || "", 
            company: speaker.company || "", 
            image: null 
        });
        setPreviewUrl(getImageUrl(speaker.imageUrl));
        setShowForm(true);
    };

    return (
        <div className="p-12 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expert Spreadsheet</h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm uppercase tracking-wider">Maintain your centralized repository of briefing specialists.</p>
                </div>
                {!showForm && (
                    <Button 
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                        onClick={() => setShowForm(true)}
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Onboard New Expert
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">{editingSpeaker ? 'Modify Expert' : 'Expert Onboarding'}</h2>
                        <Button variant="ghost" className="size-10 rounded-full p-0" onClick={resetForm}>
                            <span className="material-symbols-outlined">close</span>
                        </Button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary/50 transition-all group bg-slate-50/30">
                            {previewUrl ? (
                                <div className="relative size-40 group">
                                    <img src={previewUrl} alt="Preview" className="size-full rounded-2xl object-cover shadow-md" />
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                        <label htmlFor="image-upload" className="cursor-pointer text-white text-[12px] font-bold">Change Image</label>
                                    </div>
                                </div>
                            ) : (
                                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                    <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">Expert Avatar</span>
                                    <span className="text-[11px] text-slate-400 mt-1 uppercase font-black tracking-widest">JPG, PNG strictly</span>
                                </label>
                            )}
                            <input id="image-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                        
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</label>
                                    <input 
                                        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                                        placeholder="e.g. Dr. Sarah Jenkins"
                                        value={newSpeaker.name}
                                        onChange={(e) => setNewSpeaker({...newSpeaker, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialization / Role</label>
                                    <input 
                                        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                                        placeholder="e.g. Chief Cloud Architect"
                                        value={newSpeaker.role}
                                        onChange={(e) => setNewSpeaker({...newSpeaker, role: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</label>
                                    <input 
                                        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                                        placeholder="sarah@corp.com"
                                        value={newSpeaker.email}
                                        onChange={(e) => setNewSpeaker({...newSpeaker, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Organization / Company</label>
                                    <input 
                                        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                                        placeholder="e.g. Google Cloud, AWS"
                                        value={newSpeaker.company}
                                        onChange={(e) => setNewSpeaker({...newSpeaker, company: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" className="h-11 px-6 font-bold text-slate-500 rounded-lg" onClick={resetForm}>Discard</Button>
                                <Button type="submit" className="h-11 px-10 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-lg">
                                    {editingSpeaker ? 'Update Profile' : 'Complete Onboarding'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}


            {loading ? (
                <LoadingState message="Connecting with Experts..." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {speakers.map((speaker) => (
                        <div key={speaker.ROWID} className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 flex gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                <Button size="icon" variant="secondary" className="size-9 rounded-full bg-white border border-slate-200 shadow-sm hover:text-primary" onClick={() => startEdit(speaker)}>
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </Button>
                                <Button size="icon" variant="secondary" className="size-9 rounded-full bg-white border border-slate-200 shadow-sm hover:text-red-500" onClick={() => handleDelete(speaker.ROWID)}>
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </Button>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="relative size-24 shrink-0">
                                    {speaker.imageUrl ? (
                                        <img src={getImageUrl(speaker.imageUrl)} alt={speaker.name} className="size-full rounded-2xl object-cover shadow-inner bg-slate-50 border border-slate-100" />
                                    ) : (
                                        <div className="size-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <span className="material-symbols-outlined text-4xl">person</span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 size-8 bg-green-500 border-4 border-white rounded-full"></div>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-black text-slate-800 truncate mb-0.5 leading-tight">{speaker.name}</h3>
                                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider truncate mb-1">{speaker.role}</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
                                            <span className="text-[11px] font-medium truncate">{speaker.company || 'Independent'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <span className="material-symbols-outlined text-[14px]">mail</span>
                                            <span className="text-[11px] font-medium truncate">{speaker.email}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">Strategic</span>
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-wider">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {speakers.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
                             <span className="material-symbols-outlined text-6xl mb-4 opacity-20">group_off</span>
                             <p className="text-sm font-black uppercase tracking-[0.3em] opacity-50">Empty Spreadsheet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SpeakerManagement;
