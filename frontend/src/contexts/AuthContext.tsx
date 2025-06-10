"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, getIdTokenResult, IdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseClientInit'; // Your Firebase auth instance

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null; // e.g., 'admin', 'teacher', 'student'
  idTokenResult: IdTokenResult | null;
  loadingAuth: boolean;
  isAdmin: boolean; // Convenience getter
  isTeacher: boolean; // Convenience getter
  isStudent: boolean; // Convenience getter
  logout: () => Promise<void>; // New logout function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [idTokenResultState, setIdTokenResultState] = useState<IdTokenResult | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true);
      if (user) {
        setCurrentUser(user);
        try {
          // Force refresh to get latest claims, especially after role change by admin
          const idTokenResult = await getIdTokenResult(user, true);
          const roleFromClaims = idTokenResult.claims.role as string || null;
          setUserRole(roleFromClaims);
          setIdTokenResultState(idTokenResult);
          console.log("Auth State Changed: User signed in.", { uid: user.uid, role: roleFromClaims });
        } catch (error) {
          console.error("Error getting ID token result or custom claims:", error);
          // Handle error (e.g., sign out user if token is compromised or claims are essential)
          setUserRole(null);
          setIdTokenResultState(null);
          // Optionally sign out user here if claims are critical and failed to load
          // await auth.signOut();
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIdTokenResultState(null);
        console.log("Auth State Changed: User signed out.");
      }
      setLoadingAuth(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student' || userRole === 'university_student';

  const logout = async () => {
    setLoadingAuth(true); // Indicate loading state during logout
    try {
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        // Call backend to revoke refresh tokens
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        // If backend call fails, we still sign out from client, but log error
      }
    } catch (error) {
      console.error("Error calling backend logout:", error);
      // Proceed with client-side sign out even if backend call fails
    } finally {
      await auth.signOut(); // Sign out from Firebase client-side
      // onAuthStateChanged will handle resetting currentUser, userRole, etc.
      // No need to manually set loadingAuth to false here, onAuthStateChanged will do it.
      // No need to redirect here, components observing currentUser can handle redirection.
      console.log("Firebase client signOut called.");
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, userRole, idTokenResult: idTokenResultState, loadingAuth, isAdmin, isTeacher, isStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
