import { expect, test } from "@playwright/test";

const email = process.env.NODERE_E2E_EMAIL;
const password = process.env.NODERE_E2E_PASSWORD;

async function login(page: import("@playwright/test").Page) {
  test.skip(!email || !password, "Configure NODERE_E2E_EMAIL e NODERE_E2E_PASSWORD para smoke autenticado.");

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/senha|password/i).fill(password!);
  await page.getByRole("button", { name: /entrar|login|acessar/i }).click();
  await expect(page).toHaveURL(/dashboard|app/);
}

test.describe("NODERE smoke minimo", () => {
  test("rota privada sem sessao redireciona para login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("sessao invalida não mantém conteúdo privado visível", async ({ page }) => {
    await page.goto("/login");
    await page.context().addCookies([{ name: "nodere_session", value: "sessao-invalida", url: page.url(), httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/crm");
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText("Pipeline, contatos e oportunidades")).toHaveCount(0);
  });

  test("login, dashboard, CRM, catalogo, propostas e logout", async ({ page }) => {
    await login(page);

    await page.goto("/app/dashboard");
    await expect(page.getByText(/Dashboard|NODERE|CRM/i).first()).toBeVisible();

    await page.goto("/crm");
    await expect(page.getByText(/funil|pipeline|crm/i).first()).toBeVisible();

    await page.goto("/catalog");
    await expect(page.getByText(/catalogo|catálogo|produtos|servicos|serviços/i).first()).toBeVisible();

    await page.goto("/proposals");
    await expect(page.getByText(/propostas|contratos|snapshot|pdf/i).first()).toBeVisible();

    const pdfAction = page.getByRole("button", { name: /pdf/i }).or(page.getByRole("link", { name: /pdf/i }));
    if (await pdfAction.first().isVisible().catch(() => false)) {
      await expect(pdfAction.first()).toBeEnabled();
    }

    const logout = page.getByRole("button", { name: /sair|logout/i }).or(page.getByRole("link", { name: /sair|logout/i }));
    if (await logout.first().isVisible().catch(() => false)) {
      await logout.first().click();
      await expect(page).toHaveURL(/login|\/$/);
    }
  });
});
