import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

// Read auth state synchronously from sessionStorage — cleared automatically when the tab closes.
const readStoredAuth = () => {
  try {
    const token = sessionStorage.getItem('authToken');
    const raw   = sessionStorage.getItem('currentUser');
    if (token && raw && !isTokenExpired(token)) {
      const user = JSON.parse(raw);
      return { user, isAuthenticated: true };
    }
  } catch (_) {}
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('currentUser');
  return { user: null, isAuthenticated: false };
};

// Provider
export const AuthProvider = ({ children }) => {
  const initial = readStoredAuth();
  const [user, setUser] = useState(initial.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const loading = false;

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
  };

  const updateUser = (userData) => {
    setUser(userData);
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export const useAuth = () => useContext(AuthContext);
