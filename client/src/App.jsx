import { useEffect } from "react";
import { Routes, Route } from "react-router";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword"
import { useAuthStore } from "./store/auth.store";
import { getRefreshPromise } from "./api/client";
import "./App.css"

function App() {
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
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  );
}

export default App
