const key = "stockroom.session";
export const token = () => sessionStorage.getItem(key);
export const saveToken = (v: string | null) =>
  v ? sessionStorage.setItem(key, v) : sessionStorage.removeItem(key);
export async function request(path: string, init: RequestInit = {}) {
  const r = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...init.headers,
    },
  });
  if (!r.ok) {
    const b = await r
      .json()
      .catch(() => ({ errors: ["Servidor indisponível. Tente novamente."] }));
    if (r.status === 401 && token())
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(b.errors?.join(" · ") || "Não foi possível concluir.");
  }
  return r;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await request(path, init);
  return r.status === 204 ? (undefined as T) : r.json();
}
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
export function cents(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error("Use até duas casas decimais.");
  const [a, b = ""] = value.split(".");
  return Number(a) * 100 + Number(b.padEnd(2, "0"));
}
export async function download(path: string) {
  const r = await request(path);
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "stockroom-inventory.csv";
  a.click();
  URL.revokeObjectURL(url);
}
