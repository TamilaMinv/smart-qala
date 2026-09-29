import { Navigate } from "react-router-dom";


function ProtectedRoute({
  children,
  allowedRole,
}) {
  const savedUser = localStorage.getItem(
    "smartQalaUser"
  );

  const user = savedUser
    ? JSON.parse(savedUser)
    : null;


  // Пользователь вообще не вошёл.
  if (!user) {

    // Для административной страницы
    // используется отдельный вход.
    if (allowedRole === "admin") {
      return (
        <Navigate
          to="/admin-login"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // Пользователь вошёл,
  // но пытается открыть чужую роль.
  if (
    allowedRole &&
    user.role !== allowedRole
  ) {

    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }


    if (user.role === "government") {
      return (
        <Navigate
          to="/government"
          replace
        />
      );
    }


    return (
      <Navigate
        to="/ideas"
        replace
      />
    );
  }


  return children;
}


export default ProtectedRoute;