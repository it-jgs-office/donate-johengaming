import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeToLoading } from '@/utils/loadingManager';

export default function GlobalPageLoader() {
  const location = useLocation();
  const [requestLoading, setRequestLoading] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const previousLocation = useRef(`${location.pathname}${location.search}`);
  const navigationTimer = useRef(null);
  const requestTimer = useRef(null);

  useEffect(() => subscribeToLoading((loading) => {
    window.clearTimeout(requestTimer.current);
    if (loading) {
      setRequestLoading(true);
      return;
    }

    requestTimer.current = window.setTimeout(() => setRequestLoading(false), 120);
  }), []);

  useEffect(() => () => window.clearTimeout(requestTimer.current), []);

  useEffect(() => {
    const handleLinkClick = (event) => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const target = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (target.origin !== current.origin || target.pathname === current.pathname && target.search === current.search) return;

      setNavigationLoading(true);
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);

  useEffect(() => {
    const currentLocation = `${location.pathname}${location.search}`;
    if (previousLocation.current === currentLocation) return;

    previousLocation.current = currentLocation;
    window.clearTimeout(navigationTimer.current);
    navigationTimer.current = window.setTimeout(() => setNavigationLoading(false), 180);

    return () => window.clearTimeout(navigationTimer.current);
  }, [location.pathname, location.search]);

  const isBrowserSourceOverlay = /^\/overlay\/[^/]+\/(notifications|mediashare|leaderboard|qr-donate)\/?$/.test(location.pathname);
  const isLoading = navigationLoading || requestLoading;
  if (!isLoading || isBrowserSourceOverlay) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[#0F2A5F]/12 backdrop-blur-[1px]" role="status" aria-live="polite" aria-label="Memuat halaman">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/65 border-t-[#2563EB]" aria-hidden="true" />
    </div>
  );
}
