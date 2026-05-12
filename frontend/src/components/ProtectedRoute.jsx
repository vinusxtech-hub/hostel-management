import { Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { Loader } from "./Loader";

const getRoleHome = (role) => {
  switch (role) {
    case "admin": return "/admin/dashboard";
    case "warden": return "/warden/dashboard";
    default: return "/dashboard";
  }
};

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="Initializing..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};
