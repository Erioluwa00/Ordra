import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the window/body (default behavior)
    window.scrollTo(0, 0);

    // Also scroll the dashboard content area if it exists and has overflow
    // In our AppLayout, .app-content is the scroll container
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      appContent.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
