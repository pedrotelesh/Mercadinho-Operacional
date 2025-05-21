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
    <div className="min-h-screen flex flex-col justify-center items-center bg-white relative overflow-hidden bg-[url('/fundo.webp')] bg-no-repeat bg-cover bg-center sm:bg-[url('/fundo.webp'),url('/fundo.webp'),url('/fundo.webp')] sm:bg-[length:33.3%_auto] sm:bg-[position:left_15%,center_15%,right_15%] sm:pt-20 sm:pb-20">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", zIndex: 1 }}
      ></div>
      <main className="z-10 flex flex-col items-center justify-center flex-1 w-full relative">
        <p className="text-2xl md:text-4xl text-black mb-2 text-center max-w-xl font-dyna font-bold">
          CAMPANHA MENSAL
        </p>
        <h1 className="text-5xl md:text-9xl font-extrabold text-black text-center mb-6 leading-tight drop-shadow-lg font-dyna">
          Mercadinho
          <br />
          Plus
        </h1>
        <button
          onClick={() => router.push("/login")}
          className="hover:cursor-pointer bg-red-600 text-black font-bold text-2xl px-12 py-2 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 border-b-4 border-r-4 border-black md:text-4xl"
        >
          ENTRAR
        </button>
      </main>
      <footer className="z-10 absolute bottom-8 left-0 w-full text-center text-black text-base">
        © Plus Promotora 2025
      </footer>
    </div>
  );
}
