import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Traffic from "@/pages/Traffic";
import Threats from "@/pages/Threats";
import Devices from "@/pages/Apps";
import DeviceDetails from "@/pages/AppDetails";
import { MobileNav, DesktopSidebar, Header } from "@/components/Navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/traffic" component={Traffic} />
      <Route path="/threats" component={Threats} />
      <Route path="/devices" component={Devices} />
      <Route path="/devices/:id" component={DeviceDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
          <DesktopSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
              <Router />
            </main>
          </div>
          <MobileNav />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
