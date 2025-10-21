// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  getDocFromCache,
  getDocFromServer,
} from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // { uid, email, displayName?, role?, ... }
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Status de rede do navegador (opcional, mas útil para UI)
  useEffect(() => {
    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Observa sessão e perfil (Firestore) com fallback a cache
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", user.uid);

      // 1) tenta cache rápido para não travar UI quando offline
      try {
        const snapCache = await getDocFromCache(ref);
        if (snapCache.exists()) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || undefined,
            ...snapCache.data(),
          });
        } else {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || undefined,
          });
        }
      } catch {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || undefined,
        });
      }

      // 2) abre listener — entrega cache e atualiza quando voltar a rede
      const offProfile = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => {
          const fromCache = snap.metadata.fromCache;
          const data = snap.exists() ? snap.data() : {};
          setCurrentUser((prev) => ({
            ...(prev || {}),
            ...data,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || prev?.displayName,
          }));
          setOffline(fromCache);
          setLoading(false);
        },
        async (err) => {
          console.warn("AuthContext snapshot error:", err?.message || err);
          setOffline(true);
          try {
            const snapServer = await getDocFromServer(ref);
            if (snapServer.exists()) {
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || undefined,
                ...snapServer.data(),
              });
              setOffline(false);
            }
          } catch {}
          setLoading(false);
        }
      );

      return () => offProfile();
    });

    return () => unsub();
  }, []);

  // ---------- Ações de autenticação ----------
  async function signUp(email, password, name) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // displayName no Auth (independe do Firestore)
    try { await updateProfile(user, { displayName: name }); } catch {}

    // perfil no Firestore (não bloqueie o fluxo se offline)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          email,
          role: "user",
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("setDoc perfil falhou (seguindo mesmo assim):", e?.code || e?.message || e);
    }

    return user;
  }

  async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await fbSignOut(auth);
    setCurrentUser(null);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  const value = useMemo(
    () => ({ currentUser, loading, offline, signUp, signIn, signOut, resetPassword }),
    [currentUser, loading, offline]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para consumir o contexto
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
