"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Copy, KeyRound, LogOut, ShieldCheck, SlidersHorizontal, Trash2, UserCog, UserPlus, UsersRound } from "lucide-react";
import { AdminFetchError, adminFetch, clearAdminToken } from "@/lib/adminAuth";

const fields = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "OPENAI_API_KEY",
  "WHATSAPP_CLOUD_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

const modules = ["dashboard", "buscas", "crm", "agenda", "relatorios", "integracoes", "admin"];
const accessLevels = [
  { key: "read_only", label: "Somente Leitura", color: "border-emerald-400 bg-emerald-500/10 text-emerald-200" },
  { key: "read_edit", label: "Leitura e Edição", color: "border-blue-400 bg-blue-500/10 text-blue-200" },
  { key: "full", label: "Acesso Total", color: "border-yellow-300 bg-yellow-400/10 text-yellow-100" },
  { key: "restricted", label: "Restrito", color: "border-rose-400 bg-rose-500/10 text-rose-100" }
] as const;

type Tab = "users" | "roles" | "access" | "audit" | "apis";
type ApiKeyStatus = { key: string; configured: boolean; source: string; masked: string; updatedAt: string | null };
type AdminUserRole = "owner" | "admin" | "operator" | "viewer";
type AdminUser = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: AdminUserRole;
  active: boolean;
  customRoleId?: string | null;
  status?: string;
  lastActiveAt?: string | null;
  visibilityLevel?: string;
  modulePermissions?: Record<string, unknown>;
  createdAt: string;
};
type CustomRole = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
  color: string;
  created_at: string;
  updated_at: string;
};
type AuditRow = {
  id: string;
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  file_type?: string;
  file_name?: string;
  created_at: string;
};

const roleLabels: Record<AdminUserRole, string> = {
  owner: "Owner",
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador"
};

const defaultPermissions = Object.fromEntries(modules.map((item) => [item, true]));

