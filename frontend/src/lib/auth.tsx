import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiFetch } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function setToken(t: string | null) {
    if (t) {
      localStorage.setItem("token", t);
    } else {
      localStorage.removeItem("token");
    }
    setTokenState(t);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    apiFetch<User | null>("/auth/me", null).then((u) => {
      setUser(u);
      if (!u) setToken(null);
      setLoading(false);
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
