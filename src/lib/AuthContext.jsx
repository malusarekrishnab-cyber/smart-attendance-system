import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/api/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Firebase आपोआप सांगतो user logged in आहे की नाही
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Firestore च्या 'users' collection मधून role वगैरे माहिती आणतो
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDocSnap.data() // role, name, इत्यादी इथून येईल
            });
            setIsAuthenticated(true);
          } else {
            setAuthError({
              type: 'user_not_registered',
              message: 'User profile not found in database'
            });
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setAuthError({ type: 'unknown', message: error.message });
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe(); // component unmount झाल्यावर listener बंद
  }, []);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged आपोआप user आणि isAuthenticated update करेल
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({ type: 'login_failed', message: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};