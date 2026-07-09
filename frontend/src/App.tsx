import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { RedirectIfAuthenticated, RequireAuth } from "@/auth/RequireAuth";
import { MainLayout } from "./components/layout/MainLayout";
import AuthLanding from "./pages/AuthLanding";
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
import UsersPage from "./pages/UsersPage";
import ControlsLibraryPage from "./pages/ControlsLibraryPage";
import RiskEditPage from "./pages/RiskEditPage";
import CreateRiskFromImagePage from "./pages/CreateRiskFromImagePage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
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

            <Route path="/" element={<RedirectIfAuthenticated><AuthLanding /></RedirectIfAuthenticated>} />
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/signup/org" element={<RedirectIfAuthenticated><OrgSignup /></RedirectIfAuthenticated>} />
            <Route path="/signup/user" element={<RedirectIfAuthenticated><UserSignup /></RedirectIfAuthenticated>} />

            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/risks" element={<RisksList />} />
                <Route path="/risks/new" element={<NewRisk />} />
                <Route path="/risks/new-from-image" element={<CreateRiskFromImagePage />} />
                <Route path="/risks/:id" element={<RiskDetail />} />
                <Route path="/risks/:riskId/edit" element={<RiskEditPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/controls" element={<ControlsLibraryPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/risk-definitions" element={<RiskDefinitions />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;