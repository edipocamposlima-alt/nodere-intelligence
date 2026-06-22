import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import {
  getRequestWorkspaceId,
  requireWorkspaceMutation,
  requireWorkspaceRole
} from "../middleware/session.js";
import { issueSessionToken, verifySessionToken, type SessionRole } from "../services/adminSession.js";
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";

type MockResponse = Response & { statusCode: number; payload?: unknown };

function request(role?: SessionRole, method = "POST", email = `${role || "anonymous"}@nodere.test`) {
  return {
    method,
    session: role ? { email, role, workspaceId: "workspace-test", userId: `user-${role}` } : undefined
  } as unknown as Request;
}

function response() {
  const res = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    }
  } as MockResponse;
  return res;
}

function run(middleware: (req: Request, res: Response, next: NextFunction) => unknown, req: Request) {
  const res = response();
  let nextCalled = false;
  middleware(req, res, (() => { nextCalled = true; }) as NextFunction);
  return { res, nextCalled };
}

test("rotas protegidas retornam 401 sem sessao", () => {
  const result = run(requireWorkspaceRole("owner", "admin"), request());
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("viewer pode ler, mas recebe 403 em mutacoes", () => {
  const guard = requireWorkspaceMutation("owner", "admin", "operator");
  assert.equal(run(guard, request("viewer", "GET")).nextCalled, true);
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const mutation = run(guard, request("viewer", method));
    assert.equal(mutation.res.statusCode, 403, `${method} deveria retornar 403`);
    assert.equal(mutation.nextCalled, false);
  }
});

for (const role of ["owner", "admin", "operator"] as const) {
  test(`${role} pode executar mutacao operacional`, () => {
    const result = run(requireWorkspaceMutation("owner", "admin", "operator"), request(role));
    assert.equal(result.nextCalled, true);
    assert.equal(result.res.statusCode, 200);
  });
}

test("operador nao administra operadores", () => {
  const result = run(requireWorkspaceMutation("owner", "admin"), request("operator"));
  assert.equal(result.res.statusCode, 403);
});

test("administrador geral e elevado a owner", () => {
  const req = request("viewer", "POST", "edipo.lima@nodere.com.br");
  const result = run(requireWorkspaceRole("owner"), req);
  assert.equal(result.nextCalled, true);
  assert.equal((req as any).session.role, "owner");
});

test("workspace vem exclusivamente da sessao", () => {
  const req = request("admin", "GET") as Request & { headers: Record<string, string> };
  req.headers = { "x-workspace-id": "workspace-injetado" };
  assert.equal(getRequestWorkspaceId(req), "workspace-test");
});

test("token de sessao assinado preserva perfil e workspace", () => {
  const token = issueSessionToken({
    email: "admin@nodere.test",
    role: "admin",
    workspaceId: "workspace-test",
    userId: "user-admin"
  });
  const session = verifySessionToken(token);
  assert.equal(session?.role, "admin");
  assert.equal(session?.workspaceId, "workspace-test");
  assert.equal(verifySessionToken(`${token}corrompido`), null);
});

test("routers criticos possuem guardas e montagem protegida", () => {
  const routeRoot = join(process.cwd(), "src", "routes");
  for (const route of ["companies", "crm", "marketing", "inbox", "sequences", "credits", "ai", "operators", "proposals"]) {
    const source = readFileSync(join(routeRoot, `${route}.ts`), "utf8");
    assert.match(source, /requireWorkspaceMutation/, `${route} sem guarda de mutacao`);
  }
  const server = readFileSync(join(process.cwd(), "src", "server.ts"), "utf8");
  assert.match(server, /\/api\/audit", requireWorkspaceRole\("owner", "admin"\), auditRouter/);
  assert.match(server, /\/api\/companies", requireWorkspaceSession, companiesRouter/);
  assert.match(server, /app\.get\("\/api\/settings", requireWorkspaceSession/);
  assert.match(server, /app\.get\("\/api\/communications", requireWorkspaceSession/);
  assert.match(server, /app\.get\("\/api\/contracts", requireWorkspaceSession/);
  assert.match(server, /app\.get\("\/api\/files", requireWorkspaceSession/);
});

test("erros de schema ausente sao classificados sem mascarar erros comuns", () => {
  assert.equal(isMissingSupabaseSchema({ code: "PGRST205" }), true);
  assert.equal(isMissingSupabaseSchema({ code: "42703", message: "column does not exist" }), true);
  assert.equal(isMissingSupabaseSchema(new Error("timeout de rede")), false);
});
