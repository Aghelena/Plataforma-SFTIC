// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "./components/RouteGuards";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import VLibras from "./components/VLibras";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <>
        <VLibras /> {/* aparece em todas as páginas */}
        <Routes>
          {/* públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* admin protegida */}
          <Route
            path="/admin"
            element={
                <Admin />
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </AuthProvider>
  );
}
