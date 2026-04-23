import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

/**
 * ProtectedRiderRoute
 * - Redirects unauthenticated users to "/" (which opens the login popup)
 * - Redirects authenticated non-riders back to "/"
 * - Renders children only for users with role === "rider"
 */
const ProtectedRiderRoute = ({ children, setShowLogin }) => {
  const { token } = useContext(StoreContext);
  const role = localStorage.getItem("role");

  if (!token) {
    // Not logged in — go home and the Navbar login button is available
    if (setShowLogin) setShowLogin(true);
    return <Navigate to="/" replace />;
  }

  if (role !== "rider") {
    // Logged in but not a rider — bounce back to homepage
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRiderRoute;
