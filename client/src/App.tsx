import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import PostJob from "@/pages/post-job";
import Jobs from "@/pages/jobs";
import Portfolio from "@/pages/portfolio";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/admin-dashboard";
import Navbar from "@/components/ui/navbar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => <ProtectedRoute path="/" component={HomePage} />} />
      <Route path="/post-job" component={() => <ProtectedRoute path="/post-job" component={PostJob} />} />
      <Route path="/jobs" component={() => <ProtectedRoute path="/jobs" component={Jobs} />} />
      <Route path="/portfolio" component={() => <ProtectedRoute path="/portfolio" component={Portfolio} />} />
      <Route path="/settings" component={() => <ProtectedRoute path="/settings" component={Settings} />} />
      <Route path="/admin" component={() => <ProtectedRoute path="/admin" component={AdminDashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;