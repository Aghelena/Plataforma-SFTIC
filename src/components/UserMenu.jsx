// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Pencil, X, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function initials(name) {
  const safe = (name || "").trim();
  if (!safe) return "?";
  return safe.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

export default function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setName(currentUser?.displayName || "");
    setPhotoURL(currentUser?.photoURL || "");
  }, [currentUser?.displayName, currentUser?.photoURL]);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
        photoURL: photoURL.trim() || null,
      });
      // Mantém o Firestore em sincronia, já que o painel lê o perfil de lá.
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { name: name.trim(), photoURL: photoURL.trim() || null },
        { merge: true }
      );
      setEditing(false);
      setOpen(false);
    } catch (err) {
      setError(err.message || "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
            {initials(currentUser.displayName || currentUser.email)}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
          {currentUser.displayName || currentUser.email}
        </span>
      </button>

      {open && !editing && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-100 shadow-lg py-2 z-30">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {currentUser.displayName || "Sem nome"}
            </p>
            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Pencil size={14} /> Editar perfil
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      )}

      {open && editing && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-100 shadow-lg p-4 z-30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-800">Editar perfil</p>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-black text-sm outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Foto de perfil (URL)
              </label>
              <input
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-black text-sm outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}