import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Package, AlertCircle, LoaderCircle, X } from "lucide-react";
export function Logo() {
  return (
    <span className="logo">
      <span>
        <Package size={23} />
      </span>
      stockroom<span className="logo-dot">.</span>
    </span>
  );
}
export function ErrorBox({ error }: { error: Error | null }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={17} />
      {error.message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      Carregando seu estoque…
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Package size={31} />
      <h3>Nenhum item por aqui</h3>
      <p>{text}</p>
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
