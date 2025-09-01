import React from 'react';
import { useUser } from '../lib/context/user';
import Loading from './Loading';
import { FaTimes } from 'react-icons/fa';

export default function LoadingWrapper({ children }) {
  const { error, setError, loading } = useUser();

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {children}

      {error && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Error</h2>
            <div className="error-content">
              <p>{error}</p>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={() => setError(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

