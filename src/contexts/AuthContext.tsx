'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserRole } from '@/types';
import nookies from 'nookies';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  companyId: string | null;
  departmentId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  companyId: null,
  departmentId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // IDトークンを取得してクッキーに保存
        const token = await user.getIdToken();
        nookies.set(undefined, 'token', token, { path: '/' });
        
        // カスタムクレームを取得
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims;
        
        setUser(user);
        setUserRole((claims.role as UserRole) || null);
        setCompanyId((claims.companyId as string) || null);
        setDepartmentId((claims.departmentId as string) || null);
      } else {
        // クッキーをクリア
        nookies.destroy(undefined, 'token');
        setUser(null);
        setUserRole(null);
        setCompanyId(null);
        setDepartmentId(null);
      }
      setLoading(false);
    });

    // トークンの自動更新
    const refreshToken = setInterval(async () => {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        nookies.set(undefined, 'token', token, { path: '/' });
      }
    }, 10 * 60 * 1000); // 10分ごと

    return () => {
      unsubscribe();
      clearInterval(refreshToken);
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      nookies.destroy(undefined, 'token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userRole,
        companyId,
        departmentId,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};