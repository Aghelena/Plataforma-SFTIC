import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { Mail, Lock, LogIn, User, Loader2, Chrome } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const emailRef = useRef(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // --- login com email/senha
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/Admin");
    } catch (e) {
      console.error(e);
      setErr("Falha no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  // --- login com Google
  const handleGoogleLogin = async () => {
    setErr("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      nav("/Admin");
    } catch (e) {
      console.error(e);
      setErr("Erro ao fazer login com Google.");
    } finally {
      setLoading(false);
    }
  };

  // --- login anônimo
  const handleAnonymousLogin = async () => {
    setErr("");
    setLoading(true);
    try {
      await signInAnonymously(auth);
      nav("/Admin");
    } catch (e) {
      console.error(e);
      setErr("Erro ao fazer login anônimo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 via-white to-sky-50 p-4"
      id="conteudo"
    >
      <section
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        aria-label="Formulário de login"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Bem-vindo administrador(a)
        </h1>

        {/* --- LOGIN COM EMAIL --- */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="exemplo@email.com"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {err && (
            <p
              className="text-red-600 text-sm font-medium"
              role="alert"
              aria-live="assertive"
            >
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 font-semibold transition focus:ring-2 focus:ring-sky-300"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} /> Entrar
              </>
            )}
          </button>
        </form>

        {/* --- SEPARADOR --- */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="mx-3 text-gray-400 text-sm">ou</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* --- BOTÃO GOOGLE --- */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-white text-gray-800 border border-gray-300 rounded-lg py-2 font-semibold hover:bg-gray-100 transition focus:ring-2 focus:ring-sky-300"
        >
          <Chrome size={18} className="text-red-500" /> Entrar com Google
        </button>

        {/* --- BOTÃO ANÔNIMO --- */}
        <button
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 mt-3 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg py-2 font-semibold hover:bg-gray-200 transition focus:ring-2 focus:ring-sky-300"
        >
          <User size={18} /> Entrar anonimamente
        </button>

        {/* --- CADASTRO --- */}
        <p className="mt-6 text-center text-gray-700 text-sm">
          Não tem conta?{" "}
          <Link
            to="/signup"
            className="text-sky-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-sm"
          >
            Cadastre-se
          </Link>
        </p>
      </section>
    </main>
  );
}
