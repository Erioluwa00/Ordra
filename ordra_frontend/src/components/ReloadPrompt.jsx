import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './ReloadPrompt.css';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="ReloadPrompt-container">
      <div className="ReloadPrompt-toast">
        <div className="ReloadPrompt-message">
          <span className="ReloadPrompt-title">Update Available</span>
          <span className="ReloadPrompt-desc">A new version of Ordra is ready.</span>
        </div>
        <div className="ReloadPrompt-actions">
          <button className="ReloadPrompt-btn primary" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
          <button className="ReloadPrompt-btn secondary" onClick={close}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt;
