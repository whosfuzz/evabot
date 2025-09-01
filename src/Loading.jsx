import { useState, useEffect } from "react";

export default function Loading() {
  return (
    <div className="loading-container">
      <img src="/eba.png" alt="eva" className="loading-logo" />
      <div className="spinner"></div>
      <p className="loading-text"></p>
    </div>
  );
}
