'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateStoredSession } from '@/utils/sessionManager';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      if (typeof window === 'undefined') return;

      try {
        const session = await validateStoredSession();

        if (!isActive) return;

        if (!session.valid) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace(redirectTo);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Gagal memvalidasi sesi:', error);
        setIsAuthenticated(Boolean(localStorage.getItem('token')));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, [router, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useRequireAuth() {
  return useAuth('/login');
}

export function useRequireAdmin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkAdmin = async () => {
      if (typeof window === 'undefined') return;

      try {
        const session = await validateStoredSession();

        if (!isActive) return;

        if (!session.valid) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace('/login');
          return;
        }

        if (session.user?.userType !== 'admin') {
          router.replace('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Gagal memvalidasi akses admin:', error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    checkAdmin();

    return () => {
      isActive = false;
    };
  }, [router]);

  return { isAdmin, isLoading };
}
