export const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem("userRole"));
    return user?.role || null;
  };