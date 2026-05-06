import React, { createContext, useContext, useEffect } from 'react';
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  // Fetch the current user's profile from Convex
  const userProfile = useQuery(api.users.getUserProfile);
  const settings = useQuery(api.settings.getSettings);
  const activateTrial = useMutation(api.settings.activateTrial);

  // Auto-start the 14-day Pro trial for new users (no card required)
  useEffect(() => {
    if (isAuthenticated && settings !== undefined && !settings?.plan) {
      activateTrial().catch(() => {});
    }
  }, [isAuthenticated, settings]);

  // While Convex is still deciding if we are logged in, show the branded splash
  if (isLoading) {
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
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          preload="auto"
          disablePictureInPicture
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.1))',
            pointerEvents: 'none' // Prevents users from accidentally clicking it to show controls
          }}
        >
          <source src="/logo-animation.mp4" type="video/mp4" />
          <source src="/logo-animation.webm" type="video/webm" />
        </video>
      </div>
    );
  }

  const logout = async () => {
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
