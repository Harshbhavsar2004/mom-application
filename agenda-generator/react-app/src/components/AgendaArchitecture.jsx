import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import LoadingState from './LoadingState';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isAfter, isEqual } from "date-fns";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AgendaArchitecture = ({ visitData, onUpdate, onBack, onNext }) => {
  const { startDate, endDate, agenda = {} } = visitData;

  const [days, setDays] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set hours to midnight for accurate day difference calculation
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const newDays = [];
      for (let i = 0; i < diffDays; i++) {
        const currentDate = new Date(s);
        currentDate.setDate(s.getDate() + i);
        newDays.push({
          id: `day-${i + 1}`,
          label: `Day ${i + 1}`,
          date: currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          dateRaw: currentDate,
        });
      }
      setDays(newDays);
      if (newDays.length > 0 && !activeTab) {
        setActiveTab(newDays[0].id);
      }
    }
  }, [startDate, endDate]);

  const handleOpenSidebar = (session = null) => {
    setError("");
    if (session) {
      setEditingSession({
        ...session,
        startTime: session.startTime ? new Date(session.startTime) : null,
        endTime: session.endTime ? new Date(session.endTime) : null,
      });
    } else {
      const defaultStart = new Date();
      defaultStart.setHours(9, 0, 0, 0);
      const defaultEnd = new Date();
      defaultEnd.setHours(10, 30, 0, 0);

      setEditingSession({
        id: Date.now().toString(),
        startTime: defaultStart,
        endTime: defaultEnd,
        title: "",
        description: "",
      });
    }
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setEditingSession(null);
    setError("");
  };

  const checkOverlap = (start, end, sessions, excludeId) => {
    return sessions.some((s) => {
      if (s.id === excludeId) return false;
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return start < sEnd && end > sStart;
    });
  };

  const handleSaveSession = () => {
    if (!editingSession || !activeTab) return;
    if (!editingSession.startTime || !editingSession.endTime) {
      setError("Please select both start and end times.");
      return;
    }
    if (isAfter(editingSession.startTime, editingSession.endTime) || isEqual(editingSession.startTime, editingSession.endTime)) {
      setError("End time must be after start time.");
      return;
    }

    const currentDaySessions = agenda[activeTab] || [];
    if (checkOverlap(editingSession.startTime, editingSession.endTime, currentDaySessions, editingSession.id)) {
      setError("This time slot overlaps with an existing session.");
      return;
    }

    // Format for display and storage
    const timeDisplay = `${format(editingSession.startTime, "hh:mm aa")} - ${format(editingSession.endTime, "hh:mm aa")}`;
    const sessionToSave = {
      ...editingSession,
      time: timeDisplay,
      startTime: editingSession.startTime.toISOString(),
      endTime: editingSession.endTime.toISOString(),
    };

    let updatedSessions;
    const existingIndex = currentDaySessions.findIndex(
      (s) => s.id === editingSession.id,
    );
    if (existingIndex > -1) {
      updatedSessions = currentDaySessions.map((s) =>
        s.id === editingSession.id ? sessionToSave : s,
      );
    } else {
      updatedSessions = [...currentDaySessions, sessionToSave];
    }

    // Sort sessions by start time
    updatedSessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    onUpdate({
      ...visitData,
      agenda: {
        ...agenda,
        [activeTab]: updatedSessions,
      },
    });
    handleCloseSidebar();
  };

  const handleDeleteSession = (dayId, sessionId) => {
    const currentDaySessions = agenda[dayId] || [];
    const updatedSessions = currentDaySessions.filter(
      (s) => s.id !== sessionId,
    );

    onUpdate({
      ...visitData,
      agenda: {
        ...agenda,
        [dayId]: updatedSessions,
      },
    });
  };

  const getDayTimeline = (dayId) => {
    const sessions = agenda[dayId] || [];
    if (sessions.length === 0) return "";

    try {
      const sortedSessions = [...sessions].sort((a, b) => {
        return new Date(a.startTime) - new Date(b.startTime);
      });

      const startTime = format(new Date(sortedSessions[0].startTime), "hh:mm aa");
      const endTime = format(new Date(sortedSessions[sortedSessions.length - 1].endTime), "hh:mm aa");

      return `(${startTime} - ${endTime})`;
    } catch (e) {
      return "";
    }
  };

  return (
    <div
      className={`console-card relative ${isSidebarOpen ? "sheet-open" : "sheet-closed"}`}
    >
      <div className="p-8 border-b border-slate-300 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Agenda Architecture
          </h3>
          <p className="text-sm text-slate-500 font-medium font-poppins">
            Coordinate the chronological flow for {days.length} days of
            engagement.
          </p>
        </div>
        <Button
          className="bg-primary text-white font-bold h-9 px-6 rounded shadow-sm hover:opacity-90"
          onClick={() => handleOpenSidebar()}
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">
            add
          </span>
          Add Session
        </Button>
      </div>

      <div className="bg-[#f8fafc] min-h-[600px] flex items-center justify-center">
        {loading ? (
          <LoadingState message="Architecting Daily Engagement Flow..." />
        ) : days.length > 0 ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="flex w-full"
          >
            {/* Sidebar Navigation */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Timeline Overview
                </span>
              </div>
              <TabsList
                variant="line"
                className="flex flex-col h-auto w-full p-2 gap-1 items-stretch justify-start bg-transparent"
              >
                {days.map((day) => {
                  const timeline = getDayTimeline(day.id);
                  return (
                    <TabsTrigger
                      key={day.id}
                      value={day.id}
                      className="group flex flex-col items-start gap-1 px-4 py-3 h-auto rounded-lg border border-transparent data-active:border-slate-200 data-active:bg-blue-50/50 data-active:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold uppercase tracking-widest group-data-active:text-primary">
                          {day.label}
                        </span>
                        {timeline && (
                          <span className="material-symbols-outlined text-[14px] opacity-0 group-data-active:opacity-100 text-primary transition-opacity">
                            arrow_forward_ios
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 normal-case">
                        {timeline || "No modules scheduled"}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              {days.map((day) => (
                <TabsContent
                  key={day.id}
                  value={day.id}
                  className="p-10 m-0 focus-visible:outline-none"
                >
                  <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                    <div>
                      <h4 className="text-sm font-black text-primary uppercase tracking-[0.15em] mb-1">
                        {day.label} Modules
                      </h4>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">
                          calendar_today
                        </span>
                        {day.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Daily Span
                      </span>
                      <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {getDayTimeline(day.id).replace(/[()]/g, "") ||
                          "00:00 - 00:00"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(agenda[day.id] || []).length > 0 ? (
                      (agenda[day.id] || []).map((session) => (
                        <div
                          key={session.id}
                          className="p-6 h-32 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all group flex items-start gap-6 border-l-4 border-l-transparent hover:border-l-primary overflow-hidden"
                        >
                          <div className="w-32 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-poppins">
                              Time slot
                            </span>
                            <span className="text-xs font-black text-slate-700">
                              {session.time}
                            </span>
                          </div>
                          <div className="flex-1 w-0">
                            <h4 className="text-base font-bold text-slate-800 mb-1 truncate pr-4">
                              {session.title || "Untitled Session"}
                            </h4>
                            <div 
                              className="text-sm text-slate-500 font-medium leading-relaxed break-words whitespace-pre-wrap line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: session.description || "No description provided." }}
                            />
                          </div>
                          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-300 hover:text-primary hover:bg-blue-50"
                              onClick={() => handleOpenSidebar(session)}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteSession(day.id, session.id)
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-4">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                          <span className="material-symbols-outlined text-slate-200 text-3xl">
                            design_services
                          </span>
                        </div>
                        <div className="text-center">
                          <h5 className="text-slate-800 font-bold mb-1">
                            Blank Canvas
                          </h5>
                          <p className="text-slate-400 text-xs font-medium max-w-[200px] leading-relaxed">
                            No briefing modules architected for this day yet.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider h-8 border-slate-200"
                          onClick={() => handleOpenSidebar()}
                        >
                          Add Initialization Module
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="py-20 text-center">
            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="material-symbols-outlined text-slate-300 text-3xl">
                event_busy
              </span>
            </div>
            <h4 className="text-slate-800 font-bold">No Timeline Defined</h4>
            <p className="text-slate-500 text-sm mt-1">
              Please configure visit dates in the Details tab first.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 rounded-b-lg">
        <Button
          variant="ghost"
          className="font-bold text-slate-500 text-xs h-9 px-6"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          className="bg-primary text-white font-bold text-xs h-9 px-8 rounded shadow-sm hover:opacity-90 transition-all font-poppins"
          onClick={onNext}
        >
          Continue to Expert Alignment
        </Button>
      </div>

      {/* Slide-over Sidebar (Sheet) */}
      <div className="sheet-overlay" onClick={handleCloseSidebar}></div>
      <div className="sheet-content flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editingSession?.title ? "Edit Session" : "Add New Session"}
            </h3>
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              {days.find((d) => d.id === activeTab)?.label} Module
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSidebar}
            className="size-8 text-slate-400 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        {editingSession && (
          <div className="flex-1 overflow-auto p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Session Module Title
              </Label>
              <Input
                value={editingSession.title}
                onChange={(e) =>
                  setEditingSession({ ...editingSession, title: e.target.value })
                }
                placeholder="e.g. Opening Keynote & Strategy Overview"
                className="h-11 font-semibold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Start Time
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={editingSession.startTime}
                    onChange={(date) => setEditingSession({ ...editingSession, startTime: date })}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Start"
                    dateFormat="h:mm aa"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold pr-10"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] pointer-events-none">
                    schedule
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  End Time
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={editingSession.endTime}
                    onChange={(date) => setEditingSession({ ...editingSession, endTime: date })}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="End"
                    dateFormat="h:mm aa"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold pr-10"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] pointer-events-none">
                    schedule
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Module Description
              </Label>
              <div className="quill-editor-container ">
                <ReactQuill
                  theme="snow"
                  value={editingSession.description}
                  onChange={(content) =>
                    setEditingSession({
                      ...editingSession,
                      description: content,
                    })
                  }
                  placeholder="Define the objective and core talk-tracks for this session..."
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
          <Button
            className="w-full bg-primary text-white font-bold h-11 tracking-wide"
            onClick={handleSaveSession}
          >
            Save Blueprint Module
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgendaArchitecture;
