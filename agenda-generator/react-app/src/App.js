import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import CreateClientVisit from "./pages/CreateClientVisit";
import SpeakerManagement from "./pages/SpeakerManagement";
import ShareHub from "./pages/ShareHub";
import SharePage from "./pages/SharePage";
import SpeakerData from "./pages/SpeakerData";

import Dashboard from "./Dashboard";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Home/Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Agenda Ecosystem */}
          <Route path="agenda" element={<Navigate to="/agenda/details" replace />} />
          <Route path="agenda/details" element={<CreateClientVisit activeStepProp="details" />} />
          <Route path="agenda/info" element={<CreateClientVisit activeStepProp="agenda" />} />
          <Route path="agenda/speakers" element={<CreateClientVisit activeStepProp="speakers" />} />
          <Route path="agenda/assets" element={<CreateClientVisit activeStepProp="assets" />} />
          <Route path="agenda/review" element={<CreateClientVisit activeStepProp="review" />} />
          
          <Route path="speakers" element={<SpeakerManagement />} />
          <Route path="share/hub" element={<ShareHub />} />
        </Route>
        
        {/* Public Share Route - Outside Layout */}
        <Route path="/share/:id" element={<SharePage />} />
        <Route path="/speaker-data/:id" element={<SpeakerData />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
export default App;

