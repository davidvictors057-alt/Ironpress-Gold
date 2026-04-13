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
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { requestPersistentStorage } from "@/services/storage/backupService";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function AppInit() {
  useEffect(() => {
    requestPersistentStorage().catch(() => {});
  }, []);
  return null;
}

function Router() {
  const { role, permissions } = useAuth();
  
  // Roteamento condicional para o Treinador
  const hasAccess = (route: string) => {
    if (role === 'athlete') return true;
    if (role === 'coach') return permissions.includes(route);
    return false;
  };

  return (
    <Switch>
      <Route path="/">
        {hasAccess('/') ? <Dashboard /> : <Coach />}
      </Route>
      <Route path="/treinos">
        {hasAccess('/treinos') ? <Trainings /> : <NotFound />}
      </Route>
      <Route path="/videos">
        {hasAccess('/videos') ? <Videos /> : <NotFound />}
      </Route>
      <Route path="/campeonatos">
        {hasAccess('/campeonatos') ? <Championships /> : <NotFound />}
      </Route>
      <Route path="/saude">
        {hasAccess('/saude') ? <Health /> : <NotFound />}
      </Route>
      <Route path="/coach">
        <Coach />
      </Route>
      <Route path="/settings">
        {role === 'athlete' ? <Settings /> : <NotFound />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function MainApp() {
  const { role, isLoaded } = useAuth();

  if (!isLoaded) return <div className="bg-[#0A0A0A] min-h-screen"></div>;

  if (!role) {
    return <Login />;
  }

  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInit />
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
