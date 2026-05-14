import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, ChevronRight } from "lucide-react";

const MeetingList = ({
  recordings = [],
  selectedRecording,
  onSelectRecording,
  loading,
}) => {
  // Fix for "Thu, 19 Feb" (no year)
  const parseDate = (dateValue) => {
    if (!dateValue) return null;

    // Timestamp case
    if (!isNaN(dateValue)) {
      return new Date(Number(dateValue));
    }

    // Add current year
    const currentYear = new Date().getFullYear();
    return new Date(`${dateValue} ${currentYear}`);
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b space-y-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!recordings.length) {
    return (
      <div className="w-80 border-r bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No recordings found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-r overflow-y-auto bg-white flex flex-col">
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recordings ({recordings.length})
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {recordings.map((rec) => {
          const id = rec.erecordingId || rec.id;
          const title = rec.topic || "Untitled Recording";

          const rawDate = rec.sDate;
          const parsedDate = parseDate(rawDate);

          const duration = rec.durationInMins || rec.duration || "0";

          const isSelected =
            (selectedRecording?.erecordingId ||
              selectedRecording?.id) === id;

          return (
            <div
              key={id}
              onClick={() => onSelectRecording(rec)}
              className={`group p-4 cursor-pointer transition-all relative ${isSelected
                  ? "bg-blue-50/50"
                  : "hover:bg-gray-50/80"
                }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
              )}

              <div className="flex justify-between items-start gap-2">
                <h3 className={`font-semibold text-sm leading-tight transition-colors ${isSelected ? "text-blue-700" : "text-gray-900 group-hover:text-blue-600"
                  }`}>
                  {title}
                </h3>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-blue-400 translate-x-1" : "text-gray-300 opacity-0 group-hover:opacity-100"
                  }`} />
              </div>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>
                    {parsedDate && !isNaN(parsedDate)
                      ? format(parsedDate, "MMM dd, yyyy")
                      : rawDate || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{duration} min</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingList;
