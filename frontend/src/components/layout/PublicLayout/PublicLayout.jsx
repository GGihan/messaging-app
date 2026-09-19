import LoadingSpinner from "@/components/ui/LoadingSpinner/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";

export default function PublicLayout() {
  const { isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};