import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Database, Lock, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "What Data We Use",
      content:
        "MoM Generator accesses meeting transcripts from your Zoho account to generate Minutes of Meeting. We only process the text necessary to identify key points, decisions, and action items.",
      icon: <Database size={22} />,
    },
    {
      title: "How AI Is Used",
      content:
        "Meeting transcripts are analyzed using Google Gemini AI to create summaries and action items. Your data is used only for generating the meeting report and is not used to train external AI models.",
      icon: <Lock size={22} />,
    },
    {
      title: "Third-Party Services",
      content:
        "Our application integrates with Zoho APIs to fetch meeting data and Google Sheets APIs to export the final Minutes of Meeting. Authentication is handled securely using OAuth 2.0.",
      icon: <Globe size={22} />,
    },
    {
      title: "Your Control",
      content:
        "You can delete generated Minutes of Meeting or stored transcripts anytime from the dashboard. We give full control over your data and do not retain unnecessary information.",
      icon: <Shield size={22} />,
    },
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Privacy Policy
        </h1>

        <p className="text-slate-600 mb-10">
          At <strong>Pristine Infotech</strong>, protecting your data is important
          to us. This page explains how the MoM Generator uses and protects your
          information when generating Minutes of Meeting.
        </p>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="flex gap-4">
              <div className="text-indigo-600 mt-1">{section.icon}</div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  {section.title}
                </h2>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-sm text-slate-500">
          Last Updated: March 04, 2026
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;