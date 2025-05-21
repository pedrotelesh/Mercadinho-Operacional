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
    <div className="min-h-screen flex flex-col justify-center items-center bg-white relative overflow-hidden bg-[url('/fundo.webp')] bg-no-repeat bg-cover bg-center sm:bg-[url('/fundo.webp'),url('/fundo.webp'),url('/fundo.webp')] sm:bg-[length:33.3%_auto] sm:bg-[position:left_15%,center_15%,right_15%] sm:pt-20 sm:pb-20">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", zIndex: 1 }}
      ></div>
      <form
        onSubmit={handleSubmit}
        className="z-10 bg-neutral-900 rounded-2xl shadow-xl px-4 py-6 flex flex-col gap-4 w-full max-w-xs sm:max-w-md sm:px-10 sm:py-10 sm:gap-6 items-center"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-100 text-center mb-2 font-dyna">LOGIN</h1>
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
          <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 transition-colors duration-150 label-login font-dyna" style={{lineHeight:1}}>Usuário</span>
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
          <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 transition-colors duration-150 label-login font-dyna" style={{lineHeight:1}}>Senha</span>
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
          className="hover:cursor-pointer bg-red-600 text-black font-bold text-2xl px-12 py-2 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 border-b-4 border-r-4 border-black md:text-4xl"
        >
          LOGIN
        </button>
      </form>
      <footer className="z-10 absolute bottom-8 left-0 w-full text-center text-black text-base">
        © Plus Promotora 2025
      </footer>
    </div>
  );
}
