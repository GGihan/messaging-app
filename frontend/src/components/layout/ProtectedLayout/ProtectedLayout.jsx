import LoadingSpinner from "@/components/ui/LoadingSpinner/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";

export default function ProtectedLayout() {
  const { isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="loading-container" style={{height: "100dvh"}}>
        <LoadingSpinner size={40}/>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};