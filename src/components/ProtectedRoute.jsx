import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth, hasRole } = useAuth();

    // Not logged in at all
    if (!auth) return <Navigate to="/login" replace />;

    // Logged in but wrong role
    if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;