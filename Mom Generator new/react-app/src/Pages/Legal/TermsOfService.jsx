import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, FileText, UserCheck, ShieldAlert } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using the MoM Generator, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
      icon: <UserCheck size={22} />,
    },
    {
      title: "2. Description of Service",
      content:
        "MoM Generator provides an automated tool for generating Minutes of Meeting from Zoho Meeting transcripts using AI. We provide the infrastructure to process and export this data to Google Sheets.",
      icon: <FileText size={22} />,
    },
    {
      title: "3. User Responsibilities",
      content:
        "Users are responsible for maintaining the confidentiality of their accounts and for all activities that occur under their account. You must ensure you have the right to process the transcripts you upload.",
      icon: <ShieldAlert size={22} />,
    },
    {
      title: "4. Limitation of Liability",
      content:
        "Pristine Infotech shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.",
      icon: <Scale size={22} />,
    },
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Terms of Service
        </h1>

        <p className="text-slate-600 mb-10">
          Please read these Terms of Service carefully before using the MoM Generator developed by <strong>Pristine Infotech</strong>.
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

export default TermsOfService;
