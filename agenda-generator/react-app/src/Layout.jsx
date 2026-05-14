import LoginPage from "./LoginPage.jsx";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/ui/Sidebar";
import { TopBar } from "./components/ui/TopBar";
import AppLoader from "./AppLoader.jsx";

function Layout() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showLoader, setShowLoader] = useState(true); // controls min time
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const startTime = Date.now();

    window.catalyst.auth
      .isUserAuthenticated()
      .then((result) => {
        let details = {
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
      .catch(() => {})
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(2200 - elapsed, 0); // ensure 2.2s

        setTimeout(() => {
          setIsFetching(false);
        }, remaining);
      });
  }, []);

  if (isFetching || showLoader) {
    return <AppLoader onFinish={() => setShowLoader(false)} />;
  }

  if (!isUserAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Sidebar userDetails={userDetails}>
      <div className="flex flex-col h-screen">
        <TopBar userDetails={userDetails} />
        <div className="flex-1 overflow-auto">
          <Outlet context={{ userDetails }} />
        </div>
      </div>
    </Sidebar>
  );
}

export default Layout;