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

const STORAGE_TOKEN_KEY = "hostel_token";
const STORAGE_USER_KEY = "hostel_user";

const getStoredUser = () => {
  const storedUser = sessionStorage.getItem(STORAGE_USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem(STORAGE_USER_KEY);
    return null;
  }
};

const migrateAuthFromLocalStorage = () => {
  if (!sessionStorage.getItem(STORAGE_TOKEN_KEY) && localStorage.getItem(STORAGE_TOKEN_KEY)) {
    sessionStorage.setItem(STORAGE_TOKEN_KEY, localStorage.getItem(STORAGE_TOKEN_KEY));
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }

  if (!sessionStorage.getItem(STORAGE_USER_KEY) && localStorage.getItem(STORAGE_USER_KEY)) {
    sessionStorage.setItem(STORAGE_USER_KEY, localStorage.getItem(STORAGE_USER_KEY));
    localStorage.removeItem(STORAGE_USER_KEY);
  }
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

  useEffect(() => {
    const loadUser = async () => {
      migrateAuthFromLocalStorage();
      const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
      const storedUser = getStoredUser();

      if (token && storedUser) {
        setUser(storedUser);
      }

      if (token) {
        try {
          const data = await api.auth.getMe();
          setUser(data.user);
          sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
          sendDeviceInfo();
        } catch (err) {
          sessionStorage.removeItem(STORAGE_TOKEN_KEY);
          sessionStorage.removeItem(STORAGE_USER_KEY);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    sessionStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    sendDeviceInfo();
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    sessionStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    sendDeviceInfo();
    return data.user;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify({ ...user, ...updatedData }));
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
