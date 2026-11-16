import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  NavLink,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import {
  Boxes,
  TriangleAlert,
  ArrowLeftRight,
  Truck,
  LogOut,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  PackageCheck,
} from "lucide-react";
import { api, token, saveToken } from "./api";
import type { User, Summary } from "./types";
import { Logo, ErrorBox, Loading } from "./ui";
import Inventory from "./Inventory";
import Activity from "./Activity";
import Suppliers from "./Suppliers";
const roles = {
  owner: "Administrador",
  operator: "Operador",
  viewer: "Somente leitura",
};
export default function App() {
  const client = useQueryClient();
  const location = useLocation();
  const [session, setSession] = useState(token);
  const me = useQuery({
    queryKey: ["session", session],
    queryFn: () => api<{ user: User }>("session"),
    enabled: !!session,
    retry: false,
  });
  const stats = useQuery({
    queryKey: ["summary"],
    queryFn: () => api<Summary>("summary"),
    enabled: !!me.data,
  });
  const clear = () => {
    saveToken(null);
    setSession(null);
    client.clear();
  };
  useEffect(() => {
    const expired = () => {
      saveToken(null);
      setSession(null);
      client.clear();
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [client]);
  const logout = useMutation({
    mutationFn: () => api("session", { method: "DELETE" }),
    onSuccess: clear,
  });
  if (!session)
    return (
      <Login
        done={(v) => {
          saveToken(v);
          setSession(v);
        }}
      />
    );
  if (me.isPending) return <Loading />;
  if (!me.data)
    return (
      <main className="fallback">
        <ErrorBox error={me.error} />
        <button className="button" onClick={() => void me.refetch()}>
          Tentar novamente
        </button>
        <button className="button secondary" onClick={clear}>
          Voltar ao login
        </button>
      </main>
    );
  const user = me.data.user;
  return (
    <div className="layout">
      <aside className="sidebar">
        <Logo />
        <div className="workspace">
          <span>AS</span>
          <div>
            <strong>{user.account_name}</strong>
            <small>Seu espaço de operação</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-caption">OPERAÇÃO</span>
        <nav aria-label="Navegação principal">
          <NavLink to="/inventory/all">
            <Boxes size={18} />
            Estoque<span>{stats.data?.products ?? "—"}</span>
          </NavLink>
          <NavLink to="/inventory/low">
            <TriangleAlert size={18} />
            Reposição<span>{stats.data?.low_stock ?? "—"}</span>
          </NavLink>
          <NavLink to="/activity">
            <ArrowLeftRight size={18} />
            Movimentações
          </NavLink>
          <NavLink to="/suppliers">
            <Truck size={18} />
            Fornecedores
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <PackageCheck size={24} />
            <h3>
              Organização que
              <br />
              mantém tudo em movimento.
            </h3>
            <p>Um estoque claro abre espaço para boas decisões.</p>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{roles[user.role]}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Sair"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut size={18} />
            </button>
          </div>
          <ErrorBox error={logout.error} />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace<i>/</i>
            <strong>{user.account_name}</strong>
          </span>
          <span>
            <ShieldCheck size={14} />
            Cada item no seu lugar. Cada movimento registrado.
          </span>
        </header>
        <Routes>
          <Route
            path="/inventory/:view"
            element={<Inventory key={location.pathname} user={user} />}
          />
          <Route path="/activity" element={<Activity user={user} />} />
          <Route path="/suppliers" element={<Suppliers user={user} />} />
          <Route path="*" element={<Navigate to="/inventory/all" replace />} />
        </Routes>
        <footer>
          <span>Menos imprevistos. Mais controle.</span>
          <span>stockroom · pronto para o próximo movimento</span>
        </footer>
      </main>
    </div>
  );
}
function Login({ done }: { done: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api<{ token: string }>("session", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (r) => done(r.token),
  });
  return (
    <div className="login">
      <section className="login-story">
        <Logo />
        <div>
          <span className="eyebrow">ORGANIZAÇÃO QUE MOVE SEU NEGÓCIO</span>
          <h1>
            Seu estoque.
            <br />
            No lugar certo.
            <br />
            <em>No momento certo.</em>
          </h1>
          <p>
            Saiba o que tem, acompanhe o que se move e antecipe o que precisa
            chegar.
          </p>
          <div className="story-checks">
            <span>
              <PackageCheck size={17} />
              Saldos confiáveis
            </span>
            <span>
              <PackageCheck size={17} />
              Movimentos com história
            </span>
          </div>
        </div>
        <small>Cada item conta uma parte da sua operação.</small>
      </section>
      <main>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <span className="eyebrow">BEM-VINDO AO STOCKROOM</span>
          <h2>
            Um novo olhar
            <br />
            para sua operação.
          </h2>
          <p>Entre para acompanhar seu estoque.</p>
          <label>
            E-mail
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
          <label>
            Senha
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </label>
          <ErrorBox error={mutation.error} />
          <button className="button" disabled={mutation.isPending}>
            {mutation.isPending ? "Entrando…" : "Entrar no meu espaço"}
            <ArrowRight size={17} />
          </button>
          {import.meta.env.DEV && (
            <div className="demo">
              <strong>Conheça a demonstração</strong>
              <p>Itens fictícios, prontos para explorar.</p>
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@stockroom.test");
                  setPassword("Stockroom-demo-2026!");
                }}
              >
                Preencher acesso de demonstração
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          <small className="login-security">
            <ShieldCheck size={13} />
            Sessão segura · 12 horas
          </small>
        </form>
      </main>
    </div>
  );
}
