import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const form = e.target;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    try {
      await signUp(email, password, name);
      nav("/");
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") setErr("Este e-mail já está em uso.");
      else if (code === "auth/invalid-email") setErr("E-mail inválido.");
      else if (code === "auth/weak-password") setErr("A senha precisa ter pelo menos 6 caracteres.");
      else if (code === "auth/network-request-failed") setErr("Sem conexão com a internet.");
      else setErr("Não foi possível cadastrar.");
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
        aria-label="Formulário de cadastro"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
          <UserPlus size={28} className="text-sky-500" /> Criar conta
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="Seu nome"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          {/* Senha */}
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

          {/* Erros */}
          {err && (
            <p
              className="text-red-600 text-sm font-medium"
              role="alert"
              aria-live="assertive"
            >
              {err}
            </p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 font-semibold transition focus:ring-2 focus:ring-sky-300"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Cadastrando...
              </>
            ) : (
              <>Cadastrar</>
            )}
          </button>
        </form>

        {/* Link para login */}
        <p className="mt-6 text-center text-gray-700 text-sm">
          Já tem conta?{" "}
          <Link
            to="/login"
            className="text-sky-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-sm"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
