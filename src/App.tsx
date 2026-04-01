import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import UploadParse from "./pages/UploadParse";
import AdapterCatalog from "./pages/AdapterCatalog";
import Configure from "./pages/Configure";
import Simulate from "./pages/Simulate";
import AuditLog from "./pages/AuditLog";
import HistoryRollback from "./pages/HistoryRollback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadParse />} />
            <Route path="/adapters" element={<AdapterCatalog />} />
            <Route path="/configure" element={<Configure />} />
            <Route path="/simulate" element={<Simulate />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/history" element={<HistoryRollback />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
