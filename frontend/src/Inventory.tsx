import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  Boxes,
  TriangleAlert,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { api, money, download, cents } from "./api";
import type { User, Product, Supplier, Summary, Movement } from "./types";
import { Modal, ErrorBox, Loading, Empty } from "./ui";
import { MovementRows } from "./Activity";
export default function Inventory({ user }: { user: User }) {
  const { view = "all" } = useParams();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [stock, setStock] = useState(view === "low" ? "low" : "all");
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const filters = new URLSearchParams({
    q,
    stock,
    ...(supplier ? { supplier_id: supplier } : {}),
  });
  const products = useQuery({
    queryKey: ["products", q, stock, supplier, page],
    queryFn: () =>
      api<{ products: Product[]; total: number }>(
        `products?${filters}&page=${page}`,
      ),
  });
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: () => api<Summary>("summary"),
  });
  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api<Supplier[]>("suppliers"),
  });
  const exporter = useMutation({
    mutationFn: () => download(`export?${filters}`),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["products"] });
    void client.invalidateQueries({ queryKey: ["summary"] });
    void client.invalidateQueries({ queryKey: ["movements"] });
    void client.invalidateQueries({ queryKey: ["product"] });
  };
  return (
    <div className="page">
      <div className="heading">
        <div>
          <span className="eyebrow">
            UMA OPERAÇÃO BEM ORGANIZADA COMEÇA AQUI
          </span>
          <h1>
            {view === "low"
              ? "Um olhar para o que falta."
              : "Cada item, no seu lugar."}
          </h1>
          <p>
            {view === "low"
              ? "Antecipe a reposição e mantenha sua operação em movimento."
              : "Uma visão clara do que você tem e do que precisa chegar."}
          </p>
        </div>
        {user.role === "owner" && (
          <button className="button" onClick={() => setCreate(true)}>
            <Plus size={17} />
            Novo produto
          </button>
        )}
      </div>
      <section className="stats" aria-label="Resumo do estoque">
        <Stat
          label="Produtos cadastrados"
          value={String(summary.data?.products ?? "—")}
          icon={<Boxes size={19} />}
          detail="Itens no seu catálogo"
        />
        <Stat
          label="Unidades em estoque"
          value={String(summary.data?.units ?? "—")}
          icon={<Package size={19} />}
          detail="Saldo disponível para movimentar"
        />
        <Stat
          label="Precisam de reposição"
          value={String(summary.data?.low_stock ?? "—")}
          icon={<TriangleAlert size={19} />}
          detail="Saldo no limite mínimo ou abaixo"
        />
        <Stat
          label="Valor em estoque"
          value={summary.data ? money(summary.data.inventory_value_cents) : "—"}
          icon={<Wallet size={19} />}
          detail="Saldo × custo unitário cadastrado"
        />
      </section>
      <div className="inventory-layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>
                {view === "low" ? "Itens para repor" : "Seu estoque"}
                <span className="count">{products.data?.total || 0}</span>
              </h2>
              <p>Os detalhes certos para planejar o próximo movimento.</p>
            </div>
            <button
              className="text-button"
              disabled={exporter.isPending}
              onClick={() => exporter.mutate()}
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
          <div className="filter-bar">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Buscar produtos"
                placeholder="Buscar por nome ou SKU…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <select
              aria-label="Filtrar saldo"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Todos os saldos</option>
              <option value="low">Reposição</option>
              <option value="empty">Sem estoque</option>
              <option value="healthy">Saldo saudável</option>
            </select>
            <select
              aria-label="Filtrar fornecedor"
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos os fornecedores</option>
              {suppliers.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ErrorBox
            error={
              products.error ||
              summary.error ||
              suppliers.error ||
              exporter.error
            }
          />
          {products.isPending ? (
            <Loading />
          ) : products.isError ? (
            <div className="retry">
              <button
                className="button secondary"
                onClick={() => void products.refetch()}
              >
                Tentar novamente
              </button>
            </div>
          ) : !products.data?.products.length ? (
            <Empty text="Ajuste os filtros ou cadastre o primeiro produto." />
          ) : (
            <div>
              <div className="table-head product-grid">
                <span>PRODUTO</span>
                <span>LOCAL</span>
                <span>SALDO</span>
                <span>SITUAÇÃO</span>
                <span>CUSTO UNIT.</span>
                <span />
              </div>
              {products.data.products.map((p, i) => (
                <article key={p.id} className="product-row product-grid">
                  <div className="product-name">
                    <span className={`product-icon color-${i % 3}`}>
                      <Package size={19} />
                    </span>
                    <div>
                      <button
                        onClick={() => setDetail(p.id)}
                        className="subject-link"
                      >
                        {p.name}
                      </button>
                      <small>
                        {p.sku}
                        <span>·</span>
                        {p.supplier_name || "Sem fornecedor"}
                      </small>
                    </div>
                  </div>
                  <span className="location">{p.location || "—"}</span>
                  <div className="stock-value">
                    <strong>{p.on_hand}</strong>
                    <small>mín. {p.reorder_point}</small>
                  </div>
                  <span
                    className={`stock-status ${p.on_hand === 0 ? "empty-stock" : p.low_stock ? "low-stock" : "healthy"}`}
                  >
                    <i />
                    {p.on_hand === 0
                      ? "Sem estoque"
                      : p.low_stock
                        ? "Repor"
                        : "Saudável"}
                  </span>
                  <span className="cost">{money(p.unit_cost_cents)}</span>
                  {user.role !== "viewer" ? (
                    <button
                      className="icon-button"
                      aria-label={`Movimentar ${p.name}`}
                      onClick={() => setSelected(p)}
                    >
                      <ArrowLeftRight size={17} />
                    </button>
                  ) : (
                    <span />
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="pagination">
            <span>
              {products.data?.total || 0} produtos · página {page}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Página anterior"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Próxima página"
                disabled={page * 20 >= (products.data?.total || 0)}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
        <aside className="insights">
          <div className="insight-card">
            <span className="eyebrow">ÚLTIMOS 30 DIAS</span>
            <h3>O estoque em movimento.</h3>
            <div>
              <span className="flow-icon incoming">
                <ArrowDownLeft size={19} />
              </span>
              <div>
                <small>Entradas</small>
                <strong>
                  {summary.data?.incoming_30d ?? "—"} <span>unidades</span>
                </strong>
              </div>
            </div>
            <div>
              <span className="flow-icon outgoing">
                <ArrowUpRight size={19} />
              </span>
              <div>
                <small>Saídas</small>
                <strong>
                  {summary.data?.outgoing_30d ?? "—"} <span>unidades</span>
                </strong>
              </div>
            </div>
            <p>Cada entrada e saída tem um responsável e uma referência.</p>
          </div>
          <div className="restock-note">
            <TriangleAlert size={23} />
            <h3>Um passo à frente.</h3>
            <p>
              {summary.data?.empty ?? 0}{" "}
              {summary.data?.empty === 1 ? "item está" : "itens estão"} sem
              estoque. Consulte a fila de reposição para planejar as próximas
              entradas.
            </p>
          </div>
        </aside>
      </div>
      {create && (
        <ProductForm
          suppliers={suppliers.data || []}
          close={() => setCreate(false)}
          saved={() => {
            refresh();
            setCreate(false);
          }}
        />
      )}
      {selected && (
        <MovementForm
          product={selected}
          close={() => setSelected(null)}
          saved={() => {
            refresh();
            setSelected(null);
          }}
        />
      )}
      {detail !== null && (
        <ProductDetail id={detail} close={() => setDetail(null)} user={user} />
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
}) {
  return (
    <div className="stat">
      <div>
        {label}
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
function ProductForm({
  suppliers,
  close,
  saved,
}: {
  suppliers: Supplier[];
  close: () => void;
  saved: () => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [location, setLocation] = useState("");
  const [min, setMin] = useState("5");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api("products", {
        method: "POST",
        body: JSON.stringify({
          product: {
            name,
            sku,
            location,
            reorder_point: Number(min),
            unit_cost_cents: cents(cost),
            supplier_id: supplier || null,
          },
        }),
      }),
    onSuccess: saved,
  });
  return (
    <Modal title="Novo produto" close={close}>
      <form
        className="stack-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          Nome do produto
          <input
            autoFocus
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            SKU
            <input
              required
              maxLength={40}
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]*"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="PAP-001"
            />
          </label>
          <label>
            Localização
            <input
              maxLength={60}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex.: A-01"
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Estoque mínimo
            <input
              required
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </label>
          <label>
            Custo unitário (R$)
            <input
              required
              type="number"
              min="0"
              max="10000"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </label>
        </div>
        <label>
          Fornecedor
          <select
            aria-label="Fornecedor"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            <option value="">Sem fornecedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          Todo produto começa com saldo zero. Registre uma entrada para
          adicionar unidades ao estoque.
        </p>
        <ErrorBox error={mutation.error} />
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            Voltar
          </button>
          <button className="button" disabled={mutation.isPending}>
            Cadastrar produto
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function MovementForm({
  product,
  close,
  saved,
}: {
  product: Product;
  close: () => void;
  saved: () => void;
}) {
  const [kind, setKind] = useState("in");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const fresh = () => setKey(crypto.randomUUID());
  const mutation = useMutation({
    mutationFn: () =>
      api(`products/${product.id}/movements`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({
          movement: { kind, quantity: Number(quantity), reference },
        }),
      }),
    onSuccess: saved,
  });
  return (
    <Modal title="Registrar movimentação" close={close}>
      <div className="movement-product">
        <span>
          <Package size={24} />
        </span>
        <div>
          <strong>{product.name}</strong>
          <small>
            {product.sku} · saldo consultado: {product.on_hand} unidades
          </small>
        </div>
      </div>
      <form
        className="stack-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="form-grid">
          <label>
            Tipo
            <select
              aria-label="Tipo"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                fresh();
              }}
            >
              <option value="in">Entrada</option>
              <option value="out">Saída</option>
            </select>
          </label>
          <label>
            Quantidade
            <input
              autoFocus
              required
              type="number"
              min="1"
              max="1000000"
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                fresh();
              }}
            />
          </label>
        </div>
        <label>
          Referência
          <input
            required
            maxLength={160}
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              fresh();
            }}
            placeholder="Ex.: recebimento NF 1024"
          />
        </label>
        <p className="hint">
          O saldo é validado ao salvar. Saídas maiores que o estoque disponível
          são recusadas.
        </p>
        <ErrorBox error={mutation.error} />
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>
            Voltar
          </button>
          <button className="button" disabled={mutation.isPending}>
            {mutation.isPending ? "Registrando…" : "Confirmar movimentação"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ProductDetail({
  id,
  close,
  user,
}: {
  id: number;
  close: () => void;
  user: User;
}) {
  const detail = useQuery({
    queryKey: ["product", id],
    queryFn: () =>
      api<{ product: Product; movements: Movement[] }>(`products/${id}`),
  });
  return (
    <Modal title="Histórico do produto" close={close}>
      <ErrorBox error={detail.error} />
      {detail.isPending ? (
        <Loading />
      ) : detail.data ? (
        <>
          <div className="detail-product">
            <span className="eyebrow">{detail.data.product.sku}</span>
            <h3>{detail.data.product.name}</h3>
            <p>
              {detail.data.product.on_hand} unidades em estoque · mínimo{" "}
              {detail.data.product.reorder_point}
            </p>
          </div>
          <MovementRows rows={detail.data.movements} user={user} compact />
          <p className="hint">Até 50 movimentações mais recentes.</p>
        </>
      ) : (
        <button
          className="button secondary"
          onClick={() => void detail.refetch()}
        >
          Tentar novamente
        </button>
      )}
    </Modal>
  );
}
