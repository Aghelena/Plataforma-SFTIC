import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { Mail, Lock, LogIn, User, Loader2, Chrome } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const emailRef = useRef(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const goBack = () => (window.history.length > 1 ? nav(-1) : nav("/"));

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


  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Voltar */}
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:bg-black/5 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          {/* placeholder para manter o espaçamento */}
          <span className="w-[88px]" aria-hidden="true" />
        </div>
      </header>

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
    </>
  );
}
