import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck, Mail, Phone } from "lucide-react";
import { api } from "./api";
import type { User, Supplier } from "./types";
import { Modal, ErrorBox, Loading, Empty } from "./ui";
export default function Suppliers({ user }: { user: User }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const data = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api<Supplier[]>("suppliers"),
  });
  const mutation = useMutation({
    mutationFn: () =>
      api("suppliers", {
        method: "POST",
        body: JSON.stringify({ supplier: { name, email, phone } }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
    },
  });
  return (
    <div className="page">
      <div className="heading">
        <div>
          <span className="eyebrow">
            PARCERIAS QUE MANTÊM TUDO EM MOVIMENTO
          </span>
          <h1>Boas conexões. Estoque em dia.</h1>
          <p>As pessoas e empresas que abastecem sua operação.</p>
        </div>
        {user.role === "owner" && (
          <button
            className="button"
            onClick={() => {
              mutation.reset();
              setOpen(true);
            }}
          >
            <Plus size={17} />
            Novo fornecedor
          </button>
        )}
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
      ) : !data.data?.length ? (
        <Empty text="Cadastre o primeiro fornecedor da sua operação." />
      ) : (
        <div className="supplier-grid">
          {data.data.map((s) => (
            <article key={s.id} className="supplier-card">
              <span>
                <Truck size={26} />
              </span>
              <small>FORNECEDOR</small>
              <h2>{s.name}</h2>
              <p>
                <Mail size={14} />
                {s.email}
              </p>
              {s.phone && (
                <p>
                  <Phone size={14} />
                  {s.phone}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Novo fornecedor" close={() => setOpen(false)}>
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <label>
              Nome
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              E-mail
              <input
                required
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Telefone
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <ErrorBox error={mutation.error} />
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setOpen(false)}
              >
                Voltar
              </button>
              <button className="button" disabled={mutation.isPending}>
                Cadastrar fornecedor
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
