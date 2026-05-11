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

import {
  doc,
  setDoc,
  onSnapshot,
  getDocFromCache,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setOffline(false);
    }

    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let offProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (offProfile) {
        offProfile();
        offProfile = null;
      }

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", user.uid);

      const baseUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || undefined,
      };

      try {
        const snapCache = await getDocFromCache(ref);

        if (snapCache.exists()) {
          setCurrentUser({
            ...baseUser,
            ...snapCache.data(),
          });
        } else {
          setCurrentUser(baseUser);
        }
      } catch {
        setCurrentUser(baseUser);
      } finally {
        // Important: do not wait forever for Firestore onSnapshot
        setLoading(false);
      }

      offProfile = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => {
          const data = snap.exists() ? snap.data() : {};

          setCurrentUser((prev) => ({
            ...(prev || {}),
            ...baseUser,
            ...data,
            displayName:
              user.displayName ||
              data.name ||
              prev?.displayName ||
              undefined,
          }));

          setOffline(snap.metadata.fromCache);
          setLoading(false);
        },
        (error) => {
          console.warn(
            "AuthContext Firestore profile listener error:",
            error?.code || error?.message || error
          );

          setCurrentUser(baseUser);
          setOffline(true);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();

      if (offProfile) {
        offProfile();
      }
    };
  }, []);

  async function signUp(email, password, name) {
  try {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanName = name?.trim() || "";

    if (!cleanEmail) {
      throw new Error("Email is required.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must have at least 6 characters.");
    }

    const { user } = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    try {
      await updateProfile(user, {
        displayName: cleanName,
      });
    } catch (error) {
      console.warn(
        "updateProfile failed:",
        error?.code || error?.message || error
      );
    }

    // Important: do not await this, otherwise Firestore can keep the page loading
    setDoc(
      doc(db, "users", user.uid),
      {
        name: cleanName,
        email: cleanEmail,
        role: "user",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((error) => {
      console.warn(
        "setDoc user profile failed:",
        error?.code || error?.message || error
      );
    });

    return user;
  } catch (error) {
    console.error("Firebase signUp error code:", error.code);
    console.error("Firebase signUp error message:", error.message);

    throw error;
  }
}

  async function signIn(email, password) {
    try {
      const cleanEmail = email?.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      return await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (error) {
      console.error("Firebase signIn error code:", error.code);
      console.error("Firebase signIn error message:", error.message);

      throw error;
    }
  }

  async function signOut() {
    await fbSignOut(auth);
    setCurrentUser(null);
  }

  async function resetPassword(email) {
    try {
      const cleanEmail = email?.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Email is required.");
      }

      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (error) {
      console.error("Firebase resetPassword error code:", error.code);
      console.error("Firebase resetPassword error message:", error.message);

      throw error;
    }
  }

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      offline,
      signUp,
      signIn,
      signOut,
      resetPassword,
    }),
    [currentUser, loading, offline]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }

  return ctx;
}