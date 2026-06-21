import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { UAParser } from "ua-parser-js";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Collect device info using ua-parser-js and send to backend
const sendDeviceInfo = async () => {
  try {
    const parser = new UAParser();
    const result = parser.getResult();

    const deviceData = {
      deviceModel: result.device.model || 'Unknown',
      deviceType: result.device.type || 'desktop',
      osName: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown'
    };

    await api.device.storeDeviceInfo(deviceData);
  } catch (err) {
    // Silently fail — device tracking should never block login
    console.warn('Device info collection failed:', err.message);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check for existing token and load user
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("hostel_token");
      if (token) {
        try {
          const data = await api.auth.getMe();
          setUser(data.user);
          // Send device info on app reload with existing session
          sendDeviceInfo();
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem("hostel_token");
          localStorage.removeItem("hostel_user");
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  // Cross-tab session sync: if another tab logs out, update this tab too
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "hostel_token" && !e.newValue) {
        // Token was removed in another tab → log out here too
        setUser(null);
      }
      if (e.key === "hostel_token" && e.newValue && !user) {
        // Another tab logged in → reload to pick up the session
        window.location.reload();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem("hostel_token", data.token);
    localStorage.setItem("hostel_user", JSON.stringify(data.user));
    setUser(data.user);
    // Send device info after successful login
    sendDeviceInfo();
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    localStorage.setItem("hostel_token", data.token);
    localStorage.setItem("hostel_user", JSON.stringify(data.user));
    setUser(data.user);
    // Send device info after successful registration
    sendDeviceInfo();
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hostel_token");
    localStorage.removeItem("hostel_user");
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    localStorage.setItem("hostel_user", JSON.stringify({ ...user, ...updatedData }));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
