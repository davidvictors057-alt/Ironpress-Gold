import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Trainings from "@/pages/Trainings";
import Videos from "@/pages/Videos";
import Championships from "@/pages/Championships";
import Health from "@/pages/Health";
import Coach from "@/pages/Coach";
import NotFound from "@/pages/not-found";
import { requestPersistentStorage, seedInitialData } from "@/services/storage/backupService";

const queryClient = new QueryClient();

function AppInit() {
  useEffect(() => {
    // Tarefa 6: solicitar persistência de storage e seed dados iniciais
    seedInitialData();
    requestPersistentStorage().catch(() => {});
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/treinos" component={Trainings} />
      <Route path="/videos" component={Videos} />
      <Route path="/campeonatos" component={Championships} />
      <Route path="/saude" component={Health} />
      <Route path="/treinador" component={Coach} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInit />
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#0A0A0A", maxWidth: "430px", margin: "0 auto" }}
      >
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="pb-20 min-h-screen overflow-y-auto">
            <Router />
          </div>
          <BottomNav />
        </WouterRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
