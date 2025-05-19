"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));
      if (user.isAdmin) router.push("/admin");
      else router.push("/user");
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao fazer login.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black relative overflow-hidden">
      {/* Grid de fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="none" stroke="#222" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <form
        onSubmit={handleSubmit}
        className="z-10 bg-neutral-900 rounded-2xl shadow-xl px-10 py-10 flex flex-col gap-6 w-full max-w-md items-center"
      >
        <h1 className="text-4xl font-extrabold text-gray-100 text-center mb-2">Login</h1>
        <style jsx global>{`
          .label-login {
            color: #fff;
          }
          .peer:focus ~ .label-login,
          .peer:focus + .label-login {
            color: #fde047 !important;
          }
          input:-webkit-autofill,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #000 inset !important;
            box-shadow: 0 0 0 1000px #000 inset !important;
            -webkit-text-fill-color: #fff !important;
            color: #fff !important;
            caret-color: #fde047 !important;
            border-color: #fde047 !important;
            transition: background-color 9999s ease-in-out 0s;
          }
        `}</style>
        <div className="relative w-full">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150"
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }}
            required
          />
          <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 transition-colors duration-150 label-login" style={{lineHeight:1}}>Usuário</span>
        </div>
        <div className="relative w-full">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150"
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }}
            required
          />
          <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 transition-colors duration-150 label-login" style={{lineHeight:1}}>Senha</span>
        </div>
        {error && (
          <div className="text-red-600 text-base text-center font-semibold">
            {error}
            <br />
            Caso não saiba seu login ou senha, entre em contato com a Thay.
          </div>
        )}
        <button
          type="submit"
          className="hover:scale-105 cursor-pointer w-full bg-yellow-200 hover:bg-yellow-500 text-black font-semibold text-xl rounded-xl py-4 mt-2 transition shadow-lg"
        >
          ENTRAR
        </button>
      </form>
      <footer className="z-10 absolute bottom-8 left-0 w-full text-center text-gray-200 text-base opacity-90">
        © Plus Promotora 2025
      </footer>
    </div>
  );
}
