import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
    const { accessToken } = useSelector((state) => state.auth);
    if (accessToken === '') {
        return <Navigate to="/auth" />;
    }
    return children;
}

export default ProtectedRoute