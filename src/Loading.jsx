import { useState, useEffect } from 'react';

export default function Loading() {
  return (
    <div className="loading-screen">
        <div className="loading-logo-placeholder">
        <img src="/eba.png" alt="Logo" />
        </div>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
    </div>
  );
}
