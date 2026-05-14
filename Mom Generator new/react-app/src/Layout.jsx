import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/ui/Sidebar";
import Login from "./LoginPage";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- Auth States ----
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    mailid: "",
    timeZone: "",
    createdTime: "",
  });

  // ---- Check Catalyst Authentication ----
  useEffect(() => {
    console.log("[Layout] Initiating Auth Check...");
    if (!window.catalyst || !window.catalyst.auth) {
        console.error("[Layout] Catalyst SDK not found");
        setIsFetching(false);
        return;
    }

    window.catalyst.auth
      .isUserAuthenticated()
      .then((result) => {
        console.log("[Layout] Auth Success:", result.content.email_id);
        const details = {
          userId: result.content.user_id,
          firstName: result.content.first_name,
          lastName: result.content.last_name,
          mailid: result.content.email_id,
          timeZone: result.content.time_zone,
          createdTime: result.content.created_time,
        };
        setUserDetails(details);
        setIsUserAuthenticated(true);
      })
      .catch((err) => {
        console.log("[Layout] Auth Failed:", err);
        setIsUserAuthenticated(false);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  // ---- Get current page from URL ----
  const currentPage =
    location.pathname.replace("/", "") || "dashboard";

  // ---- Loading State ----
  if (isFetching) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="relative flex flex-col items-center">
          {/* Main Logo/Icon with Pulse */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-40 animate-pulse" />
            <div className="relative w-48 h-auto flex items-center justify-center">
              <img 
                src="./Fristine-Infotech-Website-Logo.png" 
                alt="Fristine Infotech Logo" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          
          {/* Text and Indicator */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <h2 className="text-sm font-bold text-gray-900 tracking-[0.3em] uppercase">DIGITAL SYNERGY VENTURES GROUP</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Not Authenticated ----
  if (!isUserAuthenticated) {
    return <Login />;
  }

  // ---- Authenticated Layout ----
  return (
    <Sidebar
      currentPage={currentPage}
      onNavigate={(page) => navigate(`/${page}`)}
      userDetails={userDetails}   // optional if you want profile info
    >
      <Outlet context={{ userDetails }} />
    </Sidebar>
  );
}
