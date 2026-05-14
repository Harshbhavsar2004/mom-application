import { Link2, CheckCircle2 } from "lucide-react";

export default function ConnectionSection({ userId, zohoConnected, googleConnected }) {
  const connectZoho = () => {
    window.location.href =
      `${process.env.REACT_APP_API_BASE_URL}/connect?user_id=${userId}`;
  };

  const connectGoogle = () => {
    window.location.href =
      `${process.env.REACT_APP_API_BASE_URL}/google-connect?user_id=${userId}`;
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Zoho Connection */}
      <button
        onClick={connectZoho}
        disabled={zohoConnected}
        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${zohoConnected
          ? "bg-slate-100 text-slate-400 cursor-default"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
          }`}
      >
        {zohoConnected ? (
          <>
            <CheckCircle2 size={18} />
            Zoho Connected
          </>
        ) : (
          <>
            <Link2 size={18} />
            Connect Zoho Meeting
          </>
        )}
      </button>

      {/* Google Connection */}
      <button
        onClick={connectGoogle}
        disabled={googleConnected}
        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${googleConnected
          ? "bg-slate-100 text-slate-400 cursor-default"
          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100"
          }`}
      >
        {googleConnected ? (
          <>
            <CheckCircle2 size={18} />
            Google Connected
          </>
        ) : (
          <>
            <Link2 size={18} />
            Connect Google Sheets
          </>
        )}
      </button>
    </div>
  );
}
