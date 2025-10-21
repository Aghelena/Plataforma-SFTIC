import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const emailRef = useRef(null);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const form = e.target;
    const email = form.elements.namedItem("email").value;
    const password = form.elements.namedItem("password").value;
    try {admin
      await signIn(email, password);
      nav("/Admin");
    } catch (e) {
      setErr("Falha no login. Verifique suas credenciais.");
    }
  };

  return (
    <main className="max-w-sm mx-auto p-4" id="conteudo">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      <form onSubmit={onSubmit} aria-describedby={err ? "error" : undefined}>
        <div className="mb-3">
          <label htmlFor="email" className="block font-medium">
            E-mail
          </label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            required
            className="w-full text-black border rounded px-3 py-2"
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="block font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border text-black rounded px-3 py-2"
          />
        </div>
        {err && (
          <p
            id="error"
            role="alert"
            aria-live="assertive"
            className="text-red-700 mb-3"
          >
            {err}
          </p>
        )}
        <button className="w-full border rounded px-3 py-2 font-semibold">
          Entrar
        </button>
      </form>
      <p className="mt-3">
        Não tem conta?{" "}
        <Link to="/signup" className="underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
