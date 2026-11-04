import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { validateStoredSession } from '@/utils/sessionManager';

export function useAdminAuth() {
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {

      try {
        const session = await validateStoredSession();

        if (!isActive) return;

        if (!session.valid) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Silakan login terlebih dahulu', { id: 'auth-required' });
          router.replace('/login');
          return;
        }

        if (session.user?.userType !== 'admin') {
          toast.error('Anda tidak memiliki akses ke halaman ini', { id: 'no-access' });
          router.replace('/dashboard');
          return;
        }

        localStorage.setItem('user', JSON.stringify(session.user));
        setUser(session.user);
      } catch (e) {
        console.error('Gagal memvalidasi akses admin:', e);
        toast.error('Backend tidak dapat dihubungi', { id: 'auth-unavailable' });
      } finally {
        if (isActive) setIsAuthChecking(false);
      }
    };
    
    checkAuth();

    return () => {
      isActive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    
    const handlePopState = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, router]);

  return { user, isAuthChecking };
}
