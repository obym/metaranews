import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  login: loginWithGoogle,
  logout: logout,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              name: user.displayName,
              role: 'admin', // First user is usually admin, or just default to admin for simplicity
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            });
            setRole('admin');
          } else {
            await updateDoc(userRef, {
              lastLoginAt: new Date().toISOString(),
              name: user.displayName, // Update name just in case
            });
            setRole(userSnap.data().role || 'user');
          }
        } catch (error) {
          console.error("Error saving user:", error);
        }
      } else {
        setRole(null);
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, login: loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
