import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function getStoredUser() {
  if (typeof window === 'undefined' || !localStorage.getItem('token')) {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export async function validateStoredSession() {
  const token = localStorage.getItem('token');

  if (!token) {
    return { valid: false, user: null };
  }

  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401 || response.status === 403) {
    return { valid: false, user: null };
  }

  if (!response.ok) {
    throw new Error(`Gagal memvalidasi sesi (${response.status})`);
  }

  const data = await response.json();
  return { valid: Boolean(data.user), user: data.user ?? null };
}

export class SessionManager {
  constructor() {
    this.checkInterval = null;
    this.isManualLogout = false; // Flag untuk detect manual logout
  }

  // Start monitoring session
  startSessionMonitoring(router) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkTokenExpiry(router);
    }, 60000); // 60 seconds

    // Also check immediately
    this.checkTokenExpiry(router);
  }

  // Stop monitoring
  stopSessionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isManualLogout = false; // Reset flag
  }

  // Check if token is expired or about to expire
  async checkTokenExpiry(router) {
    // Skip check if manual logout in progress
    if (this.isManualLogout) {
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      // Skip logout notification if manual logout happened
      if (this.isManualLogout) return;
      this.handleLogout(router);
      return;
    }

    const expiresAt = Number(localStorage.getItem('token_expires_at'));

    if (Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt <= Date.now()) {
      this.handleLogout(router, 'Sesi Anda telah berakhir. Silakan login kembali.');
      return;
    }

    try {
      const session = await validateStoredSession();

      if (!session.valid) {
        this.handleLogout(router, 'Sesi Anda telah berakhir. Silakan login kembali.');
      }
    } catch (error) {
      console.error('Error validating session:', error);
    }
  }

  // Handle logout
  handleLogout(router, message = 'Sesi Anda telah berakhir.', isError = true) {
    // Skip if manual logout in progress
    if (this.isManualLogout) {
      console.log('Manual logout detected, skipping auto-logout notification');
      this.isManualLogout = false; // Reset flag
      return;
    }
    
    // Skip if already logged out (no token in storage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.log('No token found, user already logged out');
      return;
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('remember_browser');
    
    if (isError) {
      toast.error(message, {
        duration: 5000,
        position: 'top-center'
      });
    } else {
      toast.success(message, {
        duration: 3000,
        position: 'top-center'
      });
    }

    // Redirect to landing page after a short delay
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  // Manual logout (dipanggil saat user klik logout)
  logout(router) {
    // Set flag SEBELUM stop monitoring
    this.isManualLogout = true;
    
    // Stop monitoring untuk prevent false "sesi berakhir" notification
    this.stopSessionMonitoring();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('remember_browser');
    
    toast.success('Berhasil logout!', {
      duration: 2000,
      position: 'top-center'
    });

    // Redirect to landing page
    setTimeout(() => {
      router.push('/');
      // Reset flag setelah redirect
      this.isManualLogout = false;
    }, 500);
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Hook for easy use in components
export function useSessionManager() {
  const router = useRouter();

  const startMonitoring = useCallback(() => {
    sessionManager.startSessionMonitoring(router);
  }, [router]);

  const stopMonitoring = useCallback(() => {
    sessionManager.stopSessionMonitoring();
  }, []);

  const logout = useCallback(() => {
    sessionManager.logout(router);
  }, [router]);

  return {
    startMonitoring,
    stopMonitoring,
    logout
  };
}
