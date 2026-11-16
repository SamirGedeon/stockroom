import { test, expect } from "@playwright/test";
async function login(
  page: import("@playwright/test").Page,
  email = "owner@stockroom.test",
) {
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Stockroom-demo-2026!");
  await page.getByRole("button", { name: "Entrar no meu espaço" }).click();
  await expect(
    page.getByRole("heading", { name: "Cada item, no seu lugar." }),
  ).toBeVisible();
}
test("owner creates supplier/product and stock movements never become negative", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  const stamp = Date.now();
  const supplier = `Fornecedor ${stamp}`;
  const product = `Produto ${stamp}`;
  await page.getByRole("link", { name: "Fornecedores", exact: true }).click();
  await page.getByRole("button", { name: "Novo fornecedor" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(supplier);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("supplier@example.test");
  await page.getByRole("button", { name: "Cadastrar fornecedor" }).click();
  await expect(
    page.getByRole("heading", { name: supplier, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Estoque/ }).click();
  await page.getByRole("button", { name: "Novo produto" }).click();
  await page.getByLabel("Nome do produto").fill(product);
  await page.getByLabel("SKU", { exact: true }).fill(`SKU-${stamp}`);
  await page.getByLabel("Estoque mínimo").fill("5");
  await page.getByLabel("Custo unitário (R$)").fill("12.50");
  await page
    .getByLabel("Fornecedor", { exact: true })
    .selectOption({ label: supplier });
  await page.getByRole("button", { name: "Cadastrar produto" }).click();
  await page.getByLabel("Buscar produtos").fill(product);
  const row = page.locator(".product-row").filter({ hasText: product });
  await expect(row).toContainText("Sem estoque");
  await page
    .getByRole("button", { name: `Movimentar ${product}`, exact: true })
    .click();
  await page.getByLabel("Quantidade", { exact: true }).fill("10");
  await page
    .getByLabel("Referência", { exact: true })
    .fill(`Recebimento ${stamp}`);
  await page.getByRole("button", { name: "Confirmar movimentação" }).click();
  await expect(row.locator(".stock-value strong")).toHaveText("10");
  await expect(row).toContainText("Saudável");
  await page
    .getByRole("button", { name: `Movimentar ${product}`, exact: true })
    .click();
  await page.getByLabel("Tipo", { exact: true }).selectOption("out");
  await page.getByLabel("Quantidade", { exact: true }).fill("11");
  await page
    .getByLabel("Referência", { exact: true })
    .fill("Saída acima do disponível");
  await page.getByRole("button", { name: "Confirmar movimentação" }).click();
  await expect(page.getByRole("alert")).toContainText("Insufficient stock");
  await page.getByLabel("Quantidade", { exact: true }).fill("7");
  await page
    .getByLabel("Referência", { exact: true })
    .fill(`Expedição ${stamp}`);
  await page.getByRole("button", { name: "Confirmar movimentação" }).click();
  await expect(row.locator(".stock-value strong")).toHaveText("3");
  await expect(row).toContainText("Repor");
  await page.getByRole("button", { name: product, exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(`Recebimento ${stamp}`);
  await expect(page.getByRole("dialog")).toContainText(`Expedição ${stamp}`);
  await page.keyboard.press("Escape");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("stockroom-inventory.csv");
  let text = "";
  for await (const part of (await file.createReadStream())!)
    text += part.toString();
  expect(text).toContain(product);
  expect(text).toContain("12.50");
  expect(errors).toEqual([]);
});
test("operators can move stock but cannot create catalog entries", async ({
  page,
}) => {
  await login(page, "operator@stockroom.test");
  await expect(page.getByRole("button", { name: "Novo produto" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /^Movimentar / }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Fornecedores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Novo fornecedor" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Movimentações", exact: true }).click();
  await expect(page.locator(".movement-row").first()).toBeVisible();
});
test("viewer has read-only access and mobile inventory fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "viewer@stockroom.test");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("button", { name: "Novo produto" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /^Movimentar / })).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: /^Reposição/ }).click();
  await expect(
    page.getByRole("heading", { name: "Um olhar para o que falta." }),
  ).toBeVisible();
  await page.locator(".subject-link").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar no meu espaço" }),
  ).toBeVisible();
});
