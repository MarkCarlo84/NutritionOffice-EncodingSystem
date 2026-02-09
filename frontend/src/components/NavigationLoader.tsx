import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './NavigationLoader.css';

const MIN_VISIBLE_MS = 320;

/**
 * Shows a thin loading bar at the top when navigating between pages.
 * Triggers when location (pathname) changes; bar stays visible for a short time.
 */
export default function NavigationLoader() {
  const location = useLocation();
  const [showBar, setShowBar] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setShowBar(true);
      const t = setTimeout(() => setShowBar(false), MIN_VISIBLE_MS);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const isLoading = showBar;

  return (
    <div
      className={`navigation-loader ${isLoading ? 'navigation-loader--active' : ''}`}
      role="progressbar"
      aria-hidden={!isLoading}
      aria-busy={isLoading}
    >
      <div className="navigation-loader-bar" />
    </div>
  );
}
