import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🚂 New State: Track animation direction ('login', 'logout', or null)
  const [animationState, setAnimationState] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('railguard_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('railguard_user');
      }
    }
    setLoading(false);
  }, []);

  // Modified to intercept and play the forward train animation
  const loginUser = (userData) => {
    // Directly set the user session without a delayed animation trigger here
    setUser(userData);
    localStorage.setItem('railguard_user', JSON.stringify(userData));
  };

  // Modified to intercept and play the reverse train animation
  const logout = () => {
    // 1. Start the train moving from Right to Left
    setAnimationState('logout');

    // 2. Wait for the train to drive across before logging the user out
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('railguard_user');
      setAnimationState(null); // Clear the overlay
    }, 4200);
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, hasRole, animationState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};