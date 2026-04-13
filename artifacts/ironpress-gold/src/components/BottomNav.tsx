import { useLocation, Link } from "wouter";
import { Home, Dumbbell, Play, Trophy, Users, Cpu, Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const TABS_CONFIG = [
  { path: "/", label: "Início", icon: Home },
  { path: "/treinos", label: "Treinos", icon: Dumbbell },
  { path: "/videos", label: "Lab", icon: Play },
  { path: "/campeonatos", label: "Eventos", icon: Trophy },
  { path: "/saude", label: "Saúde", icon: Heart },
  { path: "/coach", label: "Coach", icon: Users },
  { path: "/settings", label: "A2A Hub", icon: Cpu },
];

export default function BottomNav() {
  const [location] = useLocation();
  const { role, permissions } = useAuth();

  const visibleTabs = TABS_CONFIG.filter((t) => {
    if (role === 'athlete') return true;
    if (role === 'coach') {
      return permissions.includes(t.path) && t.path !== '/settings' && t.path !== '/treinador';
    }
    return false;
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto"
      style={{ background: "#0D0D0D", borderTop: "1px solid #1A1A1A" }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around px-1 py-2">
        {visibleTabs.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1"
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon
                size={20}
                className="transition-colors"
                color={isActive ? "#F5B700" : "#4A4A4A"}
                fill={isActive ? "rgba(245,183,0,0.1)" : "transparent"}
              />
              <span
                className="text-[9px] font-semibold tracking-tight transition-colors truncate"
                style={{ color: isActive ? "#F5B700" : "#4A4A4A" }}
              >
                {label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#F5B700" }} />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for mobile */}
      <div className="h-safe-area-inset-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
