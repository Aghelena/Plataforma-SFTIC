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
import Quiz from "./pages/quiz"; 
import { initKeyboardAnnouncer } from "./lib/speech";
import Memory from "./pages/Memory";
import Forca from "./pages/Forca";
import Candy from "./pages/Candy";
import Wood from "./pages/Wood";
import WordCross from "./pages/WordCross";
import UserLogin from "./pages/UserLogin";

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
          <Route path="/" element={<Landing />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/forca" element={<Forca />} />
          <Route path="/quiz" element={<Quiz />} /> 
          <Route path="/candy" element={<Candy />} /> 
          <Route path="/wood" element={<Wood />} /> 
          <Route path="/wordcross" element={<WordCross />} />
          <Route path="/userLogin" element={<UserLogin />} />

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
