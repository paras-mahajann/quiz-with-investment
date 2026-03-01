import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "quiz_game_auth";
const AuthContext = createContext(null);

const loadSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { role: null, user: null };
  } catch {
    return { role: null, user: null };
  }
};

export function AuthProvider({ children }) {
  const initial = loadSession();
  const [role, setRole] = useState(initial.role);
  const [user, setUser] = useState(initial.user);

  const persist = (nextRole, nextUser) => {
    setRole(nextRole);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: nextRole, user: nextUser }));
  };

  const loginAsParticipant = (participant) => persist("participant", participant);
  const loginAsAdmin = (admin) => persist("admin", admin);

  const updateUser = (patch) => {
    const nextUser = { ...(user || {}), ...patch };
    persist(role, nextUser);
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ role, user, loginAsParticipant, loginAsAdmin, updateUser, logout }),
    [role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
