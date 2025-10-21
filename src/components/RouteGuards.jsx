import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
  // ajuste aqui conforme como você salva a role no Firestore (ex.: "admin")
  const isAdmin = currentUser?.role === "admin";
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
