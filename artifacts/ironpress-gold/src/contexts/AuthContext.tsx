import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'athlete' | 'coach' | null;

export interface CoachToken {
  code: string;
  password?: string;
  permissions: string[];
  expiresAt: number;
}

interface AuthContextType {
  role: UserRole;
  permissions: string[];
  isLoaded: boolean;
  loginAsAthlete: (user: string, pass: string) => boolean;
  loginAsCoach: (code: string, pass: string) => boolean;
  logout: () => void;
  generateCoachToken: (permissions: string[], expiresInHours: number) => CoachToken;
  getCoachTokens: () => CoachToken[];
  revokeToken: (code: string) => void;
  updateAthleteCredentials: (user: string, pass: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [coachTokens, setCoachTokens] = useState<CoachToken[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carrega auth inicial
    const storedRole = localStorage.getItem('ironside_auth_role') as UserRole;
    if (storedRole) {
      setRole(storedRole);
      if (storedRole === 'coach') {
        const storedPerms = localStorage.getItem('ironside_auth_perms');
        if (storedPerms) setPermissions(JSON.parse(storedPerms));
      }
    }
    
    // Carrega tokens válidos emitidos
    const storedTokens = localStorage.getItem('ironside_coach_tokens');
    if (storedTokens) {
      const parsed: CoachToken[] = JSON.parse(storedTokens);
      const valid = parsed.filter(t => t.expiresAt > Date.now());
      setCoachTokens(valid);
      if (parsed.length !== valid.length) {
        localStorage.setItem('ironside_coach_tokens', JSON.stringify(valid));
      }
    }
    setIsLoaded(true);
  }, []);

  const loginAsAthlete = (user: string, pass: string) => {
    const storedUser = localStorage.getItem('ironside_athlete_user') || 'DECA';
    const storedPass = localStorage.getItem('ironside_athlete_pass') || 'DURA';

    if (user === storedUser && pass === storedPass) { 
      setRole('athlete');
      setPermissions([]);
      localStorage.setItem('ironside_auth_role', 'athlete');
      return true;
    }
    return false;
  };

  const updateAthleteCredentials = (user: string, pass: string) => {
    localStorage.setItem('ironside_athlete_user', user);
    localStorage.setItem('ironside_athlete_pass', pass);
  };

  const loginAsCoach = (code: string, pass: string) => {
    const token = coachTokens.find(t => t.code === code && t.password === pass);
    if (token) {
      if (token.expiresAt < Date.now()) {
        // Remove expirado e impede
        revokeToken(token.code);
        return false;
      }
      setRole('coach');
      setPermissions(token.permissions);
      localStorage.setItem('ironside_auth_role', 'coach');
      localStorage.setItem('ironside_auth_perms', JSON.stringify(token.permissions));
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    setPermissions([]);
    localStorage.removeItem('ironside_auth_role');
    localStorage.removeItem('ironside_auth_perms');
  };

  const generateCoachToken = (perms: string[], expiresInHours: number) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPass = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    const token: CoachToken = {
      code: newCode,
      password: newPass,
      permissions: perms,
      expiresAt: Date.now() + (expiresInHours * 60 * 60 * 1000)
    };
    
    const updated = [...coachTokens, token];
    setCoachTokens(updated);
    localStorage.setItem('ironside_coach_tokens', JSON.stringify(updated));
    return token;
  };

  const getCoachTokens = () => coachTokens.filter(t => t.expiresAt > Date.now());

  const revokeToken = (code: string) => {
    const updated = coachTokens.filter(t => t.code !== code);
    setCoachTokens(updated);
    localStorage.setItem('ironside_coach_tokens', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      role, permissions, isLoaded, loginAsAthlete, loginAsCoach, logout, generateCoachToken, getCoachTokens, revokeToken, updateAthleteCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
