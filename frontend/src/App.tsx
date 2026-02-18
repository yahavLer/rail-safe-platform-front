import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import RisksList from "./pages/RisksList";
import RiskDetail from "./pages/RiskDetail";
import NewRisk from "./pages/NewRisk";
import NotFound from "./pages/NotFound";
import OrgSignup from "./pages/auth/OrgSignup";
import UserSignup from "./pages/auth/UserSignup";
import Login from "./pages/Login"; 
import Bootstrap from "./pages/Bootstrap";
import RiskDefinitions from "./pages/chiefRiskManag/RiskDefinitions";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import ControlsLibraryPage  from "./pages/ControlsLibraryPage";
import RiskEditPage from "./pages/RiskEditPage";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>      
          <Routes>
            <Route path="/start" element={<Bootstrap />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup/org" element={<OrgSignup />} />
            <Route path="/signup/user" element={<UserSignup />} />
            <Route path="/risk-definitions" element={<RiskDefinitions />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/risks" element={<RisksList />} />
              <Route path="/risks/new" element={<NewRisk />} />
              <Route path="/risks/:id" element={<RiskDetail />} />
              <Route path="/risks/:riskId/edit" element={<RiskEditPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/controls" element={<ControlsLibraryPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
