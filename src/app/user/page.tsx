"use client";
import { useEffect, useState, useRef } from "react";
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
  estoque: number;
  tipo?: string; // Novo campo opcional para categoria
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [showSaldoInfo, setShowSaldoInfo] = useState(false);
  const [categoria, setCategoria] = useState<string>("");
  const saldoInfoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const categorias = [
    { label: "TODOS", value: "" },
    { label: "LANCHONETE", value: "LANCHONETE" },
    { label: "ELETRÔNICOS", value: "ELETRÔNICOS" },
    { label: "VALES", value: "VALES" },
  ];

  const produtosFiltrados = categoria === "" ? products : products.filter(p => p.tipo === categoria);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/login");
      return;
    }
    const localUser = JSON.parse(u);
    // Evita chamar a API de admin para usuários não administradores
    if (!localUser.isAdmin) {
      setUser(localUser);
      return;
    }
    // Busca o usuário atualizado do backend apenas se for admin
    fetch(`/api/admin/users?id=${localUser.id}`)
      .then(res => res.ok ? res.json() : localUser)
      .then(data => {
        const updatedUser = Array.isArray(data) ? data[0] : data;
        if (updatedUser && typeof updatedUser.balance === 'number') {
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

  // Fecha popup ao clicar fora
  useEffect(() => {
    if (!showSaldoInfo) {
      document.body.classList.remove('overflow-hidden');
      return;
    }
    function handleClick(e: MouseEvent) {
      if (saldoInfoRef.current && !saldoInfoRef.current.contains(e.target as Node)) {
        setShowSaldoInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.body.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.body.classList.remove('overflow-hidden');
    };
  }, [showSaldoInfo]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-white relative overflow-hidden">
      {/* Grid de fundo quadriculado cinza */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" className="w-full h-full blur-[1px]" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="none" stroke="#edecec" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      {/* Imagens na metade inferior */}
      <div className="fixed left-0 right-0 w-full flex items-start overflow-hidden" style={{top: '50%', height: '50%', zIndex: 2}}>
        <div className="flex flex-row w-full h-full items-start">
          {[1,2,3,4,5].map(n => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={`/${n}.webp`}
              alt={`Banner ${n}`}
              className="object-top object-cover h-full w-1/5 max-h-none rounded-none drop-shadow- blur-[1px] opacity-80"
              draggable="false"
            />
          ))}
        </div>
      </div>
      {/* Popup de informações de saldo */}
      {showSaldoInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{backdropFilter:'blur(2px)'}}>
          <div ref={saldoInfoRef} className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-2 p-0 flex flex-col max-h-[90vh]">
            <button
              className="absolute top-2 right-2 text-2xl font-bold text-black bg-white/80 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-200 z-10 border border-gray-300 cursor-pointer"
              onClick={() => setShowSaldoInfo(false)}
              aria-label="Fechar"
              tabIndex={0}
            >
              ×
            </button>
            <div className="w-full flex flex-col gap-8 px-4 pt-8 pb-8 overflow-y-auto">
              <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-8 text-center font-dyna">Como ganhar saldo (PlusCash)</h1>
              {/* Tabela Metas */}
              <div className="rounded-2xl shadow-xl bg-black">
                <table className="min-w-full w-full text-center table-fixed">
                  <colgroup>
                    <col className="w-1/2" />
                    <col className="w-1/2" />
                  </colgroup>
                  <thead>
                    <tr className="bg-yellow-400">
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tl-2xl">
                        SETOR
                      </th>
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tr-2xl">
                        META
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Apoio</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-white">76 Propostas</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Apoio/Auditoria</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-white">150 Propostas</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Auditoria</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-white">45 Propostas</td></tr>
                    <tr><td className="px-4 py-2 text-yellow-300 font-dyna">Auditoria Limite</td><td className="px-4 py-2 font-bold text-white">240 Propostas</td></tr>
                  </tbody>
                </table>
              </div>
              {/* Tabela Recompensa */}
              <div className="rounded-2xl shadow-xl bg-black">
                <table className="min-w-full w-full text-center table-fixed">
                  <colgroup>
                    <col className="w-1/2" />
                    <col className="w-1/2" />
                  </colgroup>
                  <thead>
                    <tr className="bg-green-500">
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tl-2xl">
                        DESEMPENHO
                      </th>
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tr-2xl">
                        RECOMPENSAS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Meta Batida</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-green-500">+ R$7,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">70% da Meta</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-green-500">+ R$2,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 text-yellow-300 font-dyna">Menos de 70% da Meta</td><td className="px-4 py-2 font-bold">= R$0,00 PlusCash</td></tr>
                  </tbody>
                </table>
              </div>
              {/* Tabela Descontos */}
              <div className="rounded-2xl shadow-xl bg-black">
                <table className="min-w-full w-full text-center table-fixed">
                  <colgroup>
                    <col className="w-1/2" />
                    <col className="w-1/2" />
                  </colgroup>
                  <thead>
                    <tr className="bg-red-500">
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tl-2xl">
                        ERROS
                      </th>
                      <th className="px-4 py-2 text-lg font-bold border-b border-gray-300 text-black font-dyna                  rounded-tr-2xl">
                        DESCONTOS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Anexar/Subir Confirmação Errada</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-red-500">- R$2,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Esquecer Confirmações</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-red-500">- R$2,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Anexar Fora do Local</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-red-500">- R$1,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 border-b border-gray-400 text-yellow-300 font-dyna">Pendencia Errada</td><td className="px-4 py-2 border-b border-gray-400 font-bold text-red-500">- R$2,00 PlusCash</td></tr>
                    <tr><td className="px-4 py-2 text-yellow-300 font-dyna">Confirmação com Qualidade Ruim</td><td className="px-4 py-2 font-bold text-red-500">- R$1,00 PlusCash</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="z-10 w-full max-w-6xl px-2 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 md:mb-0 font-dyna">
            Bem-vindo, <span className="text-yellow-600">{user.name}</span>
          </h1>
          <div className="flex gap-4 items-center">
            <button
              className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border  text-green-900 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 mr-2 border-b-3 border-r-3 border-black hover:scale-105 transition-transform transform cursor-pointer"
              title="Como ganhar saldo?"
              onClick={() => setShowSaldoInfo(true)}
              style={{ fontSize: '1.1rem', lineHeight: 1 }}
            >
              ?
            </button>
            <span className="bg-green-200 text-green-900 px-4 py-1 rounded-xl text-lg font-bold shadow font-dyna border-b-4 border-r-4 border-green-900">
              Saldo: <span className="text-green-900">R$ {typeof user?.balance === 'number' ? user.balance.toFixed(2) : '0,00'}</span>
            </span>
            <button className="text-black hover:scale-105 hover:cursor-pointer shadow-lg hover:bg-red-700 hover:border-red-900 transition-transform transform bg-red-600 font-bold px-6 py-1 rounded-xl text-lg font-dyna border-b-4 border-r-4 border-black" onClick={() => { localStorage.removeItem("user"); router.push("/login"); }}>SAIR</button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-4 md:pt-8">
        {/* Produtos */}
        <div className="flex-1">
          <h2 className="text-4xl font-extrabold text-black mb-4 md:mb-6 font-dyna">ITENS DISPONÍVEIS</h2>
          {/* CATEGORIAS */}
          <div className="flex gap-2 mb-6 flex-wrap justify-center flex-auto md:flex-wrap md:justify-start">
            {categorias.map(cat => (
              <button
                key={cat.value}
                className={`px-4 py-2 rounded-xl cursor-pointer font-bold transition font-dyna basis-1/3 md:basis-auto border-b-4 border-r-4 border-black ${categoria === cat.value ? "bg-yellow-300 border-yellow-600 text-black" : "bg-gray-100 border-black text-black hover:bg-yellow-100"}`}
                onClick={() => setCategoria(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {produtosFiltrados.map(prod => (
              <div key={prod.id} className="bg-neutral-900 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center min-w-[280px] group">
                <div className="text-2xl font-extrabold text-yellow-200 mb-1 font-dyna">{prod.name}</div>
                <div className="text-lg font-bold text-gray-100 mb-1 font-dyna">R${prod.price.toFixed(2)}</div>
                <div className="text-yellow-200 font-bold mb-2 font-dyna">Estoque: {prod.estoque}</div>
                <div className="bg-gray-200 rounded-xl w-full h-32 flex items-center justify-center mb-4">
                  <Image 
                    src={prod.imageUrl} 
                    alt={prod.name} 
                    width={120} 
                    height={120} 
                    className="h-20 w-full object-cover mx-auto rounded-xl transition-transform duration-300 group-hover:scale-125" 
                    style={{objectFit: 'contain'}}
                    loading="lazy"
                  />
                </div>
                <div className="text-white font-semibold mb-4">{prod.description}</div>
                <button
                  className={
                    [
                      'font-extrabold text-xl rounded-xl px-8 py-3 mt-auto transition shadow-lg w-full border-b-4 border-r-4',
                      prod.estoque === 0
                        ? 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed opacity-60'
                        : user.balance < prod.price
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-400 cursor-not-allowed opacity-80'
                        : 'bg-yellow-200 hover:bg-yellow-500 text-black hover:text-white border-gray-600 hover:border-yellow-600 cursor-pointer hover:scale-105',
                    ].join(' ')
                  }
                  disabled={prod.estoque === 0 || user.balance < prod.price}
                  onClick={() => handleBuy(prod.id, prod.price)}
                >
                  {prod.estoque === 0
                    ? 'SEM ESTOQUE'
                    : user.balance < prod.price
                    ? 'SALDO INSUFICIENTE'
                    : 'COMPRAR'}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Histórico */}
        <div className="w-full md:w-80 flex-shrink-0 mt-12 md:mt-0 mb-12">
          <h2 className="text-4xl font-extrabold text-black md:text-yellow-600 mb-6 text-center font-dyna">HISTÓRICO</h2>
          <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 text-white">
            {Array.isArray(history) && history.length === 0 ? (
              <div className="text-center text-gray-300">Nenhuma compra realizada ainda.</div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {Array.isArray(history) && groupHistory(history).map((group, idx) => (
                  <li key={idx} className="py-2">
                    <div className="font-bold text-lg text-center text-white mb-1 font-dyna">
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
      <footer className="z-10 w-full text-center text-black text-base opacity-90 py-6 bg-gray-300 border-t border-white-800 mt-auto font-bold">
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
