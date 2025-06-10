import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FaHome } from "react-icons/fa";

const NoMatch = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="empty-state">
      <h3>Page Not Found</h3>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div className="empty-actions">
        <button className="btn primary" onClick={goHome}>
          <FaHome className="mr-2" /> Return Home
        </button>
      </div>
    </div>
  );
};

export default NoMatch;
