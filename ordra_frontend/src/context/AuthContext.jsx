import React, { createContext, useContext, useEffect } from 'react';
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "./ThemeContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const { theme } = useTheme();

  // Fetch the current user's profile from Convex
  const userProfile = useQuery(api.users.getUserProfile);
  const settings = useQuery(api.settings.getSettings);
  const activateTrial = useMutation(api.settings.activateTrial);

  // Clear any stale upgrade intent when authentication state changes (e.g. login/logout)
  // MOVED TO APPLAYOUT FOR MORE RELIABLE HANDLING

  // While Convex is still deciding if we are logged in, show the branded splash
  if (isLoading) {
    const isAppRoute = window.location.pathname.startsWith('/app');
    const isDark = isAppRoute && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    const videoSrc = isDark ? '/blue-logo-animation.mp4' : '/white-logo-animation.mp4';

    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
      }}>
        <video
          key={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          preload="auto"
          disablePictureInPicture
          style={{
            width: '180px',
            height: '180px',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    );
  }

  const logout = async () => {
    localStorage.removeItem('ordra_pending_upgrade');
    await signOut();
  };

  return (
    <AuthContext.Provider value={{
      user: userProfile,
      logout,
      isAuthenticated,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
