import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import BottomNav from "@/components/BottomNav";
import HistoryPage from "@/pages/HistoryPage";
import NewWorkoutPage from "@/pages/NewWorkoutPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import ProgressPage from "@/pages/ProgressPage";
import RecordsPage from "@/pages/RecordsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="pb-16 min-h-[100dvh] bg-background">
      <Switch>
        <Route path="/">
          <Redirect to="/workouts" />
        </Route>
        <Route path="/workouts" component={HistoryPage} />
        <Route path="/workouts/new" component={NewWorkoutPage} />
        <Route path="/workouts/:id" component={WorkoutDetailPage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/records" component={RecordsPage} />
        <Route>
          <div className="flex h-screen items-center justify-center">
            <h1 className="text-2xl font-bold">404 Not Found</h1>
          </div>
        </Route>
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
