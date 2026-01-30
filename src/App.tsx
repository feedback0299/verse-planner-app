import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/Calendar";
import Admin from "@/pages/Admin";
import SuperAdmin from "@/pages/SuperAdmin";
import Magazine from "@/pages/Magazine";
import MagazineAdmin from "@/pages/MagazineAdmin";
import Members from "@/pages/Members";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import VideoRoom from "./pages/VideoRoom";
import WorldMap from "./pages/WorldMap";
import Globe3D from "./pages/Globe3D";
import BranchAdmin from "./pages/BranchAdmin";
import { VerseProvider } from "@/contexts/VerseContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Planner from "@/pages/Planner";
import ContestAdmin from "@/pages/ContestAdmin";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { authConfig } from "@/config/authConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const isVideoRoom = location.pathname.startsWith('/room/');
  const isAdmin = !!(localStorage.getItem('admin_session') || localStorage.getItem('magazine_admin_session'));

  return (
    <>
      {(!isVideoRoom || isAdmin) && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/members" element={
          <AdminAuthWrapper 
            title="Church Directory" 
            subtitle="Authentication required for registry access" 
            sessionKey="member_admin_session"
            loginLogic={authConfig.members}
            identityLabel="Your Name"
          >
            <Members />
          </AdminAuthWrapper>
        } />
        <Route path="/admin" element={
          <AdminAuthWrapper 
            title="Admin Dashboard" 
            subtitle="Management Interface" 
            sessionKey="admin_session"
            loginLogic={authConfig.admin}
          >
            <Admin />
          </AdminAuthWrapper>
        } />
        <Route path="/magazine-admin" element={
          <AdminAuthWrapper 
            title="Magazine Publisher" 
            subtitle="Authorized Studio Access" 
            sessionKey="magazine_admin_session"
            loginLogic={authConfig.magazine}
          >
            <MagazineAdmin />
          </AdminAuthWrapper>
        } />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/magazine" element={<Magazine />} />
        <Route path="/admin/planner" element={<div className="pt-16"><MonthlyPlanner /></div>} />
        <Route path="/room/:roomId" element={<VideoRoom />} />
        <Route path="/map" element={<WorldMap />} />
        {/* <Route path="/globe" element={<Globe3D />} /> */}
        <Route path="/branches" element={
          <AdminAuthWrapper 
            title="Branch Registry Access" 
            subtitle="Enter password to manage church locations" 
            sessionKey="branch_admin_session"
            loginLogic={authConfig.branch}
            identityLabel="Email (Optional)"
            requireIdentity={false}
          >
            <BranchAdmin />
          </AdminAuthWrapper>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/planner" element={
          <ProtectedRoute>
            <Planner />
          </ProtectedRoute>
        } />
        <Route path="/admin/contest" element={
           <AdminAuthWrapper 
            title="70-Day Contest Manager" 
            subtitle="Excel Upload & Portion Scheduling" 
            sessionKey="admin_session"
            loginLogic={authConfig.admin}
          >
            <ContestAdmin />
          </AdminAuthWrapper>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <VerseProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </VerseProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
