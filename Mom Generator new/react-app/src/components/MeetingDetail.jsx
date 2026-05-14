import React, { useState } from "react";
import ParticipantManager from "./ParticipantManager";
import MinutesGenerator from "./MinutesGenerator";
import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Users, FileText, Download, Sparkles, Calendar, Clock } from "lucide-react";

const MeetingDetail = ({ meeting }) => {
  const { userDetails } = useOutletContext();
  const userId = userDetails?.userId;

  const [participants, setParticipants] = useState([]);
  const [useAutomated, setUseAutomated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMinutes, setGeneratedMinutes] = useState(null);

  /* -------------------------------------------------- */
  /* Participant Handling */
  /* -------------------------------------------------- */
  const handleAddParticipant = (name) => {
    if (name && !participants.includes(name)) {
      setParticipants([...participants, name]);
    }
  };

  const handleRemoveParticipant = (name) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  /* -------------------------------------------------- */
  /* Date Parsing */
  /* -------------------------------------------------- */
  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    const currentYear = new Date().getFullYear();
    // Check if it's already a full date or needs the year
    if (dateValue.includes(currentYear.toString())) {
      return new Date(dateValue);
    }
    return new Date(`${dateValue} ${currentYear}`);
  };

  /* -------------------------------------------------- */
  /* Generate Minutes */
  /* -------------------------------------------------- */
  const handleGenerateMinutes = async () => {
    setIsGenerating(true);

    try {
      const data = await api.generateMinutes({
        meetingId: meeting.erecordingId || meeting.id,
        userId: userId,
        participants: useAutomated ? [] : participants,
        useAutomated: useAutomated,
        meetingDate: meeting.sDate || meeting.date,
        meetingTitle: meeting.topic || meeting.title
      });

      setGeneratedMinutes(data);
    } catch (error) {
      console.error("Error generating minutes:", error);
      toast.error(error.message || "Failed to generate meeting minutes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  /* -------------------------------------------------- */
  /* Export Excel */
  /* -------------------------------------------------- */
  const handleExportExcel = async () => {
    if (!generatedMinutes) return;

    try {
      const blob = await api.exportExcel({
        minutes: generatedMinutes,
        meetingTitle: meeting.topic || meeting.title,
        meetingDate: meeting.sDate || meeting.date,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meeting-minutes-${meeting.erecordingId || meeting.id
        }.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/30">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {meeting.topic || meeting.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(parseDate(meeting.sDate || meeting.date), "MMMM dd, yyyy")}
                </span>
                {meeting.durationInMins && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {meeting.durationInMins} minutes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Participants Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
                <Users className="w-4 h-4 text-blue-600" />
                <h2>Participants</h2>
              </div>

              <div className="space-y-3">
                <div className="flex p-1 bg-gray-100 rounded-lg">
                  <button
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${useAutomated ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => {
                      setUseAutomated(true);
                      setParticipants([]);
                    }}
                  >
                    Auto Extract
                  </button>
                  <button
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!useAutomated ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setUseAutomated(false)}
                  >
                    Manual
                  </button>
                </div>

                {!useAutomated ? (
                  <div className="space-y-3">
                    <ParticipantManager
                      participants={participants}
                      onAddParticipant={handleAddParticipant}
                      onRemoveParticipant={handleRemoveParticipant}
                    />

                    {participants.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                        {participants.map((p) => (
                          <div
                            key={p}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 border border-blue-100/50"
                          >
                            {p}
                            <button
                              onClick={() => handleRemoveParticipant(p)}
                              className="hover:text-blue-900 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Smart extraction enabled. Participants will be correctly identified from the recording transcript automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <button
                onClick={handleGenerateMinutes}
                disabled={isGenerating || (!useAutomated && participants.length === 0)}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isGenerating
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-[0.98]"
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Minutes
                  </>
                )}
              </button>

              {!useAutomated && participants.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
                  Add at least one participant to begin
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {/* Output Section */}
            {generatedMinutes ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Meeting Minutes</span>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Excel
                  </button>
                </div>
                <div className="p-0">
                  <MinutesGenerator
                    minutes={generatedMinutes}
                    onExport={null} // Handled by header button
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center p-12 text-center h-[400px]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Provide participant details and click the generate button to transform your recording into professional meeting minutes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;
