"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = localStorage.getItem("user");
    if (u) {
      const user = JSON.parse(u);
      if (user.isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/user");
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black relative overflow-hidden">
      {/* Grid de fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg
          width="100%"
          height="100%"
          className="w-full h-full"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <pattern
              id="grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="80"
                height="80"
                fill="none"
                stroke="#222"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <main className="z-10 flex flex-col items-center justify-center flex-1 w-full">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-200 text-center mb-6 leading-tight drop-shadow-lg">
          Mercadinho
          <br />
          Operacional
        </h1>
        <p className="text-lg text-gray-200 mb-10 text-center max-w-xl">
          Bem-vindo ao mercado virtual do operacional! Faça login para começar a
          usar.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-xl rounded-xl px-8 py-2 transition mb-20 shadow-lg cursor-pointer"
        >
          LOGIN
        </button>
      </main>
      <footer className="z-10 absolute bottom-8 left-0 w-full text-center text-gray-200 text-base opacity-90">
        © Plus Promotora 2025
      </footer>
    </div>
  );
}
