import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/Calendar";
import Admin from "@/pages/Admin";
import SuperAdmin from "@/pages/SuperAdmin";
import NotFound from "@/pages/NotFound";
import { VerseProvider } from "@/contexts/VerseContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <VerseProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </VerseProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
