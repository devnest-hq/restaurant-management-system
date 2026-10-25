import { useEffect } from "react";
import { Routes, Route } from "react-router";
import { useAuthStore } from "./store/auth.store";
import { getRefreshPromise } from "./api/client";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword"
import ProtectedRoute from "./components/ProtectedRoute";
import { useSocket } from "./hooks/useSocket";
import "./App.css"

function App() {
  useSocket();

  useEffect(() => {
    getRefreshPromise().catch(() => {
      useAuthStore.getState().clearSession();
    })
  }, []);

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      {/* Protected Routes */}
      {/* CUSTOMER */}
      <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
        <Route path="/menu" element={<h1>Menu Page</h1>} />
      </Route>

    </Routes>
  );
}

export default App
