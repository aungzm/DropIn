import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute: React.FC = () => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!accessToken || !refreshToken) {
    // If tokens are missing, redirect to login
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