export function AdminClient() {
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Carregando painel administrativo...");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditRow[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<AuditRow[]>([]);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [cleanupConfirm, setCleanupConfirm] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator" as AdminUserRole,
    customRoleId: "",
    visibilityLevel: "read_edit",
    modulePermissions: defaultPermissions
  });
  const [roleForm, setRoleForm] = useState({ name: "", description: "", color: "#1E6FDB", permissions: defaultPermissions });

  const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);

  async function load() {
    try {
      await adminFetch("/admin/status");
      const [data, userData, roleData, auditData] = await Promise.all([
        adminFetch<{ keys: ApiKeyStatus[] }>("/admin/api-keys"),
        adminFetch<{ users: AdminUser[] }>("/admin/users"),
        adminFetch<{ roles: CustomRole[] }>("/admin/roles"),
        adminFetch<{ activityLogs: AuditRow[]; downloadLogs: AuditRow[] }>("/admin/audit")
      ]);
      setKeys(Array.isArray(data.keys) ? data.keys : []);
      setUsers(Array.isArray(userData.users) ? userData.users : []);
      setRoles(Array.isArray(roleData.roles) ? roleData.roles : []);
      setActivityLogs(Array.isArray(auditData.activityLogs) ? auditData.activityLogs : []);
      setDownloadLogs(Array.isArray(auditData.downloadLogs) ? auditData.downloadLogs : []);
      setAuthorized(true);
      setMessage("Painel administrativo conectado.");
    } catch (error) {
      setAuthorized(false);
      if (error instanceof AdminFetchError && error.status === 403) {
        setMessage("Acesso negado. Seu perfil não tem permissão de administrador.");
      } else if (error instanceof AdminFetchError && error.status === 401) {
        clearAdminToken();
        void fetch("/api/auth/session", { method: "DELETE" });
        setMessage("Sessão expirada. Faça login novamente para acessar o painel.");
      } else {
        setMessage(error instanceof Error && error.message !== "Unexpected error" ? error.message : "Não foi possível carregar o painel administrativo agora. Faça login novamente ou tente em instantes.");
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = await adminFetch<{ keys: ApiKeyStatus[]; message: string }>("/admin/api-keys", {
        method: "PATCH",
        body: JSON.stringify({ values })
      });
      setKeys(payload.keys);
      setValues({});
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar chaves.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearAdminToken();
    void fetch("/api/auth/session", { method: "DELETE" });
    location.href = "/login";
  }

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTemporaryPassword("");
    setMessage("");
    try {
      const payload = await adminFetch<{ user: AdminUser; temporaryPassword: string; message: string }>("/admin/users/invite", {
        method: "POST",
        body: JSON.stringify({
          ...userForm,
          customRoleId: userForm.customRoleId || null,
          password: userForm.password || undefined
        })
      });
      setUsers((current) => [...current, payload.user]);
      setTemporaryPassword(payload.temporaryPassword);
      setUserForm({ name: "", email: "", password: "", role: "operator", customRoleId: "", visibilityLevel: "read_edit", modulePermissions: defaultPermissions });
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar usuário.");
    }
  }

  async function updateUser(user: AdminUser, updates: Partial<AdminUser> & { password?: string }) {
    const payload = await adminFetch<{ user: AdminUser; message: string }>(`/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
    setUsers((current) => current.map((item) => item.id === user.id ? payload.user : item));
    setMessage(payload.message);
  }

  async function deactivateUser(user: AdminUser) {
    if (!confirm(`Desativar acesso de ${user.name}?`)) return;
    try {
      await updateUser(user, { active: false, status: "inactive" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao desativar usuário.");
    }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = await adminFetch<{ role: CustomRole; message: string }>("/admin/roles", {
        method: "POST",
        body: JSON.stringify(roleForm)
      });
      setRoles((current) => [...current, payload.role]);
      setRoleForm({ name: "", description: "", color: "#1E6FDB", permissions: defaultPermissions });
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar cargo.");
    }
  }

  async function deleteRole(role: CustomRole) {
    if (!confirm(`Excluir cargo ${role.name}?`)) return;
    try {
      await adminFetch(`/admin/roles/${role.id}`, { method: "DELETE" });
      setRoles((current) => current.filter((item) => item.id !== role.id));
      setMessage("Cargo removido.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao remover cargo.");
    }
  }

  async function cleanupDemoData() {
    setCleanupLoading(true);
    setMessage("");
    try {
      const payload = await adminFetch<{ deleted: number; message: string }>("/admin/cleanup-demo-data", {
        method: "POST",
        body: JSON.stringify({ confirm: cleanupConfirm })
      });
      setCleanupConfirm("");
      setMessage(payload.message || `${payload.deleted} registro(s) removido(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao limpar dados de demonstração.");
    } finally {
      setCleanupLoading(false);
    }
  }

  if (!authorized) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="text-white">{message}</p>
          <p className="mt-3 text-sm text-slate-400">Use uma conta com perfil Owner ou Administrador para liberar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="overflow-hidden rounded-xl border border-electric/30 bg-panel shadow-glow">
        <div className="grid gap-6 p-6 lg:grid-cols-[330px_1fr]">
          <div className="rounded-2xl border border-electric/20 bg-electric/10 p-4">
            <Image src="/nodere-wordmark.png" alt="NODERE" width={500} height={180} priority className="h-auto w-full rounded-xl object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Modo administrador</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Acessos, auditoria e integrações</h1>
              </div>
              <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-slate-200 hover:text-white">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Cadastre usuários por workspace, controle permissões e valide as integrações. Valores sensíveis continuam mascarados e nunca são retornados completos.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          ["users", UsersRound, "Usuários"],
          ["roles", UserCog, "Cargos e Funções"],
          ["access", SlidersHorizontal, "Limite de Acesso"],
          ["audit", Activity, "Auditoria"],
          ["apis", KeyRound, "APIs"]
        ].map(([key, Icon, label]) => (
          <button key={String(key)} onClick={() => setActiveTab(key as Tab)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${activeTab === key ? "bg-electric text-white shadow-glow" : "border border-line bg-panel text-slate-300 hover:border-electric/60"}`}>
            <Icon className="h-4 w-4" />
            {String(label)}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <section className="rounded-xl border border-line bg-panel/90 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Usuários e senhas</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Cada usuário acessa apenas a própria conta/workspace. Use senha temporária quando preferir convite rápido.</p>
            </div>
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">{activeUsers.length} ativo(s)</span>
          </div>

          <form onSubmit={inviteUser} className="mt-5 grid gap-3 rounded-xl border border-line bg-ink/80 p-4 xl:grid-cols-[1fr_1fr_170px_170px_180px_auto]">
            <input required value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome" className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric" />
            <input required type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail/login" className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric" />
            <input minLength={8} type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} placeholder="Senha opcional" className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric" />
            <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as AdminUserRole }))} className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric">
              {Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select value={userForm.customRoleId} onChange={(event) => setUserForm((current) => ({ ...current, customRoleId: event.target.value }))} className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric">
              <option value="">Sem cargo personalizado</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
              <UserPlus className="h-4 w-4" />
              Criar
            </button>
          </form>
          {temporaryPassword && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              Senha temporária: <code className="rounded bg-black/30 px-2 py-1">{temporaryPassword}</code>
              <button onClick={() => navigator.clipboard.writeText(temporaryPassword)} className="inline-flex items-center gap-1 rounded bg-amber-300 px-2 py-1 text-xs font-bold text-slate-950"><Copy className="h-3 w-3" /> Copiar</button>
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-ink text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Acesso</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className="text-slate-300">
                    <td className="px-4 py-3"><strong className="text-white">{user.name}</strong><br /><span className="text-xs text-slate-500">{user.email}</span></td>
                    <td className="px-4 py-3">{roleLabels[user.role]}</td>
                    <td className="px-4 py-3">{roles.find((role) => role.id === user.customRoleId)?.name || "Padrão"}</td>
                    <td className="px-4 py-3">{accessLevels.find((item) => item.key === user.visibilityLevel)?.label || "Leitura e Edição"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active ? "bg-success/15 text-success" : "bg-rose-500/15 text-rose-300"}`}>{user.active ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void updateUser(user, { visibilityLevel: user.visibilityLevel === "full" ? "read_edit" : "full" })} className="rounded-lg border border-line px-3 py-2 text-xs text-slate-200">Alternar acesso</button>
                        {user.active && <button onClick={() => void deactivateUser(user)} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"><Trash2 className="h-3 w-3" /> Desativar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "roles" && (
        <section className="rounded-xl border border-line bg-panel/90 p-5">
          <h2 className="text-lg font-semibold text-white">Cargos e funções</h2>
          <form onSubmit={createRole} className="mt-4 grid gap-3 rounded-xl border border-line bg-ink p-4 lg:grid-cols-[1fr_1fr_140px_auto]">
            <input required value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do cargo" className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric" />
            <input value={roleForm.description} onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descrição" className="rounded-lg border border-line bg-panel px-3 py-3 text-sm outline-none focus:border-electric" />
            <input type="color" value={roleForm.color} onChange={(event) => setRoleForm((current) => ({ ...current, color: event.target.value }))} className="h-12 rounded-lg border border-line bg-panel px-2" />
            <button className="rounded-lg bg-electric px-4 py-3 text-sm font-bold text-white">Criar cargo</button>
          </form>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="rounded-xl border border-line bg-ink p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex h-3 w-10 rounded-full" style={{ backgroundColor: role.color }} />
                    <h3 className="mt-3 font-bold text-white">{role.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{role.description || "Sem descrição"}</p>
                  </div>
                  <button onClick={() => void deleteRole(role)} className="rounded-lg border border-rose-500/30 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {modules.map((item) => <span key={item} className="rounded border border-line px-2 py-1 text-slate-300">{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "access" && (
        <section className="rounded-xl border border-line bg-panel/90 p-5">
          <h2 className="text-lg font-semibold text-white">Limite de acesso</h2>
          <div className="mt-4 grid gap-4 xl:grid-cols-4">
            {accessLevels.map((level) => (
              <div key={level.key} className={`rounded-xl border p-4 ${level.color}`}>
                <h3 className="font-bold">{level.label}</h3>
                <div className="mt-3 space-y-3">
                  {users.filter((user) => (user.visibilityLevel || "read_edit") === level.key).map((user) => (
                    <div key={user.id} className="rounded-lg bg-black/20 p-3">
                      <p className="font-semibold text-white">{user.name}</p>
                      <select value={user.visibilityLevel || "read_edit"} onChange={(event) => void updateUser(user, { visibilityLevel: event.target.value })} className="mt-2 w-full rounded border border-white/20 bg-slate-950 px-2 py-2 text-xs text-white">
                        {accessLevels.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "audit" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Limpar dados de demonstração</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-rose-100/80">
                  Remove somente empresas deste workspace com <code>source</code> nulo, <code>demo</code> ou <code>test</code>. Leads reais marcados como Google Places, manual ou importação são preservados.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={cleanupConfirm}
                  onChange={(event) => setCleanupConfirm(event.target.value)}
                  placeholder="Digite CONFIRMO"
                  className="rounded-lg border border-rose-400/40 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-rose-300"
                />
                <button
                  onClick={() => void cleanupDemoData()}
                  disabled={cleanupLoading || cleanupConfirm !== "CONFIRMO"}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {cleanupLoading ? "Limpando..." : "Limpar demo"}
                </button>
              </div>
            </div>
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <AuditPanel title="Atividades" rows={activityLogs} empty="Nenhuma atividade registrada." />
            <AuditPanel title="Downloads" rows={downloadLogs} empty="Nenhum download registrado." />
          </section>
        </div>
      )}

      {activeTab === "apis" && (
        <>
          <section className="rounded-xl border border-line bg-panel/90 p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan" /><h2 className="text-lg font-semibold text-white">Status atual</h2></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {keys.map((item) => (
                <div key={item.key} className="rounded-lg border border-line bg-ink p-4">
                  <p className="break-all text-xs font-semibold text-slate-300">{item.key}</p>
                  <p className={`mt-3 text-sm font-medium ${item.configured ? "text-success" : "text-amber-300"}`}>{item.configured ? "Configurada" : "Pendente"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.source}</p>
                  {item.masked && <p className="mt-2 font-mono text-xs text-cyan">{item.masked}</p>}
                </div>
              ))}
            </div>
          </section>
          <form onSubmit={save} className="rounded-xl border border-line bg-panel/90 p-5">
            <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-cyan" /><h2 className="text-lg font-semibold text-white">Cadastrar ou atualizar APIs</h2></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {fields.map((field) => (
                <label key={field} className="space-y-2 text-sm text-slate-300">
                  {field}
                  <input value={values[field] || ""} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} type="password" placeholder="Cole a chave aqui para atualizar" className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-electric" />
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar APIs"}
              </button>
              <button type="button" onClick={() => navigator.clipboard.writeText("https://nodere-api.onrender.com")} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-slate-200">
                <Copy className="h-4 w-4" />
                Copiar URL backend
              </button>
              <span className="text-sm text-slate-400">{message}</span>
            </div>
          </form>
        </>
      )}

      {activeTab !== "apis" && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}

function AuditPanel({ title, rows, empty }: { title: string; rows: AuditRow[]; empty: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">{empty}</p>}
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-line bg-ink p-4 text-sm">
            <p className="font-semibold text-white">{row.action || row.file_name || row.file_type || "Registro"}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(row.created_at).toLocaleString("pt-BR")} · {row.entity_type || row.entity_id || row.user_id || "Sistema"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
