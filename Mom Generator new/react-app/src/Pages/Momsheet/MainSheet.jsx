import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Trash2,
  Shield,
  UserPlus,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Upload,
  Plus,
  Download,
} from "lucide-react";
import api from "../../services/api";
import { gsap } from "gsap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function MainSheet() {
  const { userDetails } = useOutletContext();
  const userId = userDetails?.userId;

  // Flow State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data State
  const [recordings, setRecordings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [generatedMom, setGeneratedMom] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Discovery Ready");

  // Google Sheet State
  const [googleSheets, setGoogleSheets] = useState([]);
  const [selectedGoogleSheetId, setSelectedGoogleSheetId] = useState("");
  const [googleSaving, setGoogleSaving] = useState(false);
  const [googleSaveResult, setGoogleSaveResult] = useState(null);

  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  // Filter/Search
  const [searchTerm, setSearchTerm] = useState("");
  const [manualTranscription, setManualTranscription] = useState("");

  const stepRef = useRef(null);
  const fileInputRef = useRef(null);

  /* -------------------------------------------------- */
  /* Initialization */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    const initData = async () => {
      setLoading(true);
      setStatusMessage("Scanning Intelligence Repository...");
      await new Promise((r) => setTimeout(r, 800));

      setStatusMessage("Connecting Knowledge Bases...");
      try {
        const [recs, teamData] = await Promise.all([
          api.getStoredRecordings(userId),
          api.getTeams(userId),
        ]);

        await new Promise((r) => setTimeout(r, 600));
        setStatusMessage("Optimizing Neural Cache...");
        setRecordings(recs || []);
        setTeams(teamData.teams || []);

        await new Promise((r) => setTimeout(r, 700));
        setStatusMessage("System Synchronized");
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [userId]);

  /* -------------------------------------------------- */
  /* Transitions */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!stepRef.current) return;
    gsap.fromTo(
      stepRef.current,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
    );
  }, [step]);

  /* -------------------------------------------------- */
  /* Step 2 Logic: Participant Mapping */
  /* -------------------------------------------------- */
  const handleTeamSelect = (team) => {
    const teamParts = team.participants.map((p) => ({
      name: p.name,
      email: p.email,
    }));
    setSelectedParticipants((prev) => {
      const existingEmails = new Set(prev.map((p) => p.email));
      const newParts = teamParts.filter((p) => !existingEmails.has(p.email));
      return [...prev, ...newParts];
    });
  };

  const addManualParticipant = () => {
    setSelectedParticipants([...selectedParticipants, { name: "", email: "" }]);
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...selectedParticipants];
    updated[index][field] = value;
    setSelectedParticipants(updated);
  };

  const removeParticipant = (index) => {
    setSelectedParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  /* -------------------------------------------------- */
  /* Step 3 Logic: Generation → Zoho Sheet              */
  /* -------------------------------------------------- */
  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedMom(null);
    setGoogleSaveResult(null);
    setStep(3);

    const statuses = [
      "Analyzing Acoustic Fingerprints...",
      "Extracting Semantic Clusters...",
      "Refining Executive Synthesis...",
      "Synthesizing Strategic Action Items...",
      "Finalizing Intelligence Output...",
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setStatusMessage(statuses[currentLogIndex]);
      currentLogIndex = (currentLogIndex + 1) % statuses.length;
    }, 2000);

    try {
      setStatusMessage(statuses[0]);

      const payload = {
        userId,
        participants: selectedParticipants.filter((p) => p.name && p.email),
        meetingDate: selectedMeeting.sDate,
        meetingTitle: selectedMeeting.topic,
      };

      if (selectedMeeting.isManual) {
        payload.transcriptionText = manualTranscription;
      } else {
        payload.meetingId = selectedMeeting.erecordingId;
      }

      // Generate MoM + fetch Google Sheets in parallel
      const [mom, googleData] = await Promise.all([
        api.generateMinutes(payload),
        api.listGoogleSheets(userId).catch(() => ({})),
      ]);

      await new Promise((r) => setTimeout(r, 1500));

      // Update Google List (Optional here but good to sync)
      const gList = googleData?.workbooks || [];
      setGoogleSheets(gList);

      setGeneratedMom(mom);
    } catch (err) {
      console.error("Gen Error:", err);
      toast.error("Failed to generate minutes: " + err.message);
      setStep(2);
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  const handleSaveToGoogle = async () => {
    if (!generatedMom) return;
    setGoogleSaving(true);
    setGoogleSaveResult(null);
    try {
      const result = await api.saveMoMToGoogleSheet({
        userId,
        workbookId: selectedGoogleSheetId,
        meetingDate: selectedMeeting.sDate,
        momData: generatedMom,
        meetingDetails: {
          topic: selectedMeeting.topic,
          location: meetingLocation,
          time: meetingTime,
        },
      });
      setGoogleSaveResult(result);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "";
      toast.error("Failed to save to Google Sheet: " + errMsg);
    } finally {
      setGoogleSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedMom) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. Colorful Header ---
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MINUTES OF THE MEETING", pageWidth / 2, 25, { align: "center" });

    // --- 2. Meeting Context Table ---
    autoTable(doc, {
      startY: 50,
      margin: { left: 15, right: 15 },
      body: [
        ["Title", ":", selectedMeeting?.topic || "N/A"],
        ["Location", ":", meetingLocation || "N/A"],
        ["Date", ":", selectedMeeting?.sDate || new Date().toLocaleDateString()],
        ["Time", ":", meetingTime || "N/A"],
        ["Attendees", ":", (selectedParticipants || []).map(p => p.name).join(", ") || "N/A"]
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30 },
        1: { cellWidth: 5 },
        2: { fontStyle: "normal" }
      }
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // --- 3. Executive Summary ---
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(14);
    doc.text("EXECUTIVE SUMMARY", 15, currentY);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitSummary = doc.splitTextToSize(generatedMom.executiveSummary || "", pageWidth - 30);
    doc.text(splitSummary, 15, currentY + 8);
    
    currentY += (splitSummary.length * 5) + 20;

    // --- 4. Agenda Section ---
    if (generatedMom.agendaItems?.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [["#", "AGENDA ITEMS"]],
        body: generatedMom.agendaItems.map((item, i) => [i + 1, typeof item === "string" ? item : item.summary || item.topic]),
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 10, halign: "center" } }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- 5. Key Discussion Points ---
    if (generatedMom.keyDiscussionPoints?.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      autoTable(doc, {
        startY: currentY,
        head: [["#", "DECISIONS & KEY POINTS"]],
        body: generatedMom.keyDiscussionPoints.map((pt, i) => [i + 1, typeof pt === "string" ? pt : pt.decision || pt]),
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" }, // Emerald-500
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 10, halign: "center" } }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- 6. Conclusion ---
    if (generatedMom.conclusion) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitConclusion = doc.splitTextToSize(generatedMom.conclusion, pageWidth - 40);
      const textHeight = splitConclusion.length * 5; // ~5 units per line at size 10
      const boxHeight = textHeight + 20; // Padding for header and margins

      if (currentY + boxHeight > 280) { doc.addPage(); currentY = 20; }

      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(15, currentY, pageWidth - 30, boxHeight, "F");
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.rect(15, currentY, pageWidth - 30, boxHeight, "S");
      
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CONCLUSION", 20, currentY + 10);
      
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(splitConclusion, 20, currentY + 18);
    }

    // --- 7. Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Minutes of Meeting Application By Fristine Infotech - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
    }

    doc.save(`MoM_${selectedMeeting?.topic || "Meeting"}.pdf`);
  };

  /* -------------------------------------------------- */
  /* Render Helpers */
  /* -------------------------------------------------- */
  const filteredRecordings = recordings.filter((r) =>
    r.topic.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setManualTranscription(text);
      setSelectedMeeting({
        topic: file.name.replace(".txt", ""),
        sDate: new Date().toISOString().split("T")[0],
        isManual: true,
      });
      setStep(2);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Progress Stepper */}
        <div className="flex items-center justify-start md:justify-center mb-12 overflow-x-auto pb-4 custom-scrollbar-h">
          <div className="flex items-center min-w-max px-4 md:px-0">
            {[
              { id: 1, label: "Select Session", icon: Calendar },
              { id: 2, label: "Map Intelligence", icon: Users },
              { id: 3, label: "Synthesis", icon: Sparkles },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center gap-2 group transition-all ${step >= s.id ? "opacity-100" : "opacity-40"}`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                      step === s.id
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110"
                        : step > s.id
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    <s.icon size={step === s.id ? 20 : 18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 rounded-full ${step > s.id ? "bg-emerald-500" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div ref={stepRef}>
          {/* STEP 1: SESSION SELECTION */}
          {step === 1 && (
            <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Intelligence Repository
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base font-medium">
                    Select a synced session to begin the transformation.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search session library..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <input
                    type="file"
                    accept=".txt"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="animate-spin mb-4" size={40} />
                  <p className="font-black uppercase tracking-widest text-xs">
                    Accessing DataStore...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Manual Upload Card */}
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="group flex flex-col items-center justify-center p-8 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[32px] hover:bg-indigo-50 hover:border-indigo-400 transition-all text-center"
                  >
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-lg font-black text-indigo-900 mb-1">
                      New Session
                    </h3>
                    <p className="text-indigo-600/60 text-sm font-bold uppercase tracking-widest">
                      Upload Transcript
                    </p>
                  </button>

                  {filteredRecordings.map((rec) => (
                    <button
                      key={rec.erecordingId}
                      onClick={() => {
                        setSelectedMeeting(rec);
                        setStep(2);
                      }}
                      className={`text-left p-6 sm:p-8 bg-white rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 group ${
                        selectedMeeting?.erecordingId === rec.erecordingId
                          ? "border-indigo-600 ring-4 ring-indigo-50"
                          : "border-slate-100 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                          {rec.durationInMins}m
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 mb-2 line-clamp-2 leading-tight">
                        {rec.topic}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-medium">
                        <Calendar size={12} />
                        {rec.sDate}
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">
                          Start Transformation
                        </span>
                        <ArrowRight
                          size={18}
                          className="text-indigo-400 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PARTICIPANT ORCHESTRATION */}
          {step === 2 && (
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
              <div className="flex flex-col-reverse sm:flex-row items-center sm:items-end justify-between gap-6">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 font-bold transition-colors shadow-sm"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <div className="text-center sm:text-right">
                  <h2 className="text-2xl font-black text-slate-900">
                    Intelligence Mapping
                  </h2>
                  <p className="text-slate-500 text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                    @{selectedMeeting?.topic}
                  </p>
                </div>
              </div>

              {/* Meeting Context Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Meeting Location</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder="e.g. Pune Office / Zoom"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Meeting Time</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 11:00 AM - 12:00 PM IST"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Available Teams */}
                <div className="lg:col-span-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 text-center lg:text-left">
                    Knowledge Bases
                  </h3>
                  <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 px-2 lg:px-0 scrollbar-hide">
                    {teams.map((team) => (
                      <button
                        key={team.ROWID}
                        onClick={() => handleTeamSelect(team)}
                        className="flex-shrink-0 w-64 lg:w-full text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Shield size={16} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm truncate w-32 md:w-auto">
                              {team.teamName}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {team.participants?.length || 0} Members
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {teams.length === 0 && (
                      <div className="w-full p-8 text-center bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        <p className="text-xs font-bold uppercase">
                          No Teams Found
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Participants */}
                <div className="lg:col-span-8">
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Users className="text-indigo-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800">
                          Active Directory
                        </h3>
                      </div>
                      <button
                        onClick={addManualParticipant}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                      >
                        <UserPlus size={14} /> Add Guest
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedParticipants.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-indigo-100 transition-all"
                        >
                          <div className="flex flex-1 gap-3">
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={p.name}
                              onChange={(e) =>
                                updateParticipant(idx, "name", e.target.value)
                              }
                              className="flex-1 bg-white px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                            />
                            <button
                              onClick={() => removeParticipant(idx)}
                              className="md:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-rose-500 shadow-sm"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={p.email}
                            onChange={(e) =>
                              updateParticipant(idx, "email", e.target.value)
                            }
                            className="flex-[1.5] bg-white px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                          />
                          <button
                            onClick={() => removeParticipant(idx)}
                            className="hidden md:block p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      {selectedParticipants.length === 0 && (
                        <div className="py-12 text-center text-slate-400">
                          <Users
                            className="mx-auto mb-4 opacity-10"
                            size={48}
                          />
                          <p className="font-black uppercase tracking-widest text-xs">
                            Awaiting mapping...
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex justify-center sm:justify-end">
                      <button
                        onClick={handleGenerate}
                        disabled={selectedParticipants.length === 0}
                        className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[20px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        <Sparkles size={18} /> Execute Synthesis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SYNTHESIS & REVIEW */}
          {step === 3 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {generating ? (
                <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Sparkles
                      className="absolute inset-0 m-auto text-indigo-600 animate-pulse"
                      size={32}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      AI Synthesis in Progress
                    </h2>
                    <p className="text-slate-500 font-medium uppercase text-xs tracking-[0.3em] mt-2 animate-pulse">
                      {statusMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {/* Header row */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500 text-white rounded-[20px] shadow-lg shadow-emerald-100">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          Synthesis Complete
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base font-medium tracking-wide">
                          Professional minutes curated by Gemini Intelligence.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap xl:flex-nowrap gap-3 w-full xl:w-auto">
                      <button
                        onClick={handleDownloadPDF}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
                      >
                        <Download size={16} /> Download PDF
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 xl:flex-none px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                      >
                        New Session
                      </button>
                    </div>
                  </div>

                  {/* MoM content */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-7 space-y-6">
                      {/* Executive Summary */}
                      {generatedMom?.executiveSummary && (
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <FileText size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">
                              Executive Summary
                            </h3>
                          </div>
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {generatedMom.executiveSummary}
                          </p>
                        </div>
                      )}

                      {/* Agenda Items */}
                      {generatedMom?.agendaItems?.length > 0 && (
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <Clock size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">
                              Agenda Items
                            </h3>
                          </div>
                          <ul className="space-y-4">
                            {generatedMom.agendaItems.map((item, idx) => (
                              <li key={idx} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="space-y-1">
                                  <p className="text-slate-800 font-bold text-sm">
                                    {typeof item === "string" ? item : item.topic || item.summary}
                                  </p>
                                  {item.description && (
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Discussion Points */}
                      {generatedMom?.keyDiscussionPoints?.length > 0 && (
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <CheckCircle2 size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">
                              Key Decisions & Discussion
                            </h3>
                          </div>
                          <ol className="space-y-3">
                            {generatedMom.keyDiscussionPoints.map((pt, idx) => (
                              <li key={idx} className="flex items-start gap-4">
                                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <p className="text-slate-700 font-medium leading-relaxed pt-0.5">
                                  {typeof pt === "string" ? pt : pt.decision || pt}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Conclusion */}
                      {generatedMom?.conclusion && (
                        <div className="bg-indigo-600 text-white p-8 rounded-[32px] shadow-xl space-y-4">
                          <h3 className="font-black uppercase tracking-widest text-xs text-indigo-200">
                            Conclusion
                          </h3>
                          <p className="leading-relaxed font-medium text-indigo-50">
                            {generatedMom.conclusion}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="xl:col-span-5">
                      <div className="sticky top-10 space-y-6">
                        {/* Google Save Panel */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                                    <FileSpreadsheet size={22} />
                                </div>
                                <h3 className="font-black uppercase tracking-widest text-xs text-slate-700">
                                    Export to Google Sheets
                                </h3>
                            </div>

                            {googleSaveResult ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 text-emerald-700">
                                        <CheckCircle2 size={24} />
                                        <div>
                                          <p className="text-sm font-black">Success!</p>
                                          <p className="text-xs font-bold opacity-80">MoM published to "{googleSaveResult.worksheetName || googleSaveResult.name}"</p>
                                        </div>
                                    </div>
                                    <a href={googleSaveResult.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                                        <ExternalLink size={14} /> Open Spreadsheet
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                      <p className="text-xs font-bold text-slate-500 leading-relaxed mb-3">
                                        Select a workbook to populate with today's minutes:
                                      </p>
                                      
                                      <select
                                        value={selectedGoogleSheetId}
                                        onChange={(e) => setSelectedGoogleSheetId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                                      >
                                        <option value="">-- Choose a Workbook --</option>
                                        {googleSheets.map(sheet => (
                                          <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                                        ))}
                                      </select>
                                      
                                      {googleSheets.length === 0 && (
                                        <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                                          <p className="text-[10px] text-indigo-600 font-bold leading-tight">
                                            No managed sheets found. Go to <Link to="/google-sheets" className="underline">Google Sheets</Link> to add one.
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                        onClick={handleSaveToGoogle}
                                        disabled={googleSaving || !selectedGoogleSheetId}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {googleSaving ? <><Loader2 size={18} className="animate-spin" /> Copying & Populating…</> : <><FileSpreadsheet size={18} /> Export Now</>}
                                    </button>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .custom-scrollbar-h::-webkit-scrollbar {
          height: 3px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
