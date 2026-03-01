import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole, children }) {
  const { role } = useAuth();
  const location = useLocation();

  if (!role) {
    const fallback = allowedRole === "admin" ? "/admin" : "/participant";
    return <Navigate to={fallback} replace state={{ from: location.pathname }} />;
  }

  if (allowedRole !== role) {
    const fallback = role === "admin" ? "/admin/dashboard" : "/participant/game";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default ProtectedRoute;
