import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    const form = e.target;
    const name = form.elements.namedItem("name").value.trim();
    const email = form.elements.namedItem("email").value.trim();
    const password = form.elements.namedItem("password").value;

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
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar conta</h1>
      <form onSubmit={onSubmit} aria-describedby={err ? "error" : undefined}>
        <div className="mb-3">
          <label htmlFor="name" className="block font-medium">Nome</label>
          <input id="name" name="name" required className="w-full text-black border rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="block font-medium">E-mail</label>
          <input id="email" name="email" type="email" required className="w-full border text-black rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="block font-medium">Senha</label>
          <input id="password" name="password" type="password" required className="w-full text-black border rounded px-3 py-2" />
        </div>

        {err && (
          <p id="error" role="alert" aria-live="assertive" className="text-red-600 mb-3">
            {err}
          </p>
        )}

        <button
          className="w-full border rounded px-3 py-2 font-semibold disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <p className="mt-3">
        Já tem conta? <Link className="underline" to="/login">Entrar</Link>
      </p>
    </main>
  );
}
