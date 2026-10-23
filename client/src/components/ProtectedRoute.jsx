import { Navigate, useLocation, Outlet } from "react-router";
import { useAuthStore } from "../store/auth.store";
import { ROLE_HOME } from "../constants/roles";

export default function ProtectedRoute({ allowedRoles }) {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const onChangePasswordPage = location.pathname === "/change-password";

  // Redirects created staffs to change their passwords
  if (user.mustChangePassword && !onChangePasswordPage) {
    return <Navigate to="/change-password" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />
}