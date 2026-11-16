import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "./api";
import type { User, Movement } from "./types";
import { Loading, ErrorBox, Empty } from "./ui";
export default function Activity({ user }: { user: User }) {
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const data = useQuery({
    queryKey: ["movements", kind, page],
    queryFn: () =>
      api<{ movements: Movement[]; total: number }>(
        `movements?kind=${kind}&page=${page}`,
      ),
  });
  return (
    <div className="page">
      <div className="heading">
        <div>
          <span className="eyebrow">CADA MOVIMENTO TEM UMA HISTÓRIA</span>
          <h1>De onde veio. Para onde foi.</h1>
          <p>Entradas e saídas registradas, com contexto e responsabilidade.</p>
        </div>
      </div>
      <section className="panel activity-panel">
        <div className="section-heading">
          <h2>
            Movimentações<span className="count">{data.data?.total || 0}</span>
          </h2>
          <select
            aria-label="Filtrar tipo"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os movimentos</option>
            <option value="in">Entradas</option>
            <option value="out">Saídas</option>
          </select>
        </div>
        <ErrorBox error={data.error} />
        {data.isPending ? (
          <Loading />
        ) : data.isError ? (
          <button
            className="button secondary"
            onClick={() => void data.refetch()}
          >
            Tentar novamente
          </button>
        ) : (
          <MovementRows rows={data.data?.movements || []} user={user} />
        )}
        <div className="pagination">
          <span>
            {data.data?.total || 0} movimentos · página {page}
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
              disabled={page * 20 >= (data.data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
export function MovementRows({
  rows,
  user,
  compact = false,
}: {
  rows: Movement[];
  user: User;
  compact?: boolean;
}) {
  return !rows.length ? (
    <Empty text="As entradas e saídas deste estoque vão aparecer aqui." />
  ) : (
    <div className={`movement-list ${compact ? "compact" : ""}`}>
      {rows.map((m) => (
        <article className="movement-row" key={m.id}>
          <span
            className={`flow-icon ${m.kind === "in" ? "incoming" : "outgoing"}`}
          >
            {m.kind === "in" ? (
              <ArrowDownLeft size={18} />
            ) : (
              <ArrowUpRight size={18} />
            )}
          </span>
          <div className="movement-text">
            <strong>{compact ? m.reference : m.product_name}</strong>
            <p>
              {compact ? m.actor_name : `${m.product_sku} · ${m.reference}`}
            </p>
            <small>
              {DateTime.fromISO(m.created_at)
                .setZone(user.time_zone)
                .toFormat("dd/MM/yyyy HH:mm")}{" "}
              {!compact && `· ${m.actor_name}`}
            </small>
          </div>
          <div className={`movement-amount ${m.kind}`}>
            <strong>
              {m.kind === "in" ? "+" : "−"} {m.quantity}
            </strong>
            <small>saldo após: {m.balance_after}</small>
          </div>
        </article>
      ))}
    </div>
  );
}
