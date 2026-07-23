/**
 * AppContext.jsx
 *
 * Global application state: current user, sidebar open/close, theme.
 * Reads the session synchronously on init so there is no loading flicker.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getSettings } from '../services/settingsService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Synchronous init — localStorage is always available
  const [user, setUserState] = useState(() => authService.getSession());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('sp_theme') || 'light',
  );

  // Apply theme attribute to <html> whenever theme changes
  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  // Sync theme from backend when user logs in
  useEffect(() => {
    if (user) {
      getSettings().then(settings => {
        if (settings?.appearance?.theme) {
          setThemeState(settings.appearance.theme);
        }
      }).catch(err => console.error("Failed to sync theme:", err));
    }
  }, [user]);

  const setUser = useCallback((u) => setUserState(u), []);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const setTheme = useCallback((t) => setThemeState(t), []);

  const logout = useCallback(() => {
    authService.clearSession();
    setUserState(null);
    setSidebarOpen(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        sidebarOpen,
        toggleSidebar,
        closeSidebar,
        theme,
        setTheme,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
