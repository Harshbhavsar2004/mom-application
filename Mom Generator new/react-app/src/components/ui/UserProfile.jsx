import React from "react";
import { X, Mail, User, Calendar, MapPin, Key } from "lucide-react";

export default function UserProfile({ userDetails, onClose, onLogout }) {
  if (!userDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 relative animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 h-24 relative"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        <div className="px-6 pb-6 pt-0">
          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white">
              {userDetails.firstName?.charAt(0) || "U"}{userDetails.lastName?.charAt(0) || ""}
            </div>
          </div>

          {/* User Name */}
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">
            {userDetails.firstName} {userDetails.lastName}
          </h2>
          <p className="text-sm text-center text-indigo-600 font-medium mb-6">Account Details</p>

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* User ID */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors duration-300 border border-slate-200 hover:border-indigo-300">
              <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-600 flex-shrink-0 mt-0.5">
                <Key size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</p>
                <p className="text-sm font-medium text-slate-800">{userDetails.userId}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors duration-300 border border-slate-200 hover:border-indigo-300">
              <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-600 flex-shrink-0 mt-0.5">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Address</p>
                <p className="text-sm font-medium text-slate-800">{userDetails.mailid}</p>
              </div>
            </div>

            {/* Time Zone */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors duration-300 border border-slate-200 hover:border-indigo-300">
              <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-600 flex-shrink-0 mt-0.5">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time Zone</p>
                <p className="text-sm font-medium text-slate-800">{userDetails.timeZone}</p>
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors duration-300 border border-slate-200 hover:border-indigo-300">
              <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-600 flex-shrink-0 mt-0.5">
                <Calendar size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Since</p>
                <p className="text-sm font-medium text-slate-800">{userDetails.createdTime}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="mt-8 w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
