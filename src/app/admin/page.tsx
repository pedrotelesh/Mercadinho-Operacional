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

interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
  isAdmin: boolean;
}
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  estoque: number; // Adicionado campo de estoque
}
interface Purchase {
  id: number;
  user: User;
  product: Product;
  createdAt: string;
  status: string;
  seenByAdmin: boolean;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [tab, setTab] = useState("compras");
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<{ [userId: number]: boolean }>({});
  const [globalPopup, setGlobalPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(u);
    if (user.isAdmin) {
      setAdmin(user);
    } else {
      router.push("/user");
    }
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        await fetch("/api/purchases/seen", { method: "PATCH" }); // Marca compras como vistas
        const [usersRes, productsRes, purchasesRes] = await Promise.all([
          fetch("/api/admin/users", { headers: { "x-admin": "true" } }).then(r => r.ok ? r.json() : []),
          fetch("/api/products").then(r => r.ok ? r.json() : []),
          fetch("/api/purchases").then(r => r.ok ? r.json() : []),
        ]);
        setUsers(usersRes);
        setProducts(productsRes);
        setPurchases(purchasesRes);
      } catch {
        setUsers([]);
        setProducts([]);
        setPurchases([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Funções para atualizar dados sem reload
  async function refreshUsers() {
    const res = await fetch("/api/admin/users", { headers: { "x-admin": "true" } });
    if (res.ok) {
      const updated = await res.json();
      setUsers(updated);
    }
  }
  async function refreshProducts() {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }
  async function refreshPurchases() {
    const res = await fetch("/api/purchases");
    if (res.ok) setPurchases(await res.json());
  }

  async function handleRemoveUser(u: User) {
    if (u.name === "admin.plus") return;
    if (confirm("Remover usuário?")) {
      try {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-admin": "true" },
          body: JSON.stringify({ userId: u.id }),
        });
        if (res.ok) {
          setGlobalPopup({ msg: "Usuário removido!", type: "success" });
          refreshUsers();
        } else {
          let data;
          try { data = await res.json(); } catch { data = {}; }
          setGlobalPopup({ msg: data?.error || "Erro ao remover usuário", type: "error" });
        }
      } catch {
        setGlobalPopup({ msg: "Erro ao remover usuário", type: "error" });
      }
    }
  }

  if (!admin) return null;

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
      <div className="z-10 w-full max-w-6xl px-2 pt-10 pb-24">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 md:mb-0 font-dyna">
            Painel da <span className="text-yellow-600">Thay</span>
          </h1>
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center md:justify-start">
            <button className={tab === "compras" ? "hover:scale-105 cursor-pointer bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4  border-yellow-600" : "hover:border-yellow-600 hover:scale-105 cursor-pointer bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4 border-black"} onClick={() => setTab("compras")}>HISTÓRICO</button>
            <button className={tab === "usuarios" ? "hover:scale-105 cursor-pointer bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4 border-yellow-600" : "hover:border-yellow-600 hover:scale-105 cursor-pointer bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4 border-black"} onClick={() => setTab("usuarios")}>USUÁRIOS</button>
            <button className={tab === "produtos" ? "hover:scale-105 cursor-pointer bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4 border-yellow-600" : "hover:border-yellow-600 hover:scale-105 cursor-pointer bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow border-b-4 border-r-4 border-black"} onClick={() => setTab("produtos")}>PRODUTOS</button>
            <button className="text-black hover:scale-105 hover:cursor-pointer shadow-lg hover:bg-red-700 hover:border-red-900 transition-transform transform bg-red-600 font-bold px-6 py-1 rounded-xl text-lg font-dyna border-b-4 border-r-4 border-black" onClick={() => { localStorage.removeItem("user"); router.push("/login"); }}>SAIR</button>
          </div>
        </div>
        {loading ? <div className="text-gray-100">Carregando...</div> : (
          <>
            {tab === "compras" && (
              <div className="w-full flex flex-col pt-4 md:pt-8">
                <h2 className="text-4xl font-extrabold text-black mb-8 text-center w-full font-dyna">HISTÓRICO DE COMPRAS</h2>
                <div className="bg-neutral-900 rounded-2xl shadow-xl px-2 sm:px-8 py-6 sm:py-8 w-full flex flex-col">
                  <div className="w-full mb-2 items-center">
                    <div className="grid grid-cols-1 sm:grid-cols-6 text-center gap-y-2">
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">USUÁRIO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">PRODUTO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">PREÇO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">DATA</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">REEMBOLSAR</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna sm:block hidden">PAGO</div>
                    </div>
                  </div>
                  <ul className="w-full divide-y divide-gray-800">
                    {purchases.length === 0 ? (
                      <li className="text-gray-300 text-center py-8 col-span-3">Nenhuma compra realizada ainda.</li>
                    ) : (
                      (() => {
                        // Agrupa por usuário
                        const grouped: { [userId: number]: { user: User, items: Purchase[], latest: Date } } = {};
                        purchases.forEach((p) => {
                          if (!grouped[p.user.id]) grouped[p.user.id] = { user: p.user, items: [], latest: new Date(p.createdAt) };
                          grouped[p.user.id].items.push(p);
                          // Atualiza a data mais recente
                          if (new Date(p.createdAt) > grouped[p.user.id].latest) {
                            grouped[p.user.id].latest = new Date(p.createdAt);
                          }
                        });
                        // Ordena os grupos pelo mais recente
                        const sortedGroups = Object.values(grouped)
                          .sort((a, b) => b.latest.getTime() - a.latest.getTime());
                        return sortedGroups.map(group => {
                          const isExpanded = expandedUsers[group.user.id] || false;
                          // Ordena as compras do usuário da mais recente para a mais antiga
                          const sortedItems = group.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                          return (
                            <li key={group.user.id} className="mb-6">
                              <div
                                className="text-yellow-100 text-xl font-bold mb-2 flex items-center gap-2 select-none cursor-pointer hover:text-yellow-200 transition-colors"
                                style={{userSelect: 'none'}}
                                onClick={() => setExpandedUsers(prev => ({ ...prev, [group.user.id]: !prev[group.user.id] }))}
                              >
                                <span className="inline-block transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                  ▶
                                </span>
                                <span className="px-3 py-1">{group.user.name}</span>
                              </div>
                              {isExpanded && (
                                <ul className="divide-y divide-gray-800">
                                  {sortedItems.map((p) => (
                                    <li key={p.id}
                                      className="py-3 text-center grid grid-cols-3 items-center gap-2 md:grid-cols-6 md:gap-0 bg-black/10 rounded-xl md:bg-transparent md:rounded-none md:text-center"
                                    >
                                      {/* Mobile: cada campo em linha, com label */}
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Usuário</span>
                                        <span className="text-white text-base font-bold">{p.user.name}</span>
                                      </div>
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Produto</span>
                                        <span className="text-white text-base font-bold">{p.product.name}</span>
                                      </div>
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Preço</span>
                                        <span className="text-green-400 text-base font-bold">R$ {p.product.price}</span>
                                      </div>
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Data</span>
                                        <span className="text-white text-base font-bold">{formatDate(p.createdAt)}</span>
                                      </div>
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Reembolsar</span>
                                        <span>
                                          <button
                                            className="hover:scale-105 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150"
                                            title="Excluir e reembolsar"
                                            onClick={async () => {
                                              if (confirm("Excluir este item do histórico e reembolsar o usuário?")) {
                                                await fetch("/api/purchases", {
                                                  method: "DELETE",
                                                  headers: { "Content-Type": "application/json", "x-admin": "true" },
                                                  body: JSON.stringify({ purchaseId: p.id }),
                                                });
                                                refreshPurchases();
                                                refreshUsers();
                                              }
                                            }}
                                          >
                                            <span role="img" aria-label="remover">🗑️</span>
                                          </button>
                                        </span>
                                      </div>
                                      <div className="flex flex-col md:hidden text-left px-2 gap-1">
                                        <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Pago</span>
                                        <span>
                                          <input
                                            type="checkbox"
                                            checked={p.seenByAdmin}
                                            onChange={async (e) => {
                                              await fetch("/api/purchases/seen", {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json", "x-admin": "true" },
                                                body: JSON.stringify({ purchaseId: p.id, seen: e.target.checked }),
                                              });
                                              refreshPurchases();
                                            }}
                                            className="w-5 h-5 accent-yellow-400 cursor-pointer"
                                            title="Marcar como pago"
                                          />
                                        </span>
                                      </div>
                                      {/* Desktop: grid 6 colunas */}
                                      <div className="hidden md:flex text-white text-lg font-bold items-center justify-center">{p.user.name}</div>
                                      <div className="hidden md:flex text-white text-lg font-bold items-center justify-center">{p.product.name}</div>
                                      <div className="hidden md:flex text-green-400 text-lg font-bold items-center justify-center">R$ {p.product.price}</div>
                                      <div className="hidden md:flex text-white text-lg font-bold items-center justify-center">{formatDate(p.createdAt)}</div>
                                      <div className="hidden md:flex justify-center">
                                        <button
                                          className="hover:scale-105 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150"
                                          title="Excluir e reembolsar"
                                          onClick={async () => {
                                            if (confirm("Excluir este item do histórico e reembolsar o usuário?")) {
                                              await fetch("/api/purchases", {
                                                method: "DELETE",
                                                headers: { "Content-Type": "application/json", "x-admin": "true" },
                                                body: JSON.stringify({ purchaseId: p.id }),
                                              });
                                              refreshPurchases();
                                              refreshUsers();
                                            }
                                          }}
                                        >
                                          <span role="img" aria-label="remover">🗑️</span>
                                        </button>
                                      </div>
                                      <div className="hidden md:flex justify-center items-center">
                                        <input
                                          type="checkbox"
                                          checked={p.seenByAdmin}
                                          onChange={async (e) => {
                                            await fetch("/api/purchases/seen", {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json", "x-admin": "true" },
                                              body: JSON.stringify({ purchaseId: p.id, seen: e.target.checked }),
                                            });
                                            refreshPurchases();
                                          }}
                                          className="w-5 h-5 accent-yellow-400 cursor-pointer"
                                          title="Marcar como pago"
                                        />
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        });
                      })()
                    )}
                  </ul>
                </div>
              </div>
            )}
            {tab === "usuarios" && (
              <div className="flex flex-col md:flex-row gap-8 w-full pt-4 md:pt-8 items-start">
                {/* Tabela de usuários */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-4xl font-extrabold text-black mb-6 font-dyna">USUÁRIOS</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 w-full">
                    {/* Mobile/tablet grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 justify-items-center md:hidden">
                      {users.map(u => (
                        <div key={u.id} className="flex flex-col gap-2 bg-black/10 rounded-xl max-w-xs w-full p-4">
                          <div className="flex items-center gap-2">
                            <button
                              className={`hover:scale-105 bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150${u.name === "admin.plus" ? " opacity-50 cursor-not-allowed" : " cursor-pointer"}`}
                              title={u.name === "admin.plus" ? "Não é possível remover o admin.plus" : "Remover usuário"}
                              onClick={() => handleRemoveUser(u)}
                              disabled={u.name === "admin.plus"}
                            >
                              <span role="img" aria-label="remover">🗑️</span>
                            </button>
                            <span className="text-white text-lg font-bold">{u.name}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Saldo</span>
                            <span className="text-green-400 text-lg font-bold">R${u.balance}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Adicionar</span>
                            <div className="flex justify-end items-center gap-2 pr-0">
                              <AddSaldo userId={u.id} onSuccess={refreshUsers} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Remover</span>
                            <div className="flex justify-end items-center gap-2 pr-0">
                              <RemoverSaldo userId={u.id} onSuccess={refreshUsers} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop grid */}
                    <div className="hidden md:block">
                      <div className="grid grid-cols-4 text-center mb-4 w-full">
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase text-left pl-4 font-dyna">NOME</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">SALDO</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">ADICIONAR</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">REMOVER</div>
                      </div>
                      <div className="divide-y divide-gray-800 w-full">
                        {users.map(u => (
                          <div key={u.id} className="grid grid-cols-4 items-center py-3 w-full">
                            <div className="flex items-center gap-2 text-left pl-4">
                              <button
                                className={`hover:scale-105 bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150${u.name === "admin.plus" ? " opacity-50 cursor-not-allowed" : " cursor-pointer"}`}
                                title={u.name === "admin.plus" ? "Não é possível remover o admin.plus" : "Remover usuário"}
                                onClick={() => handleRemoveUser(u)}
                                disabled={u.name === "admin.plus"}
                              >
                                <span role="img" aria-label="remover">🗑️</span>
                              </button>
                              <span className="text-white text-lg font-bold">{u.name}</span>
                            </div>
                            <div className="text-green-400 text-lg font-bold text-center">R${u.balance}</div>
                            <div className="flex justify-end items-center gap-2 pr-6">
                              <AddSaldo userId={u.id} onSuccess={refreshUsers} />
                            </div>
                            <div className="flex justify-end items-center gap-2 pr-6">
                              <RemoverSaldo userId={u.id} onSuccess={refreshUsers} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Formulário de criar usuário */}
                <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto self-start">
                  <CriarUsuario onSuccess={refreshUsers} />
                </div>
              </div>
            )}
            {tab === "produtos" && (
              <div className="flex flex-col md:flex-row gap-8 w-full pt-4 md:pt-8 items-start">
                {/* Lista de produtos */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-4xl font-extrabold text-black mb-6 font-dyna">PRODUTOS</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 w-full">
                    {/* Mobile/tablet grid de produtos */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 justify-items-center md:hidden">
                      {products.length === 0 ? (
                        <div className="text-gray-300 text-center py-8 col-span-2">Nenhum produto cadastrado ainda.</div>
                      ) : (
                        products.map(p => (
                          <div key={p.id} className="flex flex-col gap-2 bg-black/10 rounded-xl max-w-xs w-full p-4 shadow-lg border border-yellow-900/20">
                            <div className="flex items-center gap-2">
                              <button
                                className="hover:scale-105 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150 mr-2"
                                title="Remover produto"
                                onClick={async () => {
                                  if (confirm("Remover produto?")) {
                                    await fetch("/api/products", {
                                      method: "DELETE",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ id: p.id }),
                                    });
                                    refreshProducts();
                                  }
                                }}
                              >
                                <span role="img" aria-label="remover">🗑️</span>
                              </button>
                              <div className="bg-gray-200 rounded-xl w-20 h-12 flex items-center justify-center overflow-hidden">
                                <Image src={p.imageUrl} alt={p.name} width={80} height={48} className="h-12 w-full object-cover mx-auto rounded-xl" style={{objectFit: 'contain'}} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Nome</span>
                              <span className="text-white text-lg font-bold break-words min-w-[100px] font-dyna">{p.name}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Descrição</span>
                              <span className="text-white text-base break-words max-w-xs mx-auto">{p.description}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Preço</span>
                              <span className="text-green-400 text-lg font-bold min-w-[70px] font-dyna">R$ {p.price}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Estoque</span>
                              <span className="text-yellow-200 text-lg font-bold">{p.estoque}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Adicionar</span>
                              <div className="flex justify-center"><AddEstoque productId={p.id} onSuccess={refreshProducts} /></div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-yellow-200 text-xs font-bold uppercase font-dyna">Remover</span>
                              <div className="flex justify-center"><RemoverEstoque productId={p.id} estoqueAtual={p.estoque} onSuccess={refreshProducts} /></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Desktop grid de produtos */}
                    <div className="hidden md:block">
                      <div className="grid grid-cols-7 text-center mb-4 w-full">
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase text-left pl-4 font-dyna">IMG</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">NOME</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">DESC</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">PREÇO</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">QTD</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">ADD</div>
                        <div className="text-yellow-200 text-2xl font-extrabold uppercase font-dyna">REM</div>
                      </div>
                      <div className="divide-y divide-gray-800 w-full">
                        {products.length === 0 ? (
                          <div className="text-gray-300 text-center py-8 col-span-7">Nenhum produto cadastrado ainda.</div>
                        ) : (
                          products.map(p => (
                            <div key={p.id} className="grid grid-cols-7 items-center py-4 w-full text-center">
                              <div className="flex items-center gap-2 text-left pl-4">
                                <button
                                  className="hover:scale-105 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150 mr-2"
                                  title="Remover produto"
                                  onClick={async () => {
                                    if (confirm("Remover produto?")) {
                                      await fetch("/api/products", {
                                        method: "DELETE",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: p.id }),
                                      });
                                      refreshProducts();
                                    }
                                  }}
                                >
                                  <span role="img" aria-label="remover">🗑️</span>
                                </button>
                                <div className="bg-gray-200 rounded-xl w-20 h-12 flex items-center justify-center overflow-hidden">
                                  <Image src={p.imageUrl} alt={p.name} width={80} height={48} className="h-12 w-full object-cover mx-auto rounded-xl" style={{objectFit: 'contain'}} />
                                </div>
                              </div>
                              <div className="text-white text-lg font-bold break-words min-w-[100px] font-dyna">{p.name}</div>
                              <div className="text-white text-base break-words max-w-xs mx-auto">{p.description}</div>
                              <div className="text-green-400 text-lg font-bold min-w-[70px] font-dyna">R$ {p.price}</div>
                              <div className="text-yellow-200 text-lg font-bold">{p.estoque}</div>
                              <div className="flex justify-center"><AddEstoque productId={p.id} onSuccess={refreshProducts} /></div>
                              <div className="flex justify-center"><RemoverEstoque productId={p.id} estoqueAtual={p.estoque} onSuccess={refreshProducts} /></div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Formulário de cadastrar produto */}
                <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto">
                  <h2 className="text-4xl font-extrabold text-black md:text-yellow-600 mb-6 text-center font-dyna">CADASTRAR</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-8 w-full">
                    <FormProduto onSuccess={refreshProducts} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="z-10 w-full text-center text-black text-base opacity-90 py-6 bg-gray-300 border-t border-white-800 mt-auto font-bold">
        © Plus Promotora 2025
      </footer>
      <style jsx global>{`
  .label-admin {
    color: #fff;
    transition: color 0.15s;
  }
  .peer:focus ~ .label-admin,
  .peer:focus + .label-admin {
    color: #fde047 !important;
  }
`}</style>
      <Popup message={globalPopup?.msg || ""} type={globalPopup?.type || "error"} onClose={() => setGlobalPopup(null)} />
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
    </div>
  );
}

function AddSaldo({ userId, onSuccess }: { userId: number; onSuccess: () => void }) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function adicionar() {
    setPopup(null);
    setLoading(true);
    const v = parseFloat(valor.replace(",", "."));
    if (isNaN(v) || v <= 0) {
      setPopup({ msg: "Valor inválido", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin": "true" },
      body: JSON.stringify({ userId, amount: v }),
    });
    setLoading(false);
    if (res.ok) {
      setValor("");
      setPopup({ msg: "Saldo adicionado!", type: "success" });
      onSuccess();
    }
  }

  return (
    <div className="flex gap-2 items-center relative">
      <input
        type="number"
        min="0"
        step="0.01"
        value={valor}
        onChange={e => setValor(e.target.value)}
        className="border border-gray-400 p-1 rounded w-20 text-sm bg-black text-white"
        placeholder="R$"
      />
      <button
        className="hover:scale-105 cursor-pointer bg-green-700 hover:bg-green-800 text-white font-bold rounded px-4 py-1 text-base disabled:opacity-50"
        onClick={adicionar}
        disabled={loading}
        type="button"
      >+</button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </div>
  );
}

function RemoverSaldo({ userId, onSuccess }: { userId: number; onSuccess: () => void }) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function remover() {
    setPopup(null);
    setLoading(true);
    const v = parseFloat(valor.replace(",", "."));
    if (isNaN(v) || v <= 0) {
      setPopup({ msg: "Valor inválido", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin": "true" },
      body: JSON.stringify({ userId, amount: -v }),
    });
    setLoading(false);
    if (res.ok) {
      setValor("");
      setPopup({ msg: "Saldo removido!", type: "success" });
      onSuccess();
    }
  }

  return (
    <div className="flex gap-2 items-center relative">
      <input
        type="number"
        min="0"
        step="0.01"
        value={valor}
        onChange={e => setValor(e.target.value)}
        className="border border-gray-400 p-1 rounded w-20 text-sm bg-black text-white"
        placeholder="R$"
      />
      <button
        className="hover:scale-105 cursor-pointer bg-red-700 hover:bg-red-800 text-white font-bold rounded px-4 py-1 text-base disabled:opacity-50"
        onClick={remover}
        disabled={loading}
        type="button"
      >-</button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </div>
  );
}

function CriarUsuario({ onSuccess }: { onSuccess: () => void }) {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function cadastrar() {
    setPopup(null);
    setLoading(true);
    if (!nome || !senha) {
      setPopup({ msg: "Preencha todos os campos", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin": "true" },
      body: JSON.stringify({ name: nome, password: senha }),
    });
    setLoading(false);
    if (res.ok) {
      setNome(""); setSenha("");
      setPopup({ msg: "Usuário criado!", type: "success" });
      onSuccess();
    } else {
      let data;
      try { data = await res.json(); } catch { data = {}; }
      setPopup({ msg: data?.error || "Erro ao cadastrar usuário", type: "error" });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto">
      <h2 className="text-4xl font-extrabold text-black md:text-yellow-600 mb-6 text-center font-dyna">CRIAR</h2>
      <div className="bg-neutral-900 rounded-2xl shadow-xl p-8 w-full">
        <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); cadastrar(); }}>
          <div className="relative">
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150"
              style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }}
              autoComplete="off"
              disabled={loading}
              required
            />
            <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Usuário</span>
          </div>
          <div className="relative">
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150"
              style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }}
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Senha</span>
          </div>
          <button
            type="submit"
            className="hover:cursor-pointer bg-yellow-600 text-black font-bold text-2xl px-10 py-1 rounded-full shadow-lg hover:bg-yellow-700 hover:border-yellow-700 transition-transform transform hover:scale-105 border-b-4 border-r-4 border-black md:text-3xl"
            disabled={loading}
          >
            {loading ? "CRIANDO..." : "CRIAR"}
          </button>
          <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
        </form>
      </div>
    </div>
  );
}

function FormProduto({ onSuccess }: { onSuccess: () => void }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState("");
  const [estoque, setEstoque] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function cadastrar() {
    setPopup(null);
    setLoading(true);
    const valor = parseFloat(preco.replace(",", "."));
    const estoqueInt = parseInt(estoque);
    if (!nome || !descricao || isNaN(valor) || valor <= 0 || !imagem || isNaN(estoqueInt) || estoqueInt < 0) {
      setPopup({ msg: "Preencha todos os campos corretamente", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nome, description: descricao, price: valor, imageUrl: imagem, estoque: estoqueInt }),
    });
    setLoading(false);
    if (res.ok) {
      setNome(""); setDescricao(""); setPreco(""); setImagem(""); setEstoque("");
      setPopup({ msg: "Produto cadastrado!", type: "success" });
      onSuccess();
    } else {
      setPopup({ msg: "Erro ao cadastrar produto", type: "error" });
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); cadastrar(); }}>
      <div className="relative">
        <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Nome do Produto</span>
      </div>
      <div className="relative">
        <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Descrição</span>
      </div>
      <div className="relative">
        <input type="number" min="0" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Preço</span>
      </div>
      <div className="relative">
        <input type="number" min="0" step="1" value={estoque} onChange={e => setEstoque(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>Estoque Inicial</span>
      </div>
      <div className="relative">
        <input type="text" value={imagem} onChange={e => setImagem(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin font-dyna" style={{lineHeight:1}}>URL da Imagem</span>
      </div>
      <button type="submit" className="hover:cursor-pointer bg-yellow-600 text-black font-bold text-2xl px-10 py-1 rounded-full shadow-lg hover:bg-yellow-700 hover:border-yellow-700 transition-transform transform hover:scale-105 border-b-4 border-r-4 border-black md:text-3xl" disabled={loading}>
        {loading ? "CADASTRANDO..." : "CADASTRAR"}
      </button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </form>
  );
}

function AddEstoque({ productId, onSuccess }: { productId: number; onSuccess: () => void }) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function adicionar() {
    setPopup(null);
    setLoading(true);
    const v = parseInt(valor);
    if (isNaN(v) || v < 0) {
      setPopup({ msg: "Valor inválido", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, amount: v }),
    });
    setLoading(false);
    if (res.ok) {
      setValor("");
      setPopup({ msg: "Estoque adicionado!", type: "success" });
      onSuccess();
    } else {
      const data = await res.json();
      setPopup({ msg: data.error || "Erro ao adicionar estoque", type: "error" });
    }
  }

  return (
    <div className="flex gap-2 items-center relative">
      <input
        type="number"
        min="0"
        step="1"
        value={valor}
        onChange={e => setValor(e.target.value)}
        className="border border-gray-400 p-1 rounded w-16 text-sm bg-black text-white"
        placeholder="Qtd"
        disabled={loading}
      />
      <button
        className="hover:scale-105 cursor-pointer bg-green-700 hover:bg-green-800 text-white font-bold rounded px-3 py-1 text-base disabled:opacity-50"
        onClick={adicionar}
        disabled={loading || !valor || parseInt(valor) < 0}
        type="button"
      >+</button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </div>
  );
}

function RemoverEstoque({ productId, estoqueAtual, onSuccess }: { productId: number; estoqueAtual: number; onSuccess: () => void }) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function remover() {
    setPopup(null);
    setLoading(true);
    const v = parseInt(valor);
    if (isNaN(v) || v < 0) {
      setPopup({ msg: "Valor inválido", type: "error" });
      setLoading(false);
      return;
    }
    if (v > estoqueAtual) {
      setPopup({ msg: "Não pode remover mais do que o estoque atual", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, amount: -v }),
    });
    setLoading(false);
    if (res.ok) {
      setValor("");
      setPopup({ msg: "Estoque removido!", type: "success" });
      onSuccess();
    } else {
      const data = await res.json();
      setPopup({ msg: data.error || "Erro ao remover estoque", type: "error" });
    }
  }

  return (
    <div className="flex gap-2 items-center relative">
      <input
        type="number"
        min="0"
        max={estoqueAtual}
        step="1"
        value={valor}
        onChange={e => setValor(e.target.value)}
        className="border border-gray-400 p-1 rounded w-16 text-sm bg-black text-white"
        placeholder="Qtd"
        disabled={loading}
      />
      <button
        className="hover:scale-105 cursor-pointer bg-red-700 hover:bg-red-800 text-white font-bold rounded px-3 py-1 text-base disabled:opacity-50"
        onClick={remover}
        disabled={loading || !valor || parseInt(valor) < 0 || parseInt(valor) > estoqueAtual}
        type="button"
      >-</button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </div>
  );
}

// Função utilitária para formatar data dd/mm/aa
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const ano = d.getFullYear().toString().slice(-2);
  return `${dia}/${mes}/${ano}`;
}
