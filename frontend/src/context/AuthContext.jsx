import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import api from "../api/client";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("tradex_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/auth/me")
        .then((response) => {
          setUser(response.data);
          localStorage.setItem("tradex_user", JSON.stringify(response.data));
        })
        .catch(() => {
          localStorage.removeItem("tradex_token");
          localStorage.removeItem("tradex_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, user } = response.data;
      localStorage.setItem("tradex_token", token);
      localStorage.setItem("tradex_user", JSON.stringify(user));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      toast.success("Welcome back!");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
      return { success: false, error: error.response?.data?.error };
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      await api.post("/auth/register", { username, email, password });
      toast.success("Registration successful! Please login.");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
      return { success: false, error: error.response?.data?.error };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tradex_token");
    localStorage.removeItem("tradex_user");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    toast.success("Logged out");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!token,
    }),
    [user, token, loading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
