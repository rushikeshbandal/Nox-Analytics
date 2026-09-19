import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../Utils/authUtils"; // adjust path as needed

const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getUserRole();
    
    if (!role) {
      navigate("/Login");
    } else if (allowedRoles && !allowedRoles.includes(role)) {
      navigate("/Unauthorized");
    }
  }, [navigate, allowedRoles]);

  return children;
};

export default ProtectedRoute;
