"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function Popup({ message, type, onClose }: { message: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`fixed top-8 right-8 z-50 px-6 py-3 rounded-xl shadow-lg text-lg font-bold transition-all duration-500 pointer-events-none select-none
      ${type === "error" ? "bg-red-600 text-white" : "bg-green-500 text-white"}`}
      style={{ opacity: message ? 1 : 0 }}
    >
      {message}
    </div>
  );
}

// Tipos para histórico e usuário
interface PurchaseHistoryItem {
  id: number;
  createdAt: string;
  product: Product;
}
interface User {
  id: number;
  name: string;
  balance: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  estoque: number; // Adicionado campo de estoque
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/login");
      return;
    }
    const localUser = JSON.parse(u);
    // Busca o usuário atualizado do backend
    fetch(`/api/admin/users?id=${localUser.id}`)
      .then(res => res.ok ? res.json() : localUser)
      .then(data => {
        const updatedUser = Array.isArray(data) ? data[0] : data;
        if (updatedUser && typeof updatedUser.balance === 'number') {
          // Garante que não é admin
          if (updatedUser.isAdmin) {
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          setUser(localUser);
        }
      })
      .catch(() => setUser(localUser));
  }, [router]);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/purchases/history?userId=${user.id}`)
        .then(res => res.json())
        .then(setHistory);
    }
  }, [user]);

  async function handleBuy(productId: number, price: number) {
    setPopup(null);
    if (!user) return;
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, productId }),
    });
    if (res.ok) {
      setPopup({ msg: "Compra realizada!", type: "success" });
      setUser({ ...user, balance: user.balance - price });
      localStorage.setItem("user", JSON.stringify({ ...user, balance: user.balance - price }));
      // Atualiza histórico localmente
      fetch(`/api/purchases/history?userId=${user.id}`)
        .then(res => res.json())
        .then(setHistory);
      // Atualiza produtos para refletir estoque novo
      fetch("/api/products")
        .then(res => res.json())
        .then(setProducts);
    } else {
      const data = await res.json();
      setPopup({ msg: data.error || "Erro ao comprar", type: "error" });
    }
  }

  // Exemplo de função para adicionar/remover saldo (ajuste conforme sua lógica real)
  async function handleSaldo(amount: number) {
    setPopup(null);
    if (!user) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, saldo: amount }),
    });
    if (res.ok) {
      setPopup({ msg: amount > 0 ? "Saldo adicionado!" : "Saldo removido!", type: "success" });
      setUser({ ...user, balance: user.balance + amount });
      localStorage.setItem("user", JSON.stringify({ ...user, balance: user.balance + amount }));
    } else {
      const data = await res.json();
      setPopup({ msg: data.error || "Erro ao atualizar saldo", type: "error" });
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-black relative overflow-hidden">
      {/* Grid de fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" className="w-full h-full" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="none" stroke="#222" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="z-10 w-full max-w-6xl px-2 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-2 md:mb-0">
            Bem-vindo, <span className="text-yellow-200">{user.name}</span>
          </h1>
          <div className="flex gap-4 items-center">
            <span className="bg-green-200 text-green-900 px-4 py-1 rounded-xl text-lg font-bold shadow">
              Saldo: <span className="text-green-900">R$ {typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0,00'}</span>
            </span>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-1 rounded-xl text-lg shadow" onClick={() => { localStorage.removeItem("user"); router.push("/login"); }}>SAIR</button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-4 md:pt-8">
          {/* Produtos */}
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-yellow-100 mb-4 md:mb-6">ITENS DISPONÍVEIS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {products.map(prod => (
                <div key={prod.id} className="bg-neutral-900 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center min-w-[280px]">
                  <div className="text-2xl font-extrabold text-yellow-200 mb-1">{prod.name}</div>
                  <div className="text-lg font-bold text-gray-100 mb-1">R${prod.price.toFixed(2)}</div>
                  <div className="text-yellow-200 font-bold mb-2">Estoque: {prod.estoque}</div>
                  <div className="bg-gray-200 rounded-xl w-full h-32 flex items-center justify-center mb-4">
                    <Image 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      width={120} 
                      height={80} 
                      className="h-20 w-full object-cover opacity-60 mx-auto rounded-xl" 
                      style={{objectFit: 'cover'}}
                    />
                  </div>
                  <div className="text-white font-semibold mb-4">{prod.description}</div>
                  <button
                    className="bg-yellow-300 hover:bg-yellow-400 text-black font-extrabold text-xl rounded-xl px-8 py-3 mt-auto transition shadow-lg disabled:opacity-50 w-full"
                    disabled={prod.estoque === 0 || user.balance < prod.price}
                    onClick={() => handleBuy(prod.id, prod.price)}
                  >
                    {prod.estoque === 0 ? 'SEM ESTOQUE' : user.balance < prod.price ? 'SALDO INSUFICIENTE' : 'COMPRAR'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Histórico */}
          <div className="w-full md:w-80 flex-shrink-0 mt-12 md:mt-0">
            <h2 className="text-3xl font-extrabold text-yellow-100 mb-6 text-center">HISTÓRICO</h2>
            <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 text-white">
              {Array.isArray(history) && history.length === 0 ? (
                <div className="text-center text-gray-300">Nenhuma compra realizada ainda.</div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {Array.isArray(history) && groupHistory(history).map((group, idx) => (
                    <li key={idx} className="py-2">
                      <div className="font-bold text-lg text-center text-white mb-1">
                        {group.label}
                      </div>
                      {group.items.map((h) => (
                        <div key={h.id} className="flex justify-between items-center py-1">
                          <span className="font-extrabold text-yellow-200">{h.product.name}</span>
                          <span className="font-bold">R$ {h.product.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
      <footer className="z-10 absolute bottom-8 left-0 w-full text-center text-gray-200 text-base opacity-90">
        © Plus Promotora 2025
      </footer>
    </div>
  );
}

// Agrupa histórico por data (hoje, ontem, outros)
function groupHistory(history: PurchaseHistoryItem[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  function formatDate(date: Date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  const groups: { label: string, items: PurchaseHistoryItem[] }[] = [];
  const byDate: { [key: string]: PurchaseHistoryItem[] } = {};
  for (const h of history) {
    const d = new Date(h.createdAt);
    let label = formatDate(d);
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      label = 'Hoje';
    } else if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      label = 'Ontem';
    }
    if (!byDate[label]) byDate[label] = [];
    byDate[label].push(h);
  }
  // Ordena por data (Hoje, Ontem, depois datas mais antigas)
  if (byDate['Hoje']) groups.push({ label: 'Hoje', items: byDate['Hoje'] });
  if (byDate['Ontem']) groups.push({ label: 'Ontem', items: byDate['Ontem'] });
  Object.keys(byDate)
    .filter(l => l !== 'Hoje' && l !== 'Ontem')
    .sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    })
    .forEach(label => groups.push({ label, items: byDate[label] }));
  return groups;
}
