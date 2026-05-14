import DatePicker from "react-datepicker";
import { useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import LoadingState from "./LoadingState";

const CustomDateInput = React.forwardRef(
  ({ value, onClick, placeholder }, ref) => (
    <Button
      variant="outline"
      type="button"
      className="w-full h-10 justify-start text-left font-semibold bg-white border-slate-300 rounded hover:bg-slate-50 transition-all shadow-sm text-slate-700"
      onClick={onClick}
      ref={ref}
    >
      <span className="material-symbols-outlined mr-2 text-[18px] text-slate-400">
        calendar_month
      </span>
      <span className="text-[13px]">
        {value || (
          <span className="text-slate-400 font-medium">{placeholder}</span>
        )}
      </span>
    </Button>
  ),
);

const CustomTimeInput = React.forwardRef(({ value, onClick }, ref) => (
  <Button
    variant="outline"
    type="button"
    className="w-32 h-10 justify-start text-left font-semibold bg-white border-slate-300 rounded hover:bg-slate-50 transition-all shadow-sm text-slate-700"
    onClick={onClick}
    ref={ref}
  >
    <span className="material-symbols-outlined mr-2 text-[18px] text-slate-400">
      schedule
    </span>
    <span className="text-[13px]">{value}</span>
  </Button>
));

const VisitCoreParameters = ({ initialData, onContinue, onDiscard }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    mode: initialData?.mode || "In-Person",
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    location: initialData?.location || "",
    objective: initialData?.objective || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        mode: initialData.mode || "In-Person",
        startDate: initialData.startDate || new Date(),
        endDate: initialData.endDate || new Date(),
        location: initialData.location || "",
        objective: initialData.objective || "",
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id === "visit-title" ? "title" : id]: value,
    }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleModeChange = (mode) => {
    setFormData((prev) => ({ ...prev, mode }));
  };

  const handleDateChange = (type, date) => {
    setFormData((prev) => {
      const newData = { ...prev, [type]: date };
      // If start date is moved ahead of end date, adjust end date
      if (type === 'startDate' && date > prev.endDate) {
        newData.endDate = date;
      }
      return newData;
    });
    if (errors.dates) {
      setErrors((prev) => ({ ...prev, dates: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Visit title is required";
    if (!formData.location.trim())
      newErrors.location = "Deployment location is required";

    const now = new Date();
    if (formData.startDate < now) {
      newErrors.dates = "Start time must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialize = () => {
    if (validate()) {
      console.log("Initializing architecture with:", formData);
      onContinue(formData);
    }
  };

  return (
    <div className="console-card">
      <div className="p-8 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
          Visit Details
        </h3>
        <p className="text-sm text-slate-500 font-medium font-poppins">
          Initialize the foundational blueprint for this client visit.
        </p>
      </div>

      <div className="p-10 space-y-10">
        {loading ? (
          <LoadingState message="Preparing Briefing Environment..." />
        ) : (
          <>
            {/* Visit Title */}
            <div className="space-y-3">
          <Label
            htmlFor="visit-title"
            className="text-[11px] font-bold uppercase tracking-widest text-slate-600"
          >
            Title of The Visit{" "}
            {errors.title && (
              <span className="text-red-500 normal-case ml-2 font-medium">
                ({errors.title})
              </span>
            )}
          </Label>
          <Input
            id="visit-title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Q4 Executive Strategy Review"
            className={`h-11 text-sm font-semibold px-4 bg-white border-slate-300 rounded focus:border-primary/50 transition-all shadow-sm w-full placeholder:text-slate-300 ${errors.title ? "border-red-300 ring-1 ring-red-100" : ""}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Visit Type / Deployment Mode */}
          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              Mode of the Visit
            </Label>
            <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded h-11 items-center">
              {["In-Person", "Hybrid", "Digital"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 h-8 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                    formData.mode === mode
                      ? "bg-white text-primary shadow-sm border border-slate-300"
                      : "text-slate-400 hover:text-slate-500"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              Location of the Visit{" "}
              {errors.location && (
                <span className="text-red-500 normal-case ml-2 font-medium">
                  ({errors.location})
                </span>
              )}
            </Label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                location_on
              </span>
              <Input
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Physical HQ or Secure Digital Link"
                className={`h-11 pl-10 bg-white border-slate-300 rounded focus:border-primary/50 transition-all shadow-sm w-full placeholder:text-slate-300 ${errors.location ? "border-red-300 ring-1 ring-red-100" : ""}`}
              />
            </div>
          </div>
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              Chronology Start{" "}
              {errors.dates && (
                <span className="text-red-500 normal-case ml-2 font-medium">
                  ({errors.dates})
                </span>
              )}
            </Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => handleDateChange("startDate", date)}
                  customInput={<CustomDateInput placeholder="Select Date" />}
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                />
              </div>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => handleDateChange("startDate", date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                customInput={<CustomTimeInput />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              Chronology End
            </Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => handleDateChange("endDate", date)}
                  customInput={<CustomDateInput placeholder="Select Date" />}
                  dateFormat="MMMM d, yyyy"
                />
              </div>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => handleDateChange("endDate", date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                customInput={<CustomTimeInput />}
              />
            </div>
          </div>
        </div>

        {/* Objective */}
        <div className="space-y-3">
          <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            Mission Objective
          </Label>
          <textarea
            id="objective"
            value={formData.objective}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded border border-slate-300 bg-white focus:border-primary/50 transition-all shadow-sm outline-none placeholder:text-slate-300 text-sm font-medium leading-relaxed min-h-32"
            placeholder="Define the core intent and desired outcome..."
          />
          </div>
        </>
      )}
    </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 items-center">
        <Button
          variant="ghost"
          type="button"
          className="font-bold text-slate-500 hover:text-slate-800 text-xs h-9 px-4 rounded"
          onClick={onDiscard}
        >
          Discard Session
        </Button>
        <Button
          type="button"
          className="bg-primary text-white font-bold text-xs h-9 px-8 rounded shadow-sm hover:opacity-90 transition-all font-poppins"
          onClick={handleInitialize}
        >
          Initialize Architecture
        </Button>
      </div>
    </div>
  );
};

export default VisitCoreParameters;
