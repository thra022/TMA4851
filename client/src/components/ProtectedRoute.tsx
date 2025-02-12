import { Navigate, Outlet } from "react-router"
import { useAuth } from "../context/auth/AuthContext";

export default function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // ✅ Show a loading state instead of flickering UI
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

