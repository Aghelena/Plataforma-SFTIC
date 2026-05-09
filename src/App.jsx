// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import VLibras from "./components/VLibras";
import Admin from "./pages/Admin";
import Quiz from "./pages/quiz";
import Memory from "./pages/Memory";
import Forca from "./pages/Forca";
import Candy from "./pages/Candy";
import Intruso from "./pages/Intruso";
import UserLogin from "./pages/UserLogin";
import QuebraCabeca from "./pages/QuebraCabeca";

export default function App() {
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <>
        {!isAdminArea && <VLibras />}

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/forca" element={<Forca />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/candy" element={<Candy />} />
          <Route path="/intruso" element={<Intruso />} />
          <Route path="/quebracabeca" element={<QuebraCabeca />} />
          <Route path="/userLogin" element={<UserLogin />} />

          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </AuthProvider>
  );
}