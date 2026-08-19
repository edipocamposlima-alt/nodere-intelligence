import { expect, test, type Page } from "@playwright/test";

const email = process.env.NODERE_E2E_EMAIL;
const password = process.env.NODERE_E2E_PASSWORD;

const navigationCases = [
  ["NODERE AI", "/ai"],
  ["Dashboard", "/dashboard"],
  ["Prospecção e pesquisa", "/searches"],
  ["Funil comercial", "/crm"],
  ["Empresas e clientes", "/companies"],
  ["Comunicações", "/crm/communications"],
  ["Agenda", "/calendario"],
  ["Briefings", "/crm/briefings"],
  ["Propostas e contratos", "/app/proposals"],
  ["Produtos e serviços", "/catalog"],
  ["Relatórios", "/reports"],
  ["Usuários e permissões", "/operators"],
  ["Configurações", "/settings"],
  ["Integrações", "/integrations"],
  ["Administração técnica", "/admin"],
  ["Plano e faturamento", "/billing"],
  ["Manual NODERE", "/manual"]
] as const;

async function login(page: Page) {
  test.skip(!email || !password, "Configure as credenciais da conta dedicada de homologação.");
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/senha|password/i).fill(password!);
  await page.getByRole("button", { name: /entrar|login|acessar/i }).click();
  await expect(page).toHaveURL(/\/ai(?:\?|$)/);
}

test.describe("ChatGPT Sites — navegação autenticada de produção", () => {
  test("todos os módulos abrem por clique, URL direta e reload", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await login(page);

    for (const [label, path] of navigationCases) {
      await page.goto("/ai");
      await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
      await page.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[/?#]|$)`));
      await expect(page.locator("main").first()).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[/?#]|$)`));
      await expect(page.locator("main").first()).toBeVisible();
    }

    expect(runtimeErrors.filter((message) => /next\/link|RSC prefetch|TypeError: .* is not a function/i.test(message))).toEqual([]);
  });

  test("histórico back/forward preserva a sessão", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
    await page.getByRole("link", { name: "Funil comercial", exact: true }).click();
    await expect(page).toHaveURL(/\/crm(?:[/?#]|$)/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
    await page.goForward();
    await expect(page).toHaveURL(/\/crm(?:[/?#]|$)/);
  });

  test("menu mobile navega por toque real", async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    await page.getByRole("link", { name: "Comunicações", exact: true }).click();
    await expect(page).toHaveURL(/\/crm\/communications(?:[/?#]|$)/);
  });
});

