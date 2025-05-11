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
      <div className="z-10 w-full max-w-6xl px-2 pt-10 pb-24">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-2 md:mb-0">
            Painel do <span className="text-yellow-200">Admin</span>
          </h1>
          <div className="flex gap-4 items-center">
            <button className={tab === "compras" ? "bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow" : "bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow"} onClick={() => setTab("compras")}>HISTÓRICO</button>
            <button className={tab === "usuarios" ? "bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow" : "bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow"} onClick={() => setTab("usuarios")}>USUÁRIOS</button>
            <button className={tab === "produtos" ? "bg-yellow-200 text-black font-bold px-4 py-1 rounded-xl text-lg shadow" : "bg-white text-black font-bold px-4 py-1 rounded-xl text-lg shadow"} onClick={() => setTab("produtos")}>PRODUTOS</button>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-1 rounded-xl text-lg shadow ml-4" onClick={() => { localStorage.removeItem("user"); router.push("/login"); }}>SAIR</button>
          </div>
        </div>
        {loading ? <div className="text-gray-100">Carregando...</div> : (
          <>
            {tab === "compras" && (
              <div className="w-full flex flex-col pt-4 md:pt-8">
                <h2 className="text-3xl font-extrabold text-yellow-100 mb-8 text-center w-full">HISTÓRICO DE COMPRAS</h2>
                <div className="bg-neutral-900 rounded-2xl shadow-xl px-8 py-8 w-full flex flex-col">
                  <div className="w-full mb-2">
                    <div className="grid grid-cols-6 text-center">
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">USUÁRIO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">PRODUTO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">PREÇO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">DATA</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">REEMBOLSAR</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">PAGO</div>
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
                                    <li key={p.id} className="grid grid-cols-6 items-center py-3 text-center">
                                      <div className="text-white text-lg font-bold flex items-center justify-center">{p.user.name}</div>
                                      <div className="text-white text-lg font-bold flex items-center justify-center">{p.product.name}</div>
                                      <div className="text-green-400 text-lg font-bold flex items-center justify-center">R$ {p.product.price}</div>
                                      <div className="text-white text-lg font-bold flex items-center justify-center">{formatDate(p.createdAt)}</div>
                                      <div className="flex justify-center">
                                        <button
                                          className="bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150"
                                          title="Excluir e reembolsar"
                                          onClick={async () => {
                                            if (confirm("Excluir este item do histórico e reembolsar o usuário?")) {
                                              await fetch("/api/purchases", {
                                                method: "DELETE",
                                                headers: { "Content-Type": "application/json", "x-admin": "true" },
                                                body: JSON.stringify({ purchaseId: p.id }),
                                              });
                                              refreshPurchases();
                                              refreshUsers(); // Atualiza também o saldo dos usuários
                                            }
                                          }}
                                        >
                                          <span role="img" aria-label="remover">🗑️</span>
                                        </button>
                                      </div>
                                      <div className="flex justify-center items-center">
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
              <div className="flex flex-col md:flex-row gap-8 w-full pt-4 md:pt-8">
                {/* Tabela de usuários */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-4xl font-extrabold text-yellow-100 mb-6">USUÁRIOS</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 w-full">
                    <div className="grid grid-cols-4 text-center mb-4 w-full">
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase text-left pl-4">NOME</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">SALDO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">ADICIONAR</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">REMOVER</div>
                    </div>
                    <div className="divide-y divide-gray-800 w-full">
                      {users.map(u => (
                        <div key={u.id} className="grid grid-cols-4 items-center py-3 w-full">
                          <div className="flex items-center gap-2 text-left pl-4">
                            <button
                              className={`bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150${u.name === "admin.plus" ? " opacity-50 cursor-not-allowed" : ""}`}
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
                {/* Formulário de criar usuário */}
                <CriarUsuario onSuccess={refreshUsers} />
              </div>
            )}
            {tab === "produtos" && (
              <div className="flex flex-col md:flex-row gap-8 w-full pt-4 md:pt-8">
                {/* Lista de produtos */}
                <div className="flex-1 flex flex-col">
                  <h2 className="text-4xl font-extrabold text-yellow-100 mb-6">PRODUTOS</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-6 w-full">
                    <div className="grid grid-cols-4 text-center mb-4 w-full">
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase text-left pl-4">IMAGEM</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">NOME</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">DESCRIÇÃO</div>
                      <div className="text-yellow-200 text-2xl font-extrabold uppercase">PREÇO</div>
                    </div>
                    <div className="divide-y divide-gray-800 w-full">
                      {products.length === 0 ? (
                        <div className="text-gray-300 text-center py-8">Nenhum produto cadastrado ainda.</div>
                      ) : (
                        products.map(p => (
                          <div key={p.id} className="grid grid-cols-4 items-center py-4 w-full text-center">
                            <div className="flex items-center gap-2 text-left pl-4">
                              <button
                                className="bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs font-semibold transition-colors duration-150 mr-2"
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
                                <Image src={p.imageUrl} alt={p.name} width={80} height={48} className="h-12 w-full object-cover opacity-80 mx-auto rounded-xl" style={{objectFit: 'cover'}} />
                              </div>
                            </div>
                            <div className="text-white text-lg font-bold break-words min-w-[100px]">{p.name}</div>
                            <div className="text-white text-base break-words max-w-xs mx-auto">{p.description}</div>
                            <div className="text-green-400 text-lg font-bold min-w-[70px]">R$ {p.price}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Formulário de cadastrar produto */}
                <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto">
                  <h2 className="text-4xl font-extrabold text-yellow-100 mb-6 text-center">CADASTRAR</h2>
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-8 w-full">
                    <FormProduto onSuccess={refreshProducts} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="z-10 w-full text-center text-gray-200 text-base opacity-90 py-6 bg-black border-t border-neutral-800 mt-auto">
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
        className="bg-green-700 hover:bg-green-800 text-white font-bold rounded px-4 py-1 text-base disabled:opacity-50"
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
        className="bg-red-700 hover:bg-red-800 text-white font-bold rounded px-4 py-1 text-base disabled:opacity-50"
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
      <h2 className="text-4xl font-extrabold text-yellow-100 mb-6 text-center">CRIAR</h2>
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
            <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>Usuário</span>
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
            <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>Senha</span>
          </div>
          <button
            type="submit"
            className="bg-yellow-200 hover:bg-yellow-300 text-black font-bold rounded-xl px-4 py-3 text-lg shadow disabled:opacity-60 transition mt-2"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar Usuário"}
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
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  async function cadastrar() {
    setPopup(null);
    setLoading(true);
    const valor = parseFloat(preco.replace(",", "."));
    if (!nome || !descricao || isNaN(valor) || valor <= 0 || !imagem) {
      setPopup({ msg: "Preencha todos os campos corretamente", type: "error" });
      setLoading(false);
      return;
    }
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nome, description: descricao, price: valor, imageUrl: imagem }),
    });
    setLoading(false);
    if (res.ok) {
      setNome(""); setDescricao(""); setPreco(""); setImagem("");
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
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>Nome do Produto</span>
      </div>
      <div className="relative">
        <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>Descrição</span>
      </div>
      <div className="relative">
        <input type="number" min="0" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>Preço</span>
      </div>
      <div className="relative">
        <input type="text" value={imagem} onChange={e => setImagem(e.target.value)} className="peer w-full rounded-2xl px-4 bg-black text-white border-4 border-white focus:border-yellow-200 outline-none text-base font-semibold transition-all duration-150" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '44px' }} autoComplete="off" disabled={loading} required />
        <span className="absolute -top-2 left-3 font-bold text-base tracking-wide bg-neutral-900 px-1 z-10 label-admin" style={{lineHeight:1}}>URL da Imagem</span>
      </div>
      <button type="submit" className="bg-yellow-200 hover:bg-yellow-300 text-black font-bold rounded-xl px-4 py-3 text-lg shadow disabled:opacity-60 transition mt-2" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar Produto"}
      </button>
      <Popup message={popup?.msg || ""} type={popup?.type || "error"} onClose={() => setPopup(null)} />
    </form>
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
