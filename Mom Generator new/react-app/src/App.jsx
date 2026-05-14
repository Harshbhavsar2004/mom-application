import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./Pages/Dashboard/Dashboard";
import MainSheet from "./Pages/Momsheet/MainSheet";
import SyncPage from "./Pages/synchronization/SyncPage";
import Participants from "./Pages/Participants/Participants";
import Templates from "./Pages/Templates/Templates";
import TemplateBuilder from "./Pages/Templates/TemplateBuilder";
import CreateMeeting from "./Pages/CreateMeeting/CreateMeeting";
import GoogleSheetPage from "./Pages/ZohoSheet/GoogleSheet";
import HomePage from "./Pages/Home/HomePage";
import PrivacyPolicy from "./Pages/Legal/PrivacyPolicy";
import TermsOfService from "./Pages/Legal/TermsOfService";
import { Toaster } from "react-hot-toast";
 
function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes - Top Priority */}
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Protected Routes Wrapper */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/minutes-generator" element={<MainSheet />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/teams" element={<Participants />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/create" element={<TemplateBuilder />} />
          <Route path="/create-meeting" element={<CreateMeeting />} />
          <Route path="/google-sheets" element={<GoogleSheetPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
export default App;
