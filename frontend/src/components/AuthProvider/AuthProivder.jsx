import { useState, useEffect, } from "react";
import { AuthContext } from "@/hooks/useAuth";
import { apiClient } from "@/config/api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const data = await apiClient('/auth/me'); 
        setUser(data.user);
      } catch (error) {
        console.error("Failed to connect to authentication server:", error.message);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    verifySession();
  }, []);

  const login = (userData) => {
    setUser(userData.user);
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { 
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error on backend:", error.message);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};