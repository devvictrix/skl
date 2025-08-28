import React, { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  token: string | null;
  user: { username: string; roles: string[] } | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdminOrLibrarian: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<{
    username: string;
    roles: string[];
  } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: { username: string; roles: string[] } = jwtDecode(token);
        setUser(decoded);
        localStorage.setItem("token", token);
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;
  const isAdminOrLibrarian =
    user?.roles.includes("admin") || user?.roles.includes("librarian") || false;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated,
        isAdminOrLibrarian,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
